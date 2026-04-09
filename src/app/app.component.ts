import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './features/header/header.component';
import { ArchiveBrowserComponent } from './features/archive-browser/archive-browser.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,ArchiveBrowserComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'seorim';
  searchTerm: string = '';

  handleSearch(term: string) {
    this.searchTerm = term;
  }
}
