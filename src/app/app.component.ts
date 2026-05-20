import { Component, HostListener } from '@angular/core';
import { HeaderComponent } from './features/header/header.component';
import { ArchiveBrowserComponent } from './features/archive-browser/archive-browser.component';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, ArchiveBrowserComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'seorim';
  searchTerm: string = '';
  showScrollTop = false;
  isHeaderCompact = false;

  handleSearch(term: string) {
    this.searchTerm = term;
  }

  @HostListener('window:scroll')
  onScroll() {
    const y = window.scrollY;
    this.showScrollTop = y > 150;

    if (!this.isHeaderCompact && y > 80) this.isHeaderCompact = true;
    if (this.isHeaderCompact && y < 30) this.isHeaderCompact = false;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
