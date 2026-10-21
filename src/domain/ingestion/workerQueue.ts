import type { StructuredChapter } from './chapterSplitter.js';
import type {
  ICheckpointRepository,
  ChapterProcessItem,
  WorkerQueueOptions,
  ProcessJobOptions,
  JobSummary,
} from './types.js';
import type { IWipGovernanceRepository } from '../governance/repository.js';
import { validateCircuitBreaker } from '../governance/service.js';
import { WipLimitExceededError } from '../governance/errors.js';

/**
 * Cola de trabajo asíncrona para procesamiento en lote por capítulos con ventana deslizante (context overlap)
 * e integración estricta con Circuit Breaker de Gobernanza WIP y persistencia de checkpoints.
 * Cumple con Clean Architecture (Dominio Puro, sin dependencias de infraestructura).
 */
export class WorkerQueue {
  private readonly checkpointRepo: ICheckpointRepository;
  private readonly defaultOverlapChars: number;
  private readonly defaultGovernanceRepo?: IWipGovernanceRepository;
  private readonly defaultHoursPerChapter: number;
  private readonly defaultPauseOnWipLimit: boolean;
  private readonly onChapterSuccess?: (jobId: string, chapter: StructuredChapter) => Promise<void> | void;
  private readonly onChapterError?: (jobId: string, chapter: StructuredChapter, error: Error) => Promise<void> | void;
  private readonly onWipLimitReached?: (jobId: string, chapter: StructuredChapter, error: WipLimitExceededError) => Promise<void> | void;

  constructor(options: WorkerQueueOptions) {
    if (!options.checkpointRepository) {
      throw new Error('WorkerQueue requiere un ICheckpointRepository válido');
    }
    this.checkpointRepo = options.checkpointRepository;
    this.defaultGovernanceRepo = options.governanceRepository;
    this.defaultOverlapChars = options.overlapChars ?? 500;
    this.defaultHoursPerChapter = options.hoursPerChapter ?? 0;
    this.defaultPauseOnWipLimit = options.pauseOnWipLimit ?? false;
    this.onChapterSuccess = options.onChapterSuccess;
    this.onChapterError = options.onChapterError;
    this.onWipLimitReached = options.onWipLimitReached;
  }

