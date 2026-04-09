import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  // נגדיר מפתח קבוע לשמירה בזיכרון של הדפדפן
  private readonly LANG_KEY = 'site_language';

  // מאתחלים את השפה לפי מה ששמור, או 'he' כברירת מחדל
  private langSubject = new BehaviorSubject<'he' | 'ru'>(this.getSavedLanguage());
  
  currentLang$ = this.langSubject.asObservable();

  constructor() {
    // בכל פעם שהשירות נטען, אנחנו מוודאים שה-Direction של ה-body מעודכן
    this.updateBodyDirection(this.langSubject.value);
  }

  setLanguage(lang: 'he' | 'ru') {
    // 1. מעדכנים את ה-Subject (זה מעדכן את כל האתר בזמן אמת)
    this.langSubject.next(lang);
    
    // 2. שומרים ב-LocalStorage
    localStorage.setItem(this.LANG_KEY, lang);
    
    // 3. מעדכנים את ה-Direction של ה-HTML (חשוב עבור גלילות ואלמנטים גלובליים)
    this.updateBodyDirection(lang);
  }

  private getSavedLanguage(): 'he' | 'ru' {
    const saved = localStorage.getItem(this.LANG_KEY);
    // בודקים שהערך השמור תקין, אם לא - מחזירים עברית
    return (saved === 'he' || saved === 'ru') ? saved : 'he';
  }

  private updateBodyDirection(lang: 'he' | 'ru') {
    // זה עוזר ל-CSS הגלובלי לדעת מה כיוון האתר
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
}