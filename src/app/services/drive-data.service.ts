import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Lesson } from '../models/lesson.model';

@Injectable({
  providedIn: 'root',
})
export class DriveDataService {

  public static readonly CATEGORIES_CONFIG: Record<string, string[]> = {
    'בראשית': ['בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש', 'ויחי'],
    'שמות': ['שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי'],
    'ויקרא': ['ויקרא', 'צו', 'שמיני', 'תזריע', 'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחוקותי'],
    'במדבר': ['במדבר', 'נשא', 'בהעלותך', 'שלח', 'קרח', 'חקת', 'בלק', 'פנחס', 'מטות', 'מסעי'],
    'דברים': ['דברים', 'ואתחנן', 'עקב', 'ראה', 'שופטים', 'כי תצא', 'כי תבוא', 'נצבים', 'וילך', 'האזינו', 'וזאת הברכה'],
    'חגים ומועדים': ['ראש השנה', 'יום כיפור', 'סוכות', 'שמיני עצרת', 'שמחת תורה', 'חנוכה', 'פורים', 'פסח', 'שבועות', 'שלושת השבועות', 'תשעה באב', 'אלול', 'חודש תשרי']
  };

  private readonly ALL_PARASHOT_ORDER = Object.values(DriveDataService.CATEGORIES_CONFIG).flat();

  private readonly API_KEY = 'AIzaSyA6nNLhbu6wAQbUVcsKON5YZLIpQTzMZvQ';
  private readonly FOLDER_ID = '182yS_949b2rbkUK9R1R0eV4j_TElVxps';
  private readonly API_URL = 'https://www.googleapis.com/drive/v3/files';

  constructor(private http: HttpClient) {}

  getLessons(): Observable<Lesson[]> {
    const query = `'${this.FOLDER_ID}' in parents and trashed = false`;
    const url = `${this.API_URL}?q=${encodeURIComponent(query)}&key=${this.API_KEY}&fields=files(id, name, webContentLink, description)&pageSize=100`;

    return this.http.get<any>(url).pipe(
      map((res) => {
        if (!res || !res.files) return [];

        const lessons: Lesson[] = res.files
          .filter((file: any) => file.name && file.name.toLowerCase().endsWith('.pdf'))
          .map((file: any) => this.parseFileName(file));

        return lessons.sort((a: Lesson, b: Lesson) => {
          const indexA = this.ALL_PARASHOT_ORDER.indexOf(a.parasha);
          const indexB = this.ALL_PARASHOT_ORDER.indexOf(b.parasha);

          if (indexA !== indexB) {
            const finalA = indexA === -1 ? 999 : indexA;
            const finalB = indexB === -1 ? 999 : indexB;
            return finalA - finalB;
          }
          return (b.year || '').localeCompare(a.year || '');
        });
      })
    );
  }

  private parseFileName(file: any): Lesson {
    const rawName = file.name || '';
    const fileNameWithoutExt = rawName.replace(/\.pdf$/i, '');
    const cleanName = fileNameWithoutExt.replace(/^\d+\s+/, '');

    // חילוץ שנה
    const yearMatch = rawName.match(/תשפ[א-ת_]+/) || rawName.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0].replace('_', '"') : 'תשפ"ו';

    // התיקון הקריטי: מחפשים איזה שם פרשה מהרשימה "מוכל" בתוך שם הקובץ
    const foundParasha = this.ALL_PARASHOT_ORDER.find(p => cleanName.includes(p)) || 'כללי';

    // במידה ומדובר בדו-לשוני
    if (cleanName.includes('|')) {
      return {
        id: file.id,
        title: cleanName,
        humash: this.getCategory(foundParasha),
        parasha: foundParasha, // עכשיו זה יהיה "בראשית" נקי!
        year: year,
        language: 'HE',
        pdfUrl: file.webContentLink,
        description: file.description || '',
      };
    }

    // פורמט ישן
    return {
      id: file.id,
      title: cleanName,
      humash: this.getCategory(foundParasha),
      parasha: foundParasha,
      year: year,
      language: rawName.includes('RU') ? 'RU' : 'HE',
      pdfUrl: file.webContentLink,
      description: file.description || '',
    };
  }

  private getCategory(subject: string): string {
    const category = Object.keys(DriveDataService.CATEGORIES_CONFIG).find(cat => 
      DriveDataService.CATEGORIES_CONFIG[cat].some(s => subject.includes(s))
    );
    return category || (subject.includes('חג') || subject.includes('מועד') ? 'חגים ומועדים' : 'אחר');
  }
}