  /**
   * Procesa un lote de capítulos con ventana deslizante de contexto y guardado automático de checkpoints.
   * Admite reanudación desde el último chapter_index exitoso y bloqueo/pausa por gobernanza WIP (Circuit Breaker).
   */
  async processJob(options: ProcessJobOptions): Promise<JobSummary> {
    const {
      jobId,
      bookTitle,
      chapters,
      processor,
      overlapChars = this.defaultOverlapChars,
      resumeFromCheckpoint = true,
      governanceRepository = this.defaultGovernanceRepo,
      hoursPerChapter = this.defaultHoursPerChapter,
      pauseOnWipLimit = this.defaultPauseOnWipLimit,
    } = options;

    if (!jobId || !bookTitle) {
      throw new Error('jobId y bookTitle son obligatorios para procesar un trabajo');
    }

    if (!chapters || chapters.length === 0) {
      return {
        jobId,
        bookTitle,
        totalChapters: 0,
        processedChapters: 0,
        skippedChapters: 0,
        failedChapters: 0,
        status: 'COMPLETED',
        completedChapterIndices: [],
      };
    }

    // Ordenar capítulos secuencialmente por su índice
    const sortedChapters = [...chapters].sort((a, b) => a.chapterIndex - b.chapterIndex);

    // Obtener capítulos previamente completados si está habilitada la reanudación
    const completedSet = new Set<number>();
    if (resumeFromCheckpoint) {
      const completedIndices = await this.checkpointRepo.getCompletedChapterIndices(jobId);
      for (const idx of completedIndices) {
        completedSet.add(idx);
      }
    }

    let processedChapters = 0;
    let skippedChapters = 0;
    let failedChapters = 0;
    const completedChapterIndices: number[] = Array.from(completedSet);

    let previousChapterText = '';

    const buildSummary = (
      status: JobSummary['status'],
      lockedReason?: string
    ): JobSummary => {
      const sortedCompleted = completedChapterIndices.sort((a, b) => a - b);
      const lastProcessedChapterIndex =
        sortedCompleted.length > 0 ? Math.max(...sortedCompleted) : undefined;
      const lastProcessedChapterId =
        lastProcessedChapterIndex !== undefined ? `chapter-${lastProcessedChapterIndex}` : undefined;

      return {
        jobId,
        bookTitle,
        totalChapters: sortedChapters.length,
        processedChapters,
        skippedChapters,
        failedChapters,
        status,
        completedChapterIndices: sortedCompleted,
        lastProcessedChapterIndex,
        lastProcessedChapterId,
        lockedReason,
      };
    };

    for (let i = 0; i < sortedChapters.length; i++) {
      const chapter = sortedChapters[i];
      const isCompleted = completedSet.has(chapter.chapterIndex);

      if (isCompleted) {
        skippedChapters++;
        previousChapterText = chapter.rawContent;
        continue;
      }

      // Verificación previa de Circuit Breaker de Gobernanza WIP antes de procesar el capítulo
      if (governanceRepository) {
        const ledger = await governanceRepository.getOrCreateCurrentWeekLedger();
        try {
          validateCircuitBreaker(ledger);
        } catch (err: unknown) {
          if (
            err instanceof WipLimitExceededError ||
            (err as { code?: string })?.code === 'LOCKED_BY_WIP'
          ) {
            const wipError =
              err instanceof WipLimitExceededError
                ? err
                : new WipLimitExceededError(ledger.totalHoursLogged, 0, ledger.maxBudgetHours);

            await this.checkpointRepo.saveCheckpoint({
              jobId,
              bookTitle,
              chapterIndex: chapter.chapterIndex,
              status: 'PAUSED',
              errorMessage: wipError.message,
            });

            if (this.onWipLimitReached) {
              await this.onWipLimitReached(jobId, chapter, wipError);
            }

            if (pauseOnWipLimit) {
              return buildSummary('LOCKED_BY_WIP', wipError.message);
            }

            throw wipError;
          }
          throw err;
        }
      }

      // Extraer ventana deslizante (overlap) del contexto del capítulo anterior
      let previousContext = '';
      if (previousChapterText && overlapChars > 0) {
        previousContext = previousChapterText.slice(-overlapChars);
      } else if (!previousChapterText && i > 0 && overlapChars > 0) {
        // En caso de reanudación sin contexto en memoria, tomar el fragmento final del capítulo previo en la lista
        const prevChapterInList = sortedChapters[i - 1];
        if (prevChapterInList && prevChapterInList.rawContent) {
          previousContext = prevChapterInList.rawContent.slice(-overlapChars);
        }
      }

      const combinedText = previousContext
        ? `${previousContext}\n\n${chapter.rawContent}`
        : chapter.rawContent;

      const item: ChapterProcessItem = {
        chapter,
        previousContext,
        combinedText,
      };

      // Registrar estado IN_PROGRESS
      await this.checkpointRepo.saveCheckpoint({
        jobId,
        bookTitle,
        chapterIndex: chapter.chapterIndex,
        status: 'IN_PROGRESS',
      });

      try {
        if (processor) {
          await processor(item);
        }

        // Si se especificaron horas por capítulo, imputarlas en el ledger de gobernanza WIP
        if (governanceRepository && hoursPerChapter > 0) {
          const ledger = await governanceRepository.getOrCreateCurrentWeekLedger();
          await governanceRepository.logHours(ledger.weekStartDate, hoursPerChapter);
        }

        // Registrar estado COMPLETED tras éxito
        await this.checkpointRepo.saveCheckpoint({
          jobId,
          bookTitle,
          chapterIndex: chapter.chapterIndex,
          status: 'COMPLETED',
        });

        processedChapters++;
        completedChapterIndices.push(chapter.chapterIndex);
        completedSet.add(chapter.chapterIndex);
        previousChapterText = chapter.rawContent;

        if (this.onChapterSuccess) {
          await this.onChapterSuccess(jobId, chapter);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        const isWip =
          error instanceof WipLimitExceededError ||
          (error as { code?: string })?.code === 'LOCKED_BY_WIP';

        if (isWip) {
          const wipError =
            error instanceof WipLimitExceededError
              ? error
              : new WipLimitExceededError(0, 0, 4.0);

          await this.checkpointRepo.saveCheckpoint({
            jobId,
            bookTitle,
            chapterIndex: chapter.chapterIndex,
            status: 'PAUSED',
            errorMessage: wipError.message,
          });

          if (this.onWipLimitReached) {
            await this.onWipLimitReached(jobId, chapter, wipError);
          }

          if (pauseOnWipLimit) {
            return buildSummary('LOCKED_BY_WIP', wipError.message);
          }

          throw wipError;
        }

        failedChapters++;
        await this.checkpointRepo.saveCheckpoint({
          jobId,
          bookTitle,
          chapterIndex: chapter.chapterIndex,
          status: 'FAILED',
          errorMessage: error.message,
        });

        if (this.onChapterError) {
          await this.onChapterError(jobId, chapter, error);
        }

        throw error;
      }
    }

    let jobStatus: JobSummary['status'] = 'COMPLETED';
    if (failedChapters > 0) {
      jobStatus = 'FAILED';
    } else if (skippedChapters > 0 && processedChapters > 0) {
      jobStatus = 'PARTIAL';
    }

    return buildSummary(jobStatus);
  }

  /**
   * Reanuda la ejecución de un trabajo desde el último checkpoint completado.
   */
  async resumeJob(options: Omit<ProcessJobOptions, 'resumeFromCheckpoint'>): Promise<JobSummary> {
    return this.processJob({
      ...options,
      resumeFromCheckpoint: true,
    });
  }
}

export const BatchWorkerQueue = WorkerQueue;
