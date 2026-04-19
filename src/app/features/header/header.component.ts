import { Component, Output, EventEmitter } from '@angular/core';
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
      subTitle: 'שיעורי מורנו הרב הראשי לרוסיא <br /> רבי <b>בערל לאזאר</b> שליט"א',
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

  currentLang = 'he';
  t = this.translations['he'];
  
  // משתנה חדש לניהול מצב החיפוש במובייל
  isSearchOpen = false; 

  constructor(private langService: LanguageService) {
    this.langService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.t = this.translations[lang];
    });
  }

  // פונקציה להחלפת שפה
  switchLang(lang: 'he' | 'ru') {
    this.langService.setLanguage(lang);
  }

  // פונקציה חדשה: פותחת וסוגרת את מצב החיפוש
  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    
    // אופציונלי: אם סוגרים את החיפוש, מאפסים את התוצאות
    if (!this.isSearchOpen) {
      this.searchChanged.emit('');
    }
  }

  onSearch(event: any) {
    const term = event.target.value;
    this.searchChanged.emit(term);
  }

}