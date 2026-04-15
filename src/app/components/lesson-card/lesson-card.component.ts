import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lesson } from '../../models/lesson.model';

@Component({
  selector: 'app-lesson-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-card.component.html',
  styleUrl: './lesson-card.component.scss'
})
export class LessonCardComponent {
  @Input() lesson!: any; 
  @Input() currentLang: 'he' | 'ru' = 'he';

  // משתנה לניהול מצב פתיחת התקציר
  isExpanded = false;

  // מנגנון בחירת כותרת חכם עם פולבק דו-כיווני
  get displayTitle(): string {
    if (this.currentLang === 'ru') {
      return this.lesson.titleRu || this.lesson.title || 'Без заголовка';
    } else {
      return this.lesson.title || this.lesson.titleRu || 'ללא כותרת';
    }
  }

  // שליפת התיאור שהגיע מגוגל דרייב
  get displayContent(): string {
    return this.lesson?.description || '';
  }

  // שינוי מצב התצוגה (פתוח/סגור)
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  getDriveViewUrl(url: string): string {
    // משתמש ב-pdfUrl או בקישור הישיר שמגיע מה-API
    const fileId = this.extractId(url || this.lesson?.pdfUrl);
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }

  getDirectDownloadUrl(url: string): string {
    const fileId = this.extractId(url || this.lesson?.pdfUrl);
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }

  private extractId(url: string): string {
    if (!url) return '';
    // תמיכה רחבה יותר בפורמטים של גוגל דרייב (כולל regex למקרי קצה)
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? match[1] : url.split('/d/')[1]?.split('/')[0] || url;
  }
}