import { Component, OnInit, OnDestroy, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriveDataService, DriveFolder } from '../../services/drive-data.service';
import { LanguageService } from '../../services/language.service';
import { Lesson } from '../../models/lesson.model';
import { Subscription, forkJoin, of, switchMap, map } from 'rxjs';
import { LessonCardComponent } from '../../components/lesson-card/lesson-card.component';

const GLOBAL_ORDER = Object.values(DriveDataService.CATEGORIES_CONFIG).flat();
const HOLIDAY_SUBCATEGORIES = DriveDataService.CATEGORIES_CONFIG['חגים ומועדים'];

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
  expandedGroups = new Set<string>(['humash']);

  /** שמות תת-התיקיות שנטענו מגוגל דרייב */
  letterSubcategoryNames: string[] = [];

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

  menuGroups: any[] = [
    {
      id: 'humash',
      label: { he: 'חומשים', ru: 'Пятикнижие' },
      items: [
        { id: 'בראשית', label: { he: 'בראשית', ru: 'Берешит' } },
        { id: 'שמות',   label: { he: 'שמות',   ru: 'Шмот' } },
        { id: 'ויקרא', label: { he: 'ויקרא',   ru: 'Ваикра' } },
        { id: 'במדבר', label: { he: 'במדבר',   ru: 'Бемидбар' } },
        { id: 'דברים', label: { he: 'דברים',   ru: 'Дварим' } }
      ]
    },
    {
      id: 'holidays',
      label: { he: 'מועדים', ru: 'Праздники' },
      items: [
        { id: 'חגים-הכל',       label: { he: 'הכל',           ru: 'Все' } },
        { id: 'ראש השנה',       label: { he: 'ראש השנה',      ru: 'Рош Ашана' } },
        { id: 'יום כיפור',      label: { he: 'יום כיפור',     ru: 'Йом Кипур' } },
        { id: 'סוכות',          label: { he: 'סוכות',         ru: 'Суккот' } },
        { id: 'שמיני עצרת',     label: { he: 'שמיני עצרת',    ru: 'Шмини Ацерет' } },
        { id: 'שמחת תורה',      label: { he: 'שמחת תורה',     ru: 'Симхат Тора' } },
        { id: 'י"ט כסלו',       label: { he: 'י"ט כסלו',      ru: 'Йуд-тет Кислев' } },
        { id: 'ל"ג בעומר',      label: { he: 'ל"ג בעומר',     ru: 'Лаг баОмер' } },
        { id: 'חנוכה',          label: { he: 'חנוכה',         ru: 'Ханука' } },
        { id: 'פורים',          label: { he: 'פורים',         ru: 'Пурим' } },
        { id: 'פסח',            label: { he: 'פסח',           ru: 'Песах' } },
        { id: 'שבועות',         label: { he: 'שבועות',        ru: 'Шавуот' } },
        { id: 'שלושת השבועות',  label: { he: 'שלושת השבועות', ru: 'Три недели' } },
        { id: 'תשעה באב',       label: { he: 'תשעה באב',      ru: 'Тиша беАв' } },
        { id: 'אלול',           label: { he: 'אלול',          ru: 'Элул' } },
        { id: 'חודש תשרי',      label: { he: 'חודש תשרי',     ru: 'Месяц Тишрей' } },
      ]
    },
    {
      id: 'letters',
      label: { he: 'מכתבים', ru: 'Письма' },
      items: [
        { id: 'מכתבים-הכל', label: { he: 'הכל', ru: 'Все' } }
        // פריטים נוספים ייטענו דינמית מגוגל דרייב
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

    // טעינת שיעורים
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

    // טעינת מכתבים — דינמית מתת-תיקיות
    this.driveService.getLetterSubfolders().pipe(
      switchMap((folders: DriveFolder[]) => {
        this.letterSubcategoryNames = folders.map(f => f.name);

        // בניית תפריט המכתבים דינמית
        this.menuGroups[2].items = [
          { id: 'מכתבים-הכל', label: { he: 'הכל', ru: 'Все' } },
          ...folders.map(f => ({ id: f.name, label: { he: f.name, ru: f.name } }))
        ];

        if (folders.length === 0) return of([] as Lesson[]);

        // טעינה מקבילה של כל תת-התיקיות
        return forkJoin(
          folders.map(folder =>
            this.driveService.getFilesInFolder(folder.id).pipe(
              map((files: Lesson[]) =>
                files.map(f => ({ ...f, letterCategory: folder.name }))
              )
            )
          )
        ).pipe(
          map((results: Lesson[][]) => results.flat())
        );
      })
    ).subscribe({
      next: (letters: Lesson[]) => {
        this.allLetters = letters;
        this.filterLessons();
      },
      error: (err) => console.error('שגיאה בטעינת מכתבים:', err)
    });
  }

  getCategoryLabel(id: string | null): string {
    if (!id) return '';
    for (const group of this.menuGroups) {
      const item = group.items.find((i: any) => i.id === id);
      if (item) return item.label[this.currentLang];
    }
    return id;
  }

  get activeMobileTopTab(): 'humash' | 'holidays' | 'letters' {
    if (
      this.selectedCategory === 'חגים-הכל' ||
      (this.selectedCategory && HOLIDAY_SUBCATEGORIES.includes(this.selectedCategory))
    ) return 'holidays';
    if (
      this.selectedCategory === 'מכתבים-הכל' ||
      (this.selectedCategory && this.letterSubcategoryNames.includes(this.selectedCategory))
    ) return 'letters';
    return 'humash';
  }

  toggleGroup(groupId: string): void {
    if (this.expandedGroups.has(groupId)) {
      this.expandedGroups.delete(groupId);
    } else {
      this.expandedGroups.add(groupId);
    }
  }

  selectMobileTopTab(tab: 'humash' | 'holidays' | 'letters'): void {
    if (tab === 'humash') {
      const humashIds = ['בראשית', 'שמות', 'ויקרא', 'במדבר', 'דברים'];
      if (!this.selectedCategory || !humashIds.includes(this.selectedCategory)) {
        this.selectCategory('בראשית');
      }
    } else if (tab === 'holidays') {
      if (
        this.selectedCategory !== 'חגים-הכל' &&
        !HOLIDAY_SUBCATEGORIES.includes(this.selectedCategory || '')
      ) {
        this.selectCategory('חגים-הכל');
      }
    } else {
      if (
        this.selectedCategory !== 'מכתבים-הכל' &&
        !this.letterSubcategoryNames.includes(this.selectedCategory || '')
      ) {
        this.selectCategory('מכתבים-הכל');
      }
    }
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.filterLessons();
  }

  filterLessons(): void {
    const term = this.searchTerm.toLowerCase().trim();

    // הכל במועדים
    if (this.selectedCategory === 'חגים-הכל') {
      this.filteredLessons = this.allLessons.filter(l =>
        l.humash === 'חגים ומועדים' &&
        (!term || l.title.toLowerCase().includes(term) || l.description.toLowerCase().includes(term))
      );
      return;
    }

    // מועד ספציפי
    if (this.selectedCategory && HOLIDAY_SUBCATEGORIES.includes(this.selectedCategory)) {
      this.filteredLessons = this.allLessons.filter(l =>
        l.humash === 'חגים ומועדים' &&
        l.parasha === this.selectedCategory &&
        (!term || l.title.toLowerCase().includes(term) || l.description.toLowerCase().includes(term))
      );
      return;
    }

    // מכתבים — הכל או קטגוריה ספציפית
    if (
      this.selectedCategory === 'מכתבים-הכל' ||
      (this.selectedCategory && this.letterSubcategoryNames.includes(this.selectedCategory))
    ) {
      this.filteredLessons = this.allLetters.filter(l => {
        const matchesSub =
          this.selectedCategory === 'מכתבים-הכל' ||
          l.letterCategory === this.selectedCategory;
        return matchesSub &&
          (!term || l.title.toLowerCase().includes(term) || l.description.toLowerCase().includes(term));
      });
      return;
    }

    // חומשים
    let results = this.allLessons.filter(lesson => {
      if (term) {
        return (
          lesson.title.toLowerCase().includes(term) ||
          lesson.description.toLowerCase().includes(term)
        );
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

  scrollSubTabs(el: HTMLElement, dir: 'left' | 'right'): void {
    el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }
}
