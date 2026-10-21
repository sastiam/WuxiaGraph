import type { StructuredChapter } from './chapterSplitter.js';
import type { IWipGovernanceRepository } from '../governance/repository.js';
import type { WipLimitExceededError } from '../governance/errors.js';

export type CheckpointStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PAUSED';

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
  getLastCompletedCheckpoint?(jobId: string): Promise<IngestionCheckpoint | null>;
  deleteCheckpointsByJob(jobId: string): Promise<void>;
}

export interface ChapterProcessItem {
  chapter: StructuredChapter;
  previousContext: string;
  combinedText: string;
}

export interface WorkerQueueOptions {
  checkpointRepository: ICheckpointRepository;
  governanceRepository?: IWipGovernanceRepository;
  overlapChars?: number;
  hoursPerChapter?: number;
  pauseOnWipLimit?: boolean;
  onChapterSuccess?: (jobId: string, chapter: StructuredChapter) => Promise<void> | void;
  onChapterError?: (jobId: string, chapter: StructuredChapter, error: Error) => Promise<void> | void;
  onWipLimitReached?: (jobId: string, chapter: StructuredChapter, error: WipLimitExceededError) => Promise<void> | void;
}

export interface ProcessJobOptions {
  jobId: string;
  bookTitle: string;
  chapters: StructuredChapter[];
  processor?: (item: ChapterProcessItem) => Promise<void>;
  overlapChars?: number;
  resumeFromCheckpoint?: boolean;
  governanceRepository?: IWipGovernanceRepository;
  hoursPerChapter?: number;
  pauseOnWipLimit?: boolean;
}

export interface JobSummary {
  jobId: string;
  bookTitle: string;
  totalChapters: number;
  processedChapters: number;
  skippedChapters: number;
  failedChapters: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'LOCKED_BY_WIP' | 'PAUSED';
  completedChapterIndices: number[];
  lastProcessedChapterIndex?: number;
  lastProcessedChapterId?: string;
  lockedReason?: string;
}
