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
  @Input() lesson!: any; // מומלץ לעדכן את ה-Interface של Lesson בהתאם
  @Input() currentLang: 'he' | 'ru' = 'he';

  // מנגנון בחירת כותרת חכם עם פולבק דו-כיווני
  get displayTitle(): string {
    if (this.currentLang === 'ru') {
      // ברוסית: עדיפות לרוסית, פולבק לעברית
      return this.lesson.titleRu || this.lesson.title || 'Без заголовка';
    } else {
      // בעברית: עדיפות לעברית, פולבק לרוסית
      return this.lesson.title || this.lesson.titleRu || 'ללא כותרת';
    }
  }

  getDriveViewUrl(url: string): string {
    const fileId = this.extractId(url);
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }

  getDirectDownloadUrl(url: string): string {
    const fileId = this.extractId(url);
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }

  private extractId(url: string): string {
    if (!url) return '';
    return url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0] || '';
  }
}