import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Lesson } from '../models/lesson.model';

@Injectable({
  providedIn: 'root',
})
export class DriveDataService {


  // הגדרת המפה כקבועה סטטית - כך שגם ה-Browser יוכל לגשת לסדר הזה לצורך מיון
  public static readonly CATEGORIES_CONFIG: Record<string, string[]> = {
    'בראשית': ['בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש', 'ויחי'],
    'שמות': ['שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי'],
    'ויקרא': ['ויקרא', 'צו', 'שמיני', 'תזריע', 'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחוקותי'],
    'במדבר': ['במדבר', 'נשא', 'בהעלותך', 'שלח', 'קרח', 'חקת', 'בלק', 'פנחס', 'מטות', 'מסעי'],
    'דברים': ['דברים', 'ואתחנן', 'עקב', 'ראה', 'שופטים', 'כי תצא', 'כי תבוא', 'נצבים', 'וילך', 'האזינו', 'וזאת הברכה'],
    'חגים ומועדים': ['ראש השנה', 'יום כיפור', 'סוכות', 'שמיני עצרת', 'שמחת תורה', 'חנוכה', 'פורים', 'פסח', 'שבועות', 'שלושת השבועות', 'תשעה באב', 'אלול', 'חודש תשרי']
  };

  private getCategory(subject: string): string {
    // חיפוש אלגנטי בתוך המפה הסטטית
    const category = Object.keys(DriveDataService.CATEGORIES_CONFIG).find(cat => 
      DriveDataService.CATEGORIES_CONFIG[cat].includes(subject)
    );

    if (category) return category;

    // פולבק חכם למקרים שהשם לא ברשימה המדויקת
    if (subject.includes('חג') || subject.includes('מועד')) {
      return 'חגים ומועדים';
    }

    return 'אחר';
  }
// }
  private readonly API_KEY = 'AIzaSyA6nNLhbu6wAQbUVcsKON5YZLIpQTzMZvQ';
  private readonly FOLDER_ID = '182yS_949b2rbkUK9R1R0eV4j_TElVxps';
  private readonly API_URL = 'https://www.googleapis.com/drive/v3/files';

  constructor(private http: HttpClient) {}

  /**
   * שואב את הקבצים ומבצע המרה למודל הנתונים שלנו
   */
  getLessons(): Observable<Lesson[]> {
    const query = `'${this.FOLDER_ID}' in parents and trashed = false`;
    const url = `${this.API_URL}?q=${encodeURIComponent(query)}&key=${this.API_KEY}&fields=files(id, name, webContentLink, description)&pageSize=100`;

    // כאן היה התיקון המרכזי - הוספת ה-return וה-pipe
    return this.http.get<any>(url).pipe(
      map((res) => {
        if (!res || !res.files) return [];
        return res.files
          .filter((file: any) => file.name && file.name.endsWith('.pdf'))
          .map((file: any) => this.parseFileName(file));
      })
    );
  }

  /**
   * לוגיקת פירוק שם הקובץ
   */
  private parseFileName(file: any): Lesson {
    const rawName = file.name || '';
    const fileNameWithoutExt = rawName.replace('.pdf', '');

    // 1. ניקוי מספרים בתחילת השם
    const cleanName = fileNameWithoutExt.replace(/^\d+\s+/, '');

    // 2. חילוץ חלקים לפי המקף
    const parts = cleanName.split(' - ');
    const details = parts[1] || ''; 

    // 3. חילוץ שנה ותיקון הפורמט (תשפ_ו -> תשפ"ו)
    const yearMatch = details.match(/תשפ[א-ת_]+/);
    let year = yearMatch ? yearMatch[0].replace('_', '"') : '';

    // 4. חילוץ הנושא (פרשה או חג)
    const subject = details.replace(/\sה_תשפ.*/, '').trim() || 'כללי';

    // 5. קביעת קטגוריה
    const category = this.getCategory(subject);

    return {
      id: file.id,
      title: `גיליון ${subject} - ${year}`,
      humash: category,
      parasha: subject,
      year: year,
      language: rawName.includes('RU') ? 'RU' : 'HE',
      pdfUrl: file.webContentLink,
      description: file.description || '',
    };
  }

  /**
   * שיוך אוטומטי לקטגוריה
   */
  // private getCategory(subject: string): string {
  //   const categories: { [key: string]: string[] } = {
  //     'בראשית': ['בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש', 'ויחי'],
  //     'שמות': ['שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי'],
  //     'ויקרא': ['ויקרא', 'צו', 'שמיני', 'תזריע', 'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחוקותי'],
  //     'במדבר': ['במדבר', 'נשא', 'בהעלותך', 'שלח', 'קרח', 'חקת', 'בלק', 'פנחס', 'מטות', 'מסעי'],
  //     'דברים': ['דברים', 'ואתחנן', 'עקב', 'ראה', 'שופטים', 'כי תצא', 'כי תבוא', 'נצבים', 'וילך', 'האזינו', 'וזאת הברכה'],
  //     'חגים ומועדים': ['ראש השנה', 'יום כיפור', 'סוכות', 'שמיני עצרת', 'שמחת תורה', 'חנוכה', 'פורים', 'פסח', 'שבועות', 'שלושת השבועות', 'תשעה באב', 'אלול', 'חודש תשרי']
  //   };

  //   for (const [catName, subjects] of Object.entries(categories)) {
  //     if (subjects.includes(subject)) return catName;
  //   }

  //   if (subject.includes('חג') || subject.includes('מועד')) {
  //     return 'חגים ומועדים';
  //   }

  //   return 'אחר';
  // }
}