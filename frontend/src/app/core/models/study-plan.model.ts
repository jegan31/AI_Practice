export interface StudyActivity {
  type: 'read' | 'practice' | 'review';
  description: string;
}

export interface StudyDay {
  day: number;
  title: string;
  topics: string[];
  activities: StudyActivity[];
  estimatedMinutes: number;
  tips: string;
}

export interface StudyPlan {
  id: number;
  title: string;
  goal: string;
  durationDays: number;
  planContent: StudyDay[];
  documentId: number;
  studentId: number;
  createdAt: string;
}

export interface GenerateStudyPlanRequest {
  durationDays: number;
  goal: string;
}
