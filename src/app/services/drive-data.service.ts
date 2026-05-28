import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, expand, reduce, EMPTY, map } from 'rxjs';
import { Lesson } from '../models/lesson.model';

export interface DriveFolder {
  id: string;
  name: string;
}

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
    'חגים ומועדים': ['ראש השנה', 'יום כיפור', 'סוכות', 'שמיני עצרת', 'שמחת תורה','י"ט כסלו', 'ל"ג בעומר', 'חנוכה', 'פורים', 'פסח', 'שבועות', 'שלושת השבועות', 'תשעה באב', 'אלול', 'חודש תשרי']
  };

  private readonly ALL_PARASHOT_ORDER = Object.values(DriveDataService.CATEGORIES_CONFIG).flat();

  // כינויים לפרשות שנכתבות בכתיב חסר בשמות קבצים
  private readonly PARASHA_ALIASES: Record<string, string> = {
    'בחקתי':   'בחוקותי',
    'בחוקתי':  'בחוקותי',
    'בהעלתך':  'בהעלותך',
    'אחרי':    'אחרי מות',
  };

  private readonly API_KEY = 'AIzaSyA6nNLhbu6wAQbUVcsKON5YZLIpQTzMZvQ';
  private readonly FOLDER_ID = '182yS_949b2rbkUK9R1R0eV4j_TElVxps';
  private readonly LETTERS_FOLDER_ID = '1e7GjRKyLNYca-Qha13oBYYwrLxja2-ya';
  private readonly API_URL = 'https://www.googleapis.com/drive/v3/files';

  constructor(private http: HttpClient) {}

  getLessons(): Observable<Lesson[]> {
    const query = `'${this.FOLDER_ID}' in parents and trashed = false`;
    const fields = 'nextPageToken,files(id,name,webContentLink,description,createdTime)';
    const baseUrl = `${this.API_URL}?q=${encodeURIComponent(query)}&key=${this.API_KEY}&fields=${encodeURIComponent(fields)}&pageSize=1000`;

    return this.http.get<any>(baseUrl).pipe(
      expand((res) =>
        res.nextPageToken
          ? this.http.get<any>(`${baseUrl}&pageToken=${res.nextPageToken}`)
          : EMPTY
      ),
      reduce((allFiles: any[], res: any) => allFiles.concat(res.files || []), []),
      map((files: any[]) => {
        const lessons: Lesson[] = files
          .filter((file) => file.name?.toLowerCase().endsWith('.pdf'))
          .map((file) => this.parseFileName(file));

        return lessons.sort((a, b) => {
          const indexA = this.ALL_PARASHOT_ORDER.indexOf(a.parasha);
          const indexB = this.ALL_PARASHOT_ORDER.indexOf(b.parasha);
          const posA = indexA === -1 ? 999 : indexA;
          const posB = indexB === -1 ? 999 : indexB;
          if (posA !== posB) return posA - posB;
          return (b.year || '').localeCompare(a.year || '');
        });
      })
    );
  }

  /** מחזיר את רשימת תת-התיקיות בתיקיית מכתבים */
  getLetterSubfolders(): Observable<DriveFolder[]> {
    const query = `'${this.LETTERS_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const fields = 'files(id,name)';
    const url = `${this.API_URL}?q=${encodeURIComponent(query)}&key=${this.API_KEY}&fields=${encodeURIComponent(fields)}`;
    return this.http.get<any>(url).pipe(
      map(res =>
        ((res.files || []) as DriveFolder[]).sort((a, b) =>
          a.name.localeCompare(b.name, 'he')
        )
      )
    );
  }

  /** מחזיר את הקבצים (PDF/תמונה) מתוך תיקייה ספציפית */
  getFilesInFolder(folderId: string): Observable<Lesson[]> {
    const query = `'${folderId}' in parents and trashed = false`;
    const fields = 'nextPageToken,files(id,name,webContentLink,description,createdTime)';
    const baseUrl = `${this.API_URL}?q=${encodeURIComponent(query)}&key=${this.API_KEY}&fields=${encodeURIComponent(fields)}&pageSize=1000`;

    return this.http.get<any>(baseUrl).pipe(
      expand((res) =>
        res.nextPageToken
          ? this.http.get<any>(`${baseUrl}&pageToken=${res.nextPageToken}`)
          : EMPTY
      ),
      reduce((allFiles: any[], res: any) => allFiles.concat(res.files || []), []),
      map((files: any[]) =>
        files
          .filter((file) => /\.(pdf|jpe?g)$/i.test(file.name || ''))
          .map((file) => this.parseLetterFile(file))
      )
    );
  }

  private parseLetterFile(file: any): Lesson {
    const rawName = file.name || '';
    const cleanName = rawName.replace(/\.(pdf|jpe?g)$/i, '').replace(/^\d+\s+/, '');
    const yearMatch = rawName.match(/תשפ[א-ת_]+/) || rawName.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0].replace('_', '"') : '';

    return {
      id: file.id,
      title: cleanName,
      humash: 'מכתבים',
      parasha: '',
      year,
      language: 'HE',
      pdfUrl: file.webContentLink,
      description: file.description || '',
      createdTime: file.createdTime || '',
    };
  }

  private parseFileName(file: any): Lesson {
    const rawName = file.name || '';
    const fileNameWithoutExt = rawName.replace(/\.pdf$/i, '');
    const cleanName = fileNameWithoutExt.replace(/^\d+\s+/, '');

    // חילוץ שנה
    const yearMatch = rawName.match(/תשפ[א-ת_]+/) || rawName.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0].replace('_', '"') : 'תשפ"ו';

    // מחפשים איזה שם פרשה מהרשימה "מוכל" בתוך שם הקובץ, עם נרמול גרשיים
    const normalize = (s: string) => s.replace(/["״]/g, '');
    // גם הכינויים משתתפים בחיפוש
    const allSearchTerms = [
      ...this.ALL_PARASHOT_ORDER,
      ...Object.keys(this.PARASHA_ALIASES)
    ];
    const rawFound = allSearchTerms.find(p =>
      cleanName.includes(p) || normalize(cleanName).includes(normalize(p))
    ) || 'כללי';
    // נרמול לשם הקנוני
    const foundParasha = this.PARASHA_ALIASES[rawFound] ?? rawFound;

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
      createdTime: file.createdTime || '',
    };
  }

  private getCategory(subject: string): string {
    const category = Object.keys(DriveDataService.CATEGORIES_CONFIG).find(cat => 
      DriveDataService.CATEGORIES_CONFIG[cat].some(s => subject.includes(s))
    );
    return category || (subject.includes('חג') || subject.includes('מועד') ? 'חגים ומועדים' : 'אחר');
  }
}