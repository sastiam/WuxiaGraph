import type { StructuredChapter } from './chapterSplitter.js';

export type CheckpointStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface IngestionCheckpoint {
  jobId: string;
  bookTitle: string;
  chapterIndex: number;
  status: CheckpointStatus;
  processedAt?: string;
  errorMessage?: string | null;
}

export interface ICheckpointRepository {
  saveCheckpoint(checkpoint: IngestionCheckpoint): Promise<void>;
  getCheckpoint(jobId: string, chapterIndex: number): Promise<IngestionCheckpoint | null>;
  getCheckpointsByJob(jobId: string): Promise<IngestionCheckpoint[]>;
  getCompletedChapterIndices(jobId: string): Promise<number[]>;
  getLatestCheckpoint(jobId: string): Promise<IngestionCheckpoint | null>;
  deleteCheckpointsByJob(jobId: string): Promise<void>;
}

export interface ChapterProcessItem {
  chapter: StructuredChapter;
  previousContext: string;
  combinedText: string;
}

export interface WorkerQueueOptions {
  checkpointRepository: ICheckpointRepository;
  overlapChars?: number;
  onChapterSuccess?: (jobId: string, chapter: StructuredChapter) => Promise<void> | void;
  onChapterError?: (jobId: string, chapter: StructuredChapter, error: Error) => Promise<void> | void;
}

export interface ProcessJobOptions {
  jobId: string;
  bookTitle: string;
  chapters: StructuredChapter[];
  processor?: (item: ChapterProcessItem) => Promise<void>;
  overlapChars?: number;
  resumeFromCheckpoint?: boolean;
}

export interface JobSummary {
  jobId: string;
  bookTitle: string;
  totalChapters: number;
  processedChapters: number;
  skippedChapters: number;
  failedChapters: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  completedChapterIndices: number[];
}
