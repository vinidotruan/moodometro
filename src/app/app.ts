import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `<router-outlet />`,
})
export class App {
  // Instancia cedo pra aplicar o tema antes da primeira tela.
  private readonly theme = inject(ThemeService);
}
