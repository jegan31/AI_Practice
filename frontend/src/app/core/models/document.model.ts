export type AiStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: number;
  title: string;
  originalFilename: string;
  fileSize: number;
  pageCount: number;
  subject: string;
  gradeLevel: string;
  description: string;
  summary: string | null;
  aiProcessed: boolean;
  aiProcessingStatus: AiStatus;
  uploaderId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSummary {
  overview: string;
  keyTopics: string[];
  mainConcepts: { concept: string; explanation: string }[];
  learningObjectives: string[];
  estimatedReadingTimeMinutes: number;
}

export interface UploadDocumentRequest {
  file: File;
  title: string;
  subject?: string;
  gradeLevel?: string;
  description?: string;
}
