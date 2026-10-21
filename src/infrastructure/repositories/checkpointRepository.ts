import type { DatabaseSync } from 'node:sqlite';
import type {
  ICheckpointRepository,
  IngestionCheckpoint,
  CheckpointStatus,
} from '../../domain/ingestion/types.js';

export interface IngestionCheckpointRow {
  job_id: string;
  book_title: string;
  chapter_index: number;
  status: string;
  processed_at?: string;
  error_message?: string | null;
}

/**
 * Repositorio de Persistencia SQLite WAL para Checkpoints de Ingesta por Capítulo.
 * Gestiona inserción, actualización, consultas por trabajo y filtrado de capítulos completados.
 */
export class SqliteCheckpointRepository implements ICheckpointRepository {
  constructor(private readonly db: DatabaseSync) {
    this.ensureTable();
  }

  private ensureTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ingestion_checkpoints (
          job_id TEXT NOT NULL,
          book_title TEXT NOT NULL,
          chapter_index INTEGER NOT NULL,
          status TEXT NOT NULL,
          processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          error_message TEXT,
          PRIMARY KEY (job_id, chapter_index)
      );
      CREATE INDEX IF NOT EXISTS idx_ingestion_checkpoints_job ON ingestion_checkpoints(job_id, status);
    `);
  }

  async saveCheckpoint(checkpoint: IngestionCheckpoint): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO ingestion_checkpoints (
        job_id,
        book_title,
        chapter_index,
        status,
        processed_at,
        error_message
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(job_id, chapter_index) DO UPDATE SET
        book_title = excluded.book_title,
        status = excluded.status,
        processed_at = CURRENT_TIMESTAMP,
        error_message = excluded.error_message
    `);

    stmt.run(
      checkpoint.jobId,
      checkpoint.bookTitle,
      checkpoint.chapterIndex,
      checkpoint.status,
      checkpoint.errorMessage ?? null
    );
  }

  async getCheckpoint(jobId: string, chapterIndex: number): Promise<IngestionCheckpoint | null> {
    const stmt = this.db.prepare(`
      SELECT job_id, book_title, chapter_index, status, processed_at, error_message
      FROM ingestion_checkpoints
      WHERE job_id = ? AND chapter_index = ?
    `);

    const row = stmt.get(jobId, chapterIndex) as unknown as IngestionCheckpointRow | undefined;
    if (!row) {
      return null;
    }

    return this.mapRowToCheckpoint(row);
  }

  async getCheckpointsByJob(jobId: string): Promise<IngestionCheckpoint[]> {
    const stmt = this.db.prepare(`
      SELECT job_id, book_title, chapter_index, status, processed_at, error_message
      FROM ingestion_checkpoints
      WHERE job_id = ?
      ORDER BY chapter_index ASC
    `);

    const rows = stmt.all(jobId) as unknown as IngestionCheckpointRow[];
    return rows.map((row) => this.mapRowToCheckpoint(row));
  }

  async getCompletedChapterIndices(jobId: string): Promise<number[]> {
    const stmt = this.db.prepare(`
      SELECT chapter_index
      FROM ingestion_checkpoints
      WHERE job_id = ? AND status = 'COMPLETED'
      ORDER BY chapter_index ASC
    `);

    const rows = stmt.all(jobId) as unknown as { chapter_index: number }[];
    return rows.map((r) => r.chapter_index);
  }

  async getLatestCheckpoint(jobId: string): Promise<IngestionCheckpoint | null> {
    const stmt = this.db.prepare(`
      SELECT job_id, book_title, chapter_index, status, processed_at, error_message
      FROM ingestion_checkpoints
      WHERE job_id = ?
      ORDER BY processed_at DESC, chapter_index DESC
      LIMIT 1
    `);

    const row = stmt.get(jobId) as unknown as IngestionCheckpointRow | undefined;
    if (!row) {
      return null;
    }

    return this.mapRowToCheckpoint(row);
  }

  async deleteCheckpointsByJob(jobId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM ingestion_checkpoints
      WHERE job_id = ?
    `);

    stmt.run(jobId);
  }

  private mapRowToCheckpoint(row: IngestionCheckpointRow): IngestionCheckpoint {
    return {
      jobId: row.job_id,
      bookTitle: row.book_title,
      chapterIndex: row.chapter_index,
      status: row.status as CheckpointStatus,
      processedAt: row.processed_at,
      errorMessage: row.error_message ?? null,
    };
  }
}

export const CheckpointRepository = SqliteCheckpointRepository;
