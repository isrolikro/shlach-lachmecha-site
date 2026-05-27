export interface Lesson {
  id: string;
  title: string;
  titleRu?: string;
  humash: string;
  parasha: string;
  year: string;
  language: 'HE' | 'RU';
  pdfUrl: string;
  description: string;
  descriptionRu?: string;
  letterCategory?: string; // שם תת-התיקייה במכתבים
  createdTime?: string;    // תאריך יצירה בגוגל דרייב (ISO)
}