export interface Flashcard {
  id: number;
  setId: number;
  front: string;
  back: string;
  hint: string;
  orderIndex: number;
}

export interface FlashcardSet {
  id: number;
  title: string;
  description: string;
  isPublished: boolean;
  documentId: number;
  createdById: number;
  cardCount: number;
  cards: Flashcard[];
  createdAt: string;
}
