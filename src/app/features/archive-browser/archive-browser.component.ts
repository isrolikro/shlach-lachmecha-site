import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriveDataService } from '../../services/drive-data.service';
import { LanguageService } from '../../services/language.service';
import { Lesson } from '../../models/lesson.model';
import { Subscription } from 'rxjs';
import { LessonCardComponent } from '../../components/lesson-card/lesson-card.component';


@Component({
  selector: 'app-archive-browser',
  standalone: true,
  imports: [CommonModule, LessonCardComponent], // הוספנו את LessonCardComponent כאן
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

  // תרגומי ממשק
  ui: any = {
    he: { 
      menuTitle: 'תפריט שיעורים', 
      found: 'שיעורים נמצאו', 
      empty: 'לא נמצאו שיעורים בקטגוריה זו',
      searchResults: 'תוצאות חיפוש' 
    },
    ru: { 
      menuTitle: 'Меню архива', 
      found: 'уроков найдено', 
      empty: 'Уроки не найдены',
      searchResults: 'Результаты поиска'
    }
  };

  // מבנה התפריט
  menuGroups = [
    {
      id: 'humash',
      label: { he: 'חומשים', ru: 'Пятикнижие' },
      items: [
        { id: 'בראשית', label: { he: 'בראשית', ru: 'Берешит' } },
        { id: 'שמות', label: { he: 'שמות', ru: 'Шмот' } },
        { id: 'ויקרא', label: { he: 'ויקרא', ru: 'Ваикра' } },
        { id: 'במדבר', label: { he: 'במדבר', ru: 'Бемидбар' } },
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

  constructor(
    private driveService: DriveDataService,
    private langService: LanguageService
  ) {}

  ngOnInit(): void {
    // האזנה לשינויי שפה
    this.langSub = this.langService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      // אם לא נבחרה קטגוריה, נברירת המחדל היא בראשית
      if (!this.selectedCategory) this.selectCategory('בראשית');
    });

    // טעינת הנתונים מהשירות
    this.driveService.getLessons().subscribe({
      next: (lessons) => {
        this.allLessons = lessons;
        this.filterLessons();
      },
      error: (err) => console.error('שגיאה בטעינת שיעורים:', err)
    });
  }

  // מחזיר את הלייבל המתורגם של הקטגוריה הנוכחית
  getCategoryLabel(id: string | null): string {
    if (!id) return '';
    for (const group of this.menuGroups) {
      const item = group.items.find(i => i.id === id);
      if (item) return item.label[this.currentLang];
    }
    return id;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.filterLessons();
  }

  // לוגיקת הסינון המרכזית
  filterLessons(): void {
    this.filteredLessons = this.allLessons.filter(lesson => {
      const term = this.searchTerm ? this.searchTerm.toLowerCase().trim() : '';
      const matchesSearch = lesson.title.toLowerCase().includes(term);

      // אם המשתמש מחפש - החיפוש הוא גלובלי (מתעלם מקטגוריה)
      if (term !== '') {
        return matchesSearch;
      }

      // אם אין חיפוש - מסננים לפי הקטגוריה שנבחרה בתפריט
      return !this.selectedCategory || lesson.humash === this.selectedCategory;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // עדכון הסינון בכל פעם שמילת החיפוש משתנה ב-Header
    if (changes['searchTerm']) {
      this.filterLessons();
    }
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }
}