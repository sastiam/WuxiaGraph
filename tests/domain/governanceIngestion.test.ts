import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { createDatabase } from '../../src/infrastructure/database.js';
import { SqliteCheckpointRepository } from '../../src/infrastructure/repositories/checkpointRepository.js';
import { SqliteWipGovernanceRepository } from '../../src/infrastructure/sqlite-wip-governance.repository.js';
import { WorkerQueue } from '../../src/domain/ingestion/workerQueue.js';
import type { StructuredChapter } from '../../src/domain/ingestion/index.js';
import { WipLimitExceededError } from '../../src/domain/governance/index.js';

describe('Task #43: Circuit Breaker de Gobernanza WIP con Checkpoint Save/Resume (WXG-030)', () => {
  let db: DatabaseSync;
  let checkpointRepo: SqliteCheckpointRepository;
  let governanceRepo: SqliteWipGovernanceRepository;

  const sampleChapters: StructuredChapter[] = [
    {
      chapterIndex: 1,
      title: 'Capítulo 1: El Despertar del Guerrero',
      rawContent: 'Xiao Chen abrió los ojos en la montaña nevada. El viento gélido soplaba con fuerza.',
      startPage: 1,
      endPage: 2,
      wordCount: 20,
    },
    {
      chapterIndex: 2,
      title: 'Capítulo 2: El Encuentro con el Maestro',
      rawContent: 'Un anciano de túnica blanca apareció entre la niebla sagrada. Sostenía un bastón de bambú.',
      startPage: 3,
      endPage: 4,
      wordCount: 18,
    },
    {
      chapterIndex: 3,
      title: 'Capítulo 3: El Secreto del Dragón',
      rawContent: 'En la cueva profunda, la espada celestial comenzó a resonar con un brillo dorado.',
      startPage: 5,
      endPage: 6,
      wordCount: 16,
    },
    {
      chapterIndex: 4,
      title: 'Capítulo 4: El Reino Celestial',
      rawContent: 'Las nubes se abrieron revelando el palacio inmortal flotando sobre el abismo.',
      startPage: 7,
      endPage: 8,
      wordCount: 15,
    },
  ];

  beforeEach(() => {
    db = createDatabase(':memory:');
    checkpointRepo = new SqliteCheckpointRepository(db);
    governanceRepo = new SqliteWipGovernanceRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('debe activar el Circuit Breaker antes de procesar si el presupuesto WIP ya está excedido', async () => {
    // Simular ledger bloqueado con 4.5h acumuladas
    const currentWeek = await governanceRepo.getOrCreateCurrentWeekLedger();
    await governanceRepo.logHours(currentWeek.weekStartDate, 4.5).catch(() => {});

    let wipCallbackFired = false;

    const queue = new WorkerQueue({
      checkpointRepository: checkpointRepo,
      governanceRepository: governanceRepo,
      pauseOnWipLimit: true,
      onWipLimitReached: (_jobId, _chapter, error) => {
        wipCallbackFired = true;
        expect(error).toBeInstanceOf(WipLimitExceededError);
      },
    });

    const summary = await queue.processJob({
      jobId: 'job-wip-locked-01',
      bookTitle: 'Cultivo Inmortal',
      chapters: sampleChapters,
    });

    expect(summary.status).toBe('LOCKED_BY_WIP');
    expect(summary.processedChapters).toBe(0);
    expect(summary.lockedReason).toBeDefined();
    expect(wipCallbackFired).toBe(true);

    // Verificar que se guardó el checkpoint PAUSED para el primer capítulo no procesado
    const checkpoint = await checkpointRepo.getCheckpoint('job-wip-locked-01', 1);
    expect(checkpoint).not.toBeNull();
    expect(checkpoint?.status).toBe('PAUSED');
  });

  it('debe imputar horas por capítulo y pausar con LOCKED_BY_WIP al superar 4.0h a mitad del lote', async () => {
    const queue = new WorkerQueue({
      checkpointRepository: checkpointRepo,
      governanceRepository: governanceRepo,
      hoursPerChapter: 2.5, // 2 capítulos = 5.0h, superando el límite de 4.0h en el cap 2
      pauseOnWipLimit: true,
    });

    const summary = await queue.processJob({
      jobId: 'job-wip-mid-01',
      bookTitle: 'Cultivo Inmortal',
      chapters: sampleChapters,
    });

    expect(summary.status).toBe('LOCKED_BY_WIP');
    expect(summary.processedChapters).toBe(1);
    expect(summary.completedChapterIndices).toEqual([1]);
    expect(summary.lastProcessedChapterIndex).toBe(1);

    // Verificar checkpoints: Cap 1 COMPLETED, Cap 2 PAUSED
    const cp1 = await checkpointRepo.getCheckpoint('job-wip-mid-01', 1);
    expect(cp1?.status).toBe('COMPLETED');

    const cp2 = await checkpointRepo.getCheckpoint('job-wip-mid-01', 2);
    expect(cp2?.status).toBe('PAUSED');

    // Comprobar horas imputadas en el ledger
    const ledger = await governanceRepo.getOrCreateCurrentWeekLedger();
    expect(ledger.totalHoursLogged).toBeGreaterThanOrEqual(2.5);
  });

  it('debe reanudar la ingesta desde el checkpoint exacto cuando se libera la cuota WIP', async () => {
    // 1. Iniciar trabajo con 2.5h por capítulo (se bloqueará en cap 2)
    const queue = new WorkerQueue({
      checkpointRepository: checkpointRepo,
      governanceRepository: governanceRepo,
      hoursPerChapter: 2.5,
      pauseOnWipLimit: true,
    });

    const initialSummary = await queue.processJob({
      jobId: 'job-resume-01',
      bookTitle: 'Saga Celestial',
      chapters: sampleChapters,
    });

    expect(initialSummary.status).toBe('LOCKED_BY_WIP');
    expect(initialSummary.processedChapters).toBe(1);

    // 2. Simular reinicio/liberación de cuota WIP reseteando el ledger a 0.0h
    const currentWeek = await governanceRepo.getOrCreateCurrentWeekLedger();
    await governanceRepo.save({
      ...currentWeek,
      totalHoursLogged: 0,
      status: 'IN_LIMITS',
    });

    // 3. Crear cola sin imputación extra alta para permitir completar los capítulos restantes
    const queueResumed = new WorkerQueue({
      checkpointRepository: checkpointRepo,
      governanceRepository: governanceRepo,
      hoursPerChapter: 0.5,
      pauseOnWipLimit: true,
    });

    const resumedSummary = await queueResumed.resumeJob({
      jobId: 'job-resume-01',
      bookTitle: 'Saga Celestial',
      chapters: sampleChapters,
    });

    expect(resumedSummary.status).toBe('PARTIAL');
    expect(resumedSummary.skippedChapters).toBe(1); // Cap 1 ya estaba completado
    expect(resumedSummary.processedChapters).toBe(3); // Cap 2, 3 y 4 procesados
    expect(resumedSummary.completedChapterIndices).toEqual([1, 2, 3, 4]);

    // Verificar que todos los checkpoints estén COMPLETED
    const completed = await checkpointRepo.getCompletedChapterIndices('job-resume-01');
    expect(completed).toEqual([1, 2, 3, 4]);
  });

  it('debe lanzar WipLimitExceededError si pauseOnWipLimit es false al alcanzar el límite', async () => {
    const queue = new WorkerQueue({
      checkpointRepository: checkpointRepo,
      governanceRepository: governanceRepo,
      hoursPerChapter: 5.0, // Excede 4.0h en el primer capítulo
      pauseOnWipLimit: false,
    });

    await expect(
      queue.processJob({
        jobId: 'job-error-01',
        bookTitle: 'Libro Prohibido',
        chapters: sampleChapters,
      })
    ).rejects.toThrow(WipLimitExceededError);

    // El checkpoint debe estar registrado como PAUSED
    const cp = await checkpointRepo.getCheckpoint('job-error-01', 1);
    expect(cp?.status).toBe('PAUSED');
  });
});
