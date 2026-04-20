import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  isExpanded = false;

  // --- מנגנון פיצול שם הקובץ (הכותרת) ---
  get displayTitle(): string {
    const fullTitle = this.lesson?.title || '';
    
    // אם מצאנו את המפריד |, אנחנו מפצלים לפי שפה
    if (fullTitle.includes('|')) {
      const parts = fullTitle.split('|');
      if (this.currentLang === 'ru' && parts.length > 1) {
        return parts[1].trim();
      }
      return parts[0].trim();
    }
    
    // פולבק: אם אין | (כמו בנח), מציגים את הכותרת כפי שהגיעה מהסרוויס
    return fullTitle || (this.currentLang === 'ru' ? 'Без заголовка' : 'ללא כותרת');
  }

  // --- מנגנון פיצול תיאור השיעור (התקציר) ---
  get displayContent(): string {
    const fullText = this.lesson?.description || '';
    
    // אם אין טקסט (כמו בשאר הקבצים), מחזירים ריק וה-HTML יסתיר את האזור
    if (!fullText) return '';

    // אם מצאנו את המפריד ---, נבצע פיצול
    if (fullText.includes('---')) {
      const parts = fullText.split('---');
      if (this.currentLang === 'ru' && parts.length > 1) {
        return parts[1].trim();
      }
      return parts[0].trim();
    }
    
    // אם יש טקסט אבל בלי מפריד (תמיכה לאחור), נציג את כולו
    return fullText;
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  getDriveViewUrl(url: string): string {
    // עדיפות ל-pdfUrl, ואם חסר משתמשים ב-id הישיר (ראינו ב-Network שזה קיים)
    const fileId = this.extractId(url || this.lesson?.pdfUrl || this.lesson?.id);
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }

  getDirectDownloadUrl(url: string): string {
    const fileId = this.extractId(url || this.lesson?.pdfUrl || this.lesson?.id);
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }

  private extractId(url: string): string {
    if (!url) return '';
    // תמיכה בפורמטים שונים של קישורים או ב-ID נקי
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? match[1] : url.split('/d/')[1]?.split('/')[0] || url;
  }
}