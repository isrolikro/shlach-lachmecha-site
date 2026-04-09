// src/app/models/lesson.model.ts

export interface Lesson {
  id: string;          // ה-ID הייחודי מגוגל דרייב
  title: string;       // הכותרת שנציג למשתמש (למשל: "גיליון וירא - תשפ"ו")
  humash: string;      // הקטגוריה הראשית (חומש או "חגים ומועדים")
  parasha: string;     // שם הפרשה או החג הספציפי
  year: string;        // השנה (למשל: תשפ"ו)
  language: 'HE' | 'RU'; // שפת הגיליון
  pdfUrl: string;      // הקישור הישיר לצפייה/הורדה
  previewUrl?: string;
}