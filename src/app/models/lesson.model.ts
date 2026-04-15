export interface Lesson {
  id: string;
  title: string;
  titleRu?: string;      // חובה להוסיף עם סימן שאלה
  humash: string;
  parasha: string;
  year: string;
  language: 'HE' | 'RU';
  pdfUrl: string;
  description: string;
  descriptionRu?: string; // חובה להוסיף עם סימן שאלה
}