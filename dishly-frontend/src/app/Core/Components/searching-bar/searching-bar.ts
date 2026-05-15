import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-searching-bar',
  imports: [],
  templateUrl: './searching-bar.html',
  styleUrl: './searching-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchingBar {
  searchQuery = output<string>();

  // Sirve para emitir la consulta de búsqueda al componente padre
  onSearch(query: string) {
    this.searchQuery.emit(query);
  }
}
