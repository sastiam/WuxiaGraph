import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { createDatabase } from '../../src/infrastructure/database.js';
import { SqliteCheckpointRepository } from '../../src/infrastructure/repositories/checkpointRepository.js';
import { WorkerQueue } from '../../src/domain/ingestion/workerQueue.js';
import type { StructuredChapter, ChapterProcessItem } from '../../src/domain/ingestion/index.js';

describe('Task #40: Batch Worker Queue & Checkpoints (WXG-027)', () => {
  let db: DatabaseSync;
  let checkpointRepo: SqliteCheckpointRepository;

  const sampleChapters: StructuredChapter[] = [
    {
      chapterIndex: 1,
      title: 'Capítulo 1: El Despertar del Guerrero',
      rawContent: 'Xiao Chen abrió los ojos en la montaña nevada. El viento gélido soplaba con fuerza sobre su túnica azul.',
      startPage: 1,
      endPage: 2,
      wordCount: 20,
    },
    {
      chapterIndex: 2,
      title: 'Capítulo 2: El Encuentro con el Maestro',
      rawContent: 'Un anciano de túnica blanca apareció entre la niebla sagrada. Sostenía un bastón de bambú milenario.',
      startPage: 3,
      endPage: 4,
      wordCount: 18,
    },
    {
      chapterIndex: 3,
      title: 'Capítulo 3: El Secreto del Dragón',
      rawContent: 'En la cueva profunda, la espada celestial comenzó a resonar con un brillo dorado fulgurante.',
      startPage: 5,
      endPage: 6,
      wordCount: 16,
    },
  ];

  beforeEach(() => {
    db = createDatabase(':memory:');
    checkpointRepo = new SqliteCheckpointRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('SqliteCheckpointRepository Persistence', () => {
    it('debe guardar, consultar y actualizar checkpoints correctamente', async () => {
      const jobId = 'job-test-01';
      const bookTitle = 'Novela Celestial';

      // 1. Guardar estado inicial IN_PROGRESS
      await checkpointRepo.saveCheckpoint({
        jobId,
        bookTitle,
        chapterIndex: 1,
        status: 'IN_PROGRESS',
      });

      let cp = await checkpointRepo.getCheckpoint(jobId, 1);
      expect(cp).not.toBeNull();
      expect(cp?.status).toBe('IN_PROGRESS');
      expect(cp?.bookTitle).toBe(bookTitle);

      // 2. Actualizar a COMPLETED
      await checkpointRepo.saveCheckpoint({
        jobId,
        bookTitle,
        chapterIndex: 1,
        status: 'COMPLETED',
      });

      cp = await checkpointRepo.getCheckpoint(jobId, 1);
      expect(cp?.status).toBe('COMPLETED');

      // 3. Consultar capítulos completados
      const completed = await checkpointRepo.getCompletedChapterIndices(jobId);
      expect(completed).toEqual([1]);
    });

    it('debe registrar y recuperar errores en checkpoints fallidos', async () => {
      const jobId = 'job-fail-01';

      await checkpointRepo.saveCheckpoint({
        jobId,
        bookTitle: 'Libro Erróneo',
        chapterIndex: 2,
        status: 'FAILED',
        errorMessage: 'Error de parseo sintáctico',
      });

      const cp = await checkpointRepo.getCheckpoint(jobId, 2);
      expect(cp).not.toBeNull();
      expect(cp?.status).toBe('FAILED');
      expect(cp?.errorMessage).toBe('Error de parseo sintáctico');
    });

    it('debe listar checkpoints por trabajo y eliminar por jobId', async () => {
      const jobId = 'job-multi-01';

      await checkpointRepo.saveCheckpoint({ jobId, bookTitle: 'Book A', chapterIndex: 1, status: 'COMPLETED' });
      await checkpointRepo.saveCheckpoint({ jobId, bookTitle: 'Book A', chapterIndex: 2, status: 'COMPLETED' });

      const allCps = await checkpointRepo.getCheckpointsByJob(jobId);
      expect(allCps.length).toBe(2);

      await checkpointRepo.deleteCheckpointsByJob(jobId);
      const afterDelete = await checkpointRepo.getCheckpointsByJob(jobId);
      expect(afterDelete.length).toBe(0);
    });
  });

  describe('WorkerQueue Processing & Sliding Window', () => {
    it('debe procesar capítulos secuencialmente con ventana deslizante de overlap', async () => {
      const queue = new WorkerQueue({
        checkpointRepository: checkpointRepo,
        overlapChars: 30,
      });

      const processedItems: ChapterProcessItem[] = [];

      const summary = await queue.processJob({
        jobId: 'job-queue-01',
        bookTitle: 'Saga Wuxia',
        chapters: sampleChapters,
        processor: async (item) => {
          processedItems.push(item);
        },
      });

      expect(summary.status).toBe('COMPLETED');
      expect(summary.totalChapters).toBe(3);
      expect(summary.processedChapters).toBe(3);
      expect(summary.skippedChapters).toBe(0);
      expect(summary.failedChapters).toBe(0);
      expect(summary.completedChapterIndices).toEqual([1, 2, 3]);

      // Verificar ventana deslizante (overlap)
      // Capítulo 1: sin contexto previo
      expect(processedItems[0].previousContext).toBe('');
      expect(processedItems[0].combinedText).toBe(sampleChapters[0].rawContent);

      // Capítulo 2: contexto previo son los últimos 30 caracteres del capítulo 1
      const expectedOverlapCap1 = sampleChapters[0].rawContent.slice(-30);
      expect(processedItems[1].previousContext).toBe(expectedOverlapCap1);
      expect(processedItems[1].combinedText).toContain(expectedOverlapCap1);
      expect(processedItems[1].combinedText).toContain(sampleChapters[1].rawContent);
    });

    it('debe reanudar desde el último capítulo completado exitosamente', async () => {
      const jobId = 'job-resume-01';
      const bookTitle = 'Novela de Reanudación';

      // Simular que el capítulo 1 ya fue procesado y guardado en la BD
      await checkpointRepo.saveCheckpoint({
        jobId,
        bookTitle,
        chapterIndex: 1,
        status: 'COMPLETED',
      });

      const queue = new WorkerQueue({ checkpointRepository: checkpointRepo, overlapChars: 25 });
      const processedIndices: number[] = [];

      const summary = await queue.processJob({
        jobId,
        bookTitle,
        chapters: sampleChapters,
        resumeFromCheckpoint: true,
        processor: async (item) => {
          processedIndices.push(item.chapter.chapterIndex);
        },
      });

      expect(summary.status).toBe('PARTIAL');
      expect(summary.skippedChapters).toBe(1);
      expect(summary.processedChapters).toBe(2);
      expect(processedIndices).toEqual([2, 3]);

      // Verificar que los checkpoints en BD reflejan todos completados
      const completed = await checkpointRepo.getCompletedChapterIndices(jobId);
      expect(completed).toEqual([1, 2, 3]);
    });

    it('debe capturar errores en procesador y registrar estado FAILED en el checkpoint', async () => {
      const jobId = 'job-error-01';
      const queue = new WorkerQueue({ checkpointRepository: checkpointRepo });

      await expect(
        queue.processJob({
          jobId,
          bookTitle: 'Libro con Fallo',
          chapters: sampleChapters,
          processor: async (item) => {
            if (item.chapter.chapterIndex === 2) {
              throw new Error('Fallo simulado en capítulo 2');
            }
          },
        })
      ).rejects.toThrow('Fallo simulado en capítulo 2');

      const cp1 = await checkpointRepo.getCheckpoint(jobId, 1);
      const cp2 = await checkpointRepo.getCheckpoint(jobId, 2);

      expect(cp1?.status).toBe('COMPLETED');
      expect(cp2?.status).toBe('FAILED');
      expect(cp2?.errorMessage).toBe('Fallo simulado en capítulo 2');
    });

    it('debe manejar adecuadamente una lista vacía de capítulos', async () => {
      const queue = new WorkerQueue({ checkpointRepository: checkpointRepo });

      const summary = await queue.processJob({
        jobId: 'job-empty',
        bookTitle: 'Libro Vacío',
        chapters: [],
      });

      expect(summary.totalChapters).toBe(0);
      expect(summary.processedChapters).toBe(0);
      expect(summary.status).toBe('COMPLETED');
    });
  });
});
