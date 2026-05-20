import { Component, Output, EventEmitter, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() searchChanged = new EventEmitter<string>();

  // מילון התרגומים והגדרות הכיוון
translations: any = {
    he: {
      title: 'שלח לחמך',
      subTitle: 'שיעורי מורנו הרב הראשי לרוסיא <br /> הגאון רבי  <b>בערל לאזאר</b> שליט"א',
      extraTitle: 'על סדר הפרשיות והמועדים',
      searchPlaceholder: 'חפש פרשה, חג או נושא...',
      dir: 'rtl'
    },
    ru: {
      title: 'Шлах Лахмеха',
      subTitle: 'Уроки Главного Раввина <br /> <b>Берла Лазара</b>',
      extraTitle: 'По недельным главам и праздникам',
      searchPlaceholder: 'Поиск темы, праздника...',
      dir: 'ltr'
    }
  };

  @ViewChild('searchArea') searchAreaRef!: ElementRef;

  currentLang = 'he';
  t = this.translations['he'];
  isSearchOpen = false;

  constructor(private langService: LanguageService) {
    this.langService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.t = this.translations[lang];
    });
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null) {
    if (this.isSearchOpen && !this.searchAreaRef?.nativeElement.contains(target)) {
      this.isSearchOpen = false;
      this.searchChanged.emit('');
    }
  }

  switchLang(lang: 'he' | 'ru') {
    this.langService.setLanguage(lang);
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    if (!this.isSearchOpen) this.searchChanged.emit('');
  }

  onSearch(event: any) {
    this.searchChanged.emit(event.target.value);
  }

}