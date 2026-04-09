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
      subTitle: 'שיעורי הגר"ב לאזאר שליט"א',
      extraTitle: 'על סדר הפרשיות והמועדים',
      searchPlaceholder: 'חפש פרשה, חג או נושא...',
      dir: 'rtl'
    },
    ru: {
      title: 'Шлах Лахмеха',
      subTitle: 'Уроки Главного Раввина Берла Лазара',
      extraTitle: 'По недельным главам и праздникам',
      searchPlaceholder: 'Поиск темы, праздника...',
      dir: 'ltr'
    }
  };

  currentLang = 'he';
  t = this.translations['he']; // האובייקט שמוצג בפועל

  constructor(private langService: LanguageService) {
    // האזנה לשירות כדי שה-Header יתעדכן כשמשנים שפה מכל מקום באתר
    this.langService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.t = this.translations[lang];
    });
  }

  // פונקציה 1: החלפת שפה
  switchLang(lang: 'he' | 'ru') {
    this.langService.setLanguage(lang);
  } // <--- כאן נסגרת הפונקציה switchLang

  // פונקציה 2: חיפוש (עכשיו היא מחוץ ל-switchLang ועומדת בפני עצמה)
  onSearch(event: any) {
    const term = event.target.value;
    this.searchChanged.emit(term);
  }

} 
