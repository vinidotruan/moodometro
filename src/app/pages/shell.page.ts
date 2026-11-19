import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Tab, TabBarComponent } from '../../lib/ui';
import { ToastService } from '../core/toast.service';

const TABS: Tab[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'pessoas', label: 'Pessoas' },
  { id: 'convidar', label: 'Convidar' },
  { id: 'perfil', label: 'Perfil' },
];

@Component({
  selector: 'mm-shell',
  imports: [RouterOutlet, TabBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app">
      <main class="content"><router-outlet /></main>
      <div class="toast" role="status" aria-live="polite">
        @if (toast.message(); as m) { <span class="pill">{{ m }}</span> }
      </div>
      <mm-tab-bar class="tabs" [tabs]="tabs" [active]="active()" (activeChange)="go($event)" />
    </div>
  `,
  styles: `
    .app { max-width: 480px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; position: relative; }
    .content { flex: 1; }
    .tabs { position: sticky; bottom: 0; padding-bottom: env(safe-area-inset-bottom); background: var(--mm-surface); }
    .toast {
      position: fixed; left: 50%; transform: translateX(-50%); z-index: 10;
      bottom: calc(80px + env(safe-area-inset-bottom)); pointer-events: none;
    }
    .pill {
      display: block; padding: var(--mm-space-3) var(--mm-space-4); border-radius: var(--mm-radius-pill);
      background: var(--mm-text); color: var(--mm-bg); font-size: var(--mm-text-sm); font-weight: 700; white-space: nowrap;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); animation: pop 200ms var(--mm-ease);
    }
    @keyframes pop { from { opacity: 0; transform: translateY(8px); } }
  `,
})
export class ShellPage {
  protected readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly tabs = TABS;

  protected readonly active = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.section()),
    ),
    { initialValue: this.section() },
  );

  protected go(id: string): void {
    this.router.navigate(['/', id]);
  }

  private section(): string {
    return this.router.url.split('/')[1]?.split('?')[0] || 'hoje';
  }
}
