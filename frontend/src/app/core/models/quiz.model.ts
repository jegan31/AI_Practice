export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface QuizQuestion {
  id: number;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  orderIndex: number;
  // Only present for teachers
  correctAnswer?: string;
  explanation?: string;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  timeLimitMinutes: number;
  isPublished: boolean;
  documentId: number;
  createdById: number;
  questionCount: number;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  studentId: number;
  score: number | null;
  answers: Record<string, string>;
  completed: boolean;
  timeTakenSeconds: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface SubmitAttemptRequest {
  answers: Record<string, string>;
  timeTakenSeconds: number;
}
