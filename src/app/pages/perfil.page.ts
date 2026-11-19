import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent, MoodIconComponent } from '../../lib/ui';
import { AuthService } from '../core/auth/auth.service';
import { DataService } from '../core/data.service';
import { ThemeService } from '../core/theme.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'mm-perfil-page',
  imports: [ButtonComponent, MoodIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mm-page">
      <h1 class="mm-h1">Perfil</h1>

      @if (auth.user(); as u) {
        <section class="card">
          <div class="avatar" aria-hidden="true">{{ initial() }}</div>
          <div style="min-width:0">
            <div style="font-weight:700">{{ u.name }}</div>
            <div class="mm-muted" style="overflow:hidden;text-overflow:ellipsis">{{ u.email }}</div>
            <div class="mm-muted" style="font-size:var(--mm-text-xs)">
              Entrou com {{ u.provider === 'apple' ? 'a Apple' : 'o Google' }}{{ auth.isDemo ? ' (demo)' : '' }}
            </div>
          </div>
        </section>
      }

      <h2 class="mm-h2">Tema</h2>
      <div class="seg" role="group" aria-label="Tema">
        <button type="button" [attr.aria-pressed]="theme.theme() === 'latte'" (click)="theme.theme.set('latte')">Latte (claro)</button>
        <button type="button" [attr.aria-pressed]="theme.theme() === 'mocha'" (click)="theme.theme.set('mocha')">Mocha (escuro)</button>
      </div>

      <h2 class="mm-h2">Meus humores</h2>
      <p class="mm-muted">Dá um nome do seu jeito pra cada humor.</p>
      @for (m of data.moods(); track m.id) {
        <div class="mood-row">
          <mm-mood-icon [mood]="m.id" [size]="36" [style.color]="'var(--mm-mood-' + m.id + ')'" />
          <label class="mm-sr-only" [attr.for]="'mood-' + m.id">Nome do humor {{ m.id }}</label>
          <input class="mm-input" [id]="'mood-' + m.id" [value]="m.label" (change)="data.renameMood(m.id, $any($event.target).value)" />
        </div>
      }

      <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
        @if (data.canReset) {
          <mm-button variant="ghost" [block]="true" (click)="reset()">Resetar dados da demo</mm-button>
        }
        <mm-button variant="secondary" size="lg" [block]="true" (click)="signOut()">Sair</mm-button>
      </div>
    </div>
  `,
  styles: `
    .card {
      display: flex; align-items: center; gap: var(--mm-space-3); padding: var(--mm-space-4);
      border-radius: var(--mm-radius-md); background: var(--mm-surface); border: var(--mm-border-width) solid var(--mm-border);
    }
    .avatar {
      width: 52px; height: 52px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center;
      background: var(--mm-primary); color: var(--mm-on-primary); font-family: var(--mm-font-heading); font-weight: 600; font-size: 1.4rem;
    }
    .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: var(--mm-radius-md); background: var(--mm-surface); border: var(--mm-border-width) solid var(--mm-border); }
    .seg button {
      min-height: var(--mm-touch); border: 0; border-radius: calc(var(--mm-radius-md) - 4px); background: transparent;
      color: var(--mm-text-muted); font: inherit; font-weight: 700; font-size: var(--mm-text-sm); cursor: pointer;
    }
    .seg button[aria-pressed='true'] { background: var(--mm-bg); color: var(--mm-text); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12); }
    .mood-row { display: flex; align-items: center; gap: var(--mm-space-3); }
  `,
})
export class PerfilPage {
  protected readonly auth = inject(AuthService);
  protected readonly data = inject(DataService);
  protected readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly initial = computed(() => (this.auth.user()?.name ?? '?').charAt(0).toUpperCase());

  protected reset(): void {
    this.data.reset();
    this.toast.show('Dados da demo resetados');
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/entrar');
  }
}
