import type { StructuredChapter } from './chapterSplitter.js';
import type {
  ICheckpointRepository,
  ChapterProcessItem,
  WorkerQueueOptions,
  ProcessJobOptions,
  JobSummary,
} from './types.js';

/**
 * Cola de trabajo asíncrona para procesamiento en lote por capítulos con ventana deslizante (context overlap).
 * Cumple con Clean Architecture (Dominio Puro, sin dependencias de infraestructura).
 */
export class WorkerQueue {
  private readonly checkpointRepo: ICheckpointRepository;
  private readonly defaultOverlapChars: number;
  private readonly onChapterSuccess?: (jobId: string, chapter: StructuredChapter) => Promise<void> | void;
  private readonly onChapterError?: (jobId: string, chapter: StructuredChapter, error: Error) => Promise<void> | void;

  constructor(options: WorkerQueueOptions) {
    if (!options.checkpointRepository) {
      throw new Error('WorkerQueue requiere un ICheckpointRepository válido');
    }
    this.checkpointRepo = options.checkpointRepository;
    this.defaultOverlapChars = options.overlapChars ?? 500;
    this.onChapterSuccess = options.onChapterSuccess;
    this.onChapterError = options.onChapterError;
  }

  /**
   * Procesa un lote de capítulos con ventana deslizante de contexto y guardado automático de checkpoints.
   * Admite reanudación desde el último chapter_index exitoso.
   */
  async processJob(options: ProcessJobOptions): Promise<JobSummary> {
    const {
      jobId,
      bookTitle,
      chapters,
      processor,
      overlapChars = this.defaultOverlapChars,
      resumeFromCheckpoint = true,
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

    for (let i = 0; i < sortedChapters.length; i++) {
      const chapter = sortedChapters[i];
      const isCompleted = completedSet.has(chapter.chapterIndex);

      if (isCompleted) {
        skippedChapters++;
        previousChapterText = chapter.rawContent;
        continue;
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
        failedChapters++;
        const error = err instanceof Error ? err : new Error(String(err));

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

    let jobStatus: 'COMPLETED' | 'FAILED' | 'PARTIAL' = 'COMPLETED';
    if (failedChapters > 0) {
      jobStatus = 'FAILED';
    } else if (skippedChapters > 0 && processedChapters > 0) {
      jobStatus = 'PARTIAL';
    }

    return {
      jobId,
      bookTitle,
      totalChapters: sortedChapters.length,
      processedChapters,
      skippedChapters,
      failedChapters,
      status: jobStatus,
      completedChapterIndices: completedChapterIndices.sort((a, b) => a - b),
    };
  }
}

export const BatchWorkerQueue = WorkerQueue;
