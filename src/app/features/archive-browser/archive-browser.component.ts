import { Component, OnInit, OnDestroy, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriveDataService } from '../../services/drive-data.service';
import { LanguageService } from '../../services/language.service';
import { Lesson } from '../../models/lesson.model';
import { Subscription } from 'rxjs';
import { LessonCardComponent } from '../../components/lesson-card/lesson-card.component';

// יצירת רשימה שטוחה אחת למיון - מחוץ למחלקה כדי למנוע שגיאות const
const GLOBAL_ORDER = Object.values(DriveDataService.CATEGORIES_CONFIG).flat();

@Component({
  selector: 'app-archive-browser',
  standalone: true,
  imports: [CommonModule, LessonCardComponent],
  templateUrl: './archive-browser.component.html',
  styleUrl: './archive-browser.component.scss'
})
export class ArchiveBrowserComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchTerm: string = '';

  allLessons: Lesson[] = [];
  allLetters: Lesson[] = [];
  filteredLessons: Lesson[] = [];
  selectedCategory: string | null = null;
  currentLang: 'he' | 'ru' = 'he';
  isLoading = true;
  private langSub!: Subscription;

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
    this.langSub = this.langService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      if (!this.selectedCategory) this.selectedCategory = 'בראשית';
    });

    this.driveService.getLessons().subscribe({
      next: (lessons) => {
        this.allLessons = lessons;
        this.isLoading = false;
        this.filterLessons();
      },
      error: (err) => {
        console.error('שגיאה בטעינת שיעורים:', err);
        this.isLoading = false;
      }
    });

    this.driveService.getLetters().subscribe({
      next: (letters) => { this.allLetters = letters; this.filterLessons(); },
      error: (err) => console.error('שגיאה בטעינת מכתבים:', err)
    });
  }

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

  filterLessons(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (this.selectedCategory === 'מכתבים') {
      this.filteredLessons = term
        ? this.allLetters.filter(l =>
            l.title.toLowerCase().includes(term) || l.description.toLowerCase().includes(term)
          )
        : [...this.allLetters];
      return;
    }

    let results = this.allLessons.filter(lesson => {
      if (term) {
        return lesson.title.toLowerCase().includes(term) || lesson.description.toLowerCase().includes(term);
      }
      return !this.selectedCategory || lesson.humash === this.selectedCategory;
    });

    this.filteredLessons = results.sort((a, b) => {
      const posA = GLOBAL_ORDER.indexOf(a.parasha);
      const posB = GLOBAL_ORDER.indexOf(b.parasha);
      const iA = posA === -1 ? 999 : posA;
      const iB = posB === -1 ? 999 : posB;
      if (iA !== iB) return iA - iB;
      return (b.year || '').localeCompare(a.year || '');
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchTerm']) {
      this.filterLessons();
    }
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }
}