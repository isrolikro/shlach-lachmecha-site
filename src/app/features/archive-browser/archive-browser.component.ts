import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriveDataService } from '../../services/drive-data.service';
import { LanguageService } from '../../services/language.service';
import { Lesson } from '../../models/lesson.model';
import { Subscription } from 'rxjs';
import * as pdfjsLib from 'pdfjs-dist';

// הגדרת ה-Worker של PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

@Component({
  selector: 'app-archive-browser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archive-browser.component.html',
  styleUrl: './archive-browser.component.scss'
})
export class ArchiveBrowserComponent implements OnInit, OnDestroy {
  @Input() searchTerm: string = '';
  allLessons: Lesson[] = [];
  filteredLessons: Lesson[] = [];
  selectedCategory: string | null = null;
  currentLang: 'he' | 'ru' = 'he';
  private langSub!: Subscription;

  ui: any = {
    he: { menuTitle: 'תפריט שיעורים', found: 'שיעורים נמצאו', empty: 'לא נמצאו שיעורים בקטגוריה זו' },
    ru: { menuTitle: 'Меню архива', found: 'уроков найдено', empty: 'Уроки не найдены' }
  };

  menuGroups = [
    {
      id: 'humash',
      label: { he: 'חומשים', ru: 'Пятикнижие' },
      items: [
        { id: 'בראשית', label: { he: 'בראשית', ru: 'Берешит' } },
        { id: 'שמות', label: { he: 'שמות', ru: 'Шмот' } },
        { id: 'ויקרא', label: { he: 'ויקרא', ru: 'Ваикра' } },
        { id: 'במדבר', label: { he: 'במדבר', ru: 'Беמיдбар' } },
        { id: 'דברים', label: { he: 'דברים', ru: 'Дварим' } }
      ]
    },
    {
      id: 'holidays',
      label: { he: 'חגים ומועדים', ru: 'Праздники' },
      items: [
        { id: 'חגים ומועדים', label: { he: 'כל החגים', ru: 'Все праздники' } }
      ]
    },
    {
      id: 'letters',
      label: { he: 'מכתבים', ru: 'Письма' },
      items: [
        { id: 'מכתבים', label: { he: 'ארכיון מכתבים', ru: 'Архив писем' } }
      ]
    }
  ];

  previews: { [key: string]: string } = {};

  constructor(
    private driveService: DriveDataService,
    private langService: LanguageService
  ) {}

  ngOnInit(): void {
    // האזנה לשפה מה-Service
    this.langSub = this.langService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      if (!this.selectedCategory) this.selectCategory('בראשית');
    });

    // טעינת הנתונים
    this.driveService.getLessons().subscribe({
      next: (lessons) => {
        this.allLessons = lessons;
        this.filterLessons();
        this.generateAllPreviews(); // עכשיו הפונקציה קיימת למטה
      },
      error: (err) => console.error('שגיאה בטעינת שיעורים:', err)
    });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.filterLessons();
  }

  // filterLessons(): void {
  //   if (this.selectedCategory) {
  //     this.filteredLessons = this.allLessons.filter(l => l.humash === this.selectedCategory);
  //   }
  // }

  // --- פונקציות הטיפול ב-PDF (אלו שהיו חסרות) ---

  private getDirectUrl(url: string): string {
    if (url.includes('drive.google.com')) {
      const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
      return `https://docs.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  }

  async generateAllPreviews() {
    for (const lesson of this.allLessons) {
      if (lesson.pdfUrl && !this.previews[lesson.id]) {
        await this.generateSinglePreview(lesson);
      }
    }
  }

  async generateSinglePreview(lesson: Lesson) {
    try {
      const directUrl = this.getDirectUrl(lesson.pdfUrl);
      const loadingTask = pdfjsLib.getDocument(directUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport: viewport, canvas: canvas }).promise;
        this.previews[lesson.id] = canvas.toDataURL();
      }
    } catch (err) {
      console.warn(`נכשל ייצור תצוגה מקדימה ל: ${lesson.title}`);
      this.previews[lesson.id] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAADICAIAAAAL936OAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQyIDc5LjE2MDkyNCwgMjAxNy8wMS8xMy0xMjowODozMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0RUJERkNGMTU2QUUxMUU4OEJCQ0U5RkZENTU0RUY1OCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo0RUJERkNGMjU2QUUxMUU4OEJCQ0U5RkZENTU0RUY1OCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjRFQkRGQ0VGNTVBRTExRTg4QkJDRTlGRkQ1NTRFRjU4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjRFQkRGQ0YwNTVBRTExRTg4QkJDRTlGRkQ1NTRFRjU4Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBNZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+V6997wAAAG1JREFUeNrswTEBAAAAwqD1T20LL6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPBgBwgwAFY6AAHOv93eAAAAAElFTkSuQmCC';
    }
  }

  openPreview(url: string) {
    const previewUrl = url.replace('/uc?export=download&id=', '/file/d/') + '/view';
    window.open(previewUrl, '_blank');
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchTerm']) {
      this.filterLessons();
    }
  }

  // עדכון פונקציית הסינון כדי שתתחשב גם בחיפוש
  filterLessons(): void {
    this.filteredLessons = this.allLessons.filter(lesson => {
      const matchesCategory = !this.selectedCategory || lesson.humash === this.selectedCategory;
      
      // חיפוש חופשי בכותרת השיעור (מתעלם מאותיות גדולות/קטנות)
      const matchesSearch = !this.searchTerm || 
                           lesson.title.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }
}