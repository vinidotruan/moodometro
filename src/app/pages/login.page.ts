import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { AuthError, AuthProviderId } from '../core/auth/auth.types';
import { ThemeService } from '../core/theme.service';
import { MoodIconComponent } from '../../lib/ui';

@Component({
  selector: 'mm-login-page',
  imports: [MoodIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="wrap">
      <div class="hero">
        <div class="cats" aria-hidden="true">
          <mm-mood-icon mood="alegre" [size]="44" style="color: var(--mm-mood-alegre)" />
          <mm-mood-icon mood="animado" [size]="64" style="color: var(--mm-primary)" />
          <mm-mood-icon mood="carente" [size]="44" style="color: var(--mm-mood-carente)" />
        </div>
        <h1 class="title">Moodômetro</h1>
        <p class="tag">Conta pra quem você gosta como você tá hoje, e o que você tá precisando.</p>
      </div>

      <div class="actions">
        <button type="button" class="btn apple" [disabled]="busy() !== null" (click)="signIn('apple')">
          @if (busy() === 'apple') { <span class="spinner" aria-hidden="true"></span> }
          Continuar com a Apple
        </button>
        <button type="button" class="btn google" [disabled]="busy() !== null" (click)="signIn('google')">
          @if (busy() === 'google') { <span class="spinner" aria-hidden="true"></span> }
          Continuar com o Google
        </button>

        <p class="error" role="alert" aria-live="assertive">{{ error() }}</p>

        @if (auth.isDemo) {
          <p class="demo">
            <strong>Modo demo:</strong> o login é simulado e nada sai do seu navegador.
            O login real com Google e Apple está pronto no código, só falta configurar.
          </p>
        }
      </div>

      <footer class="foot">
        <button type="button" class="theme" (click)="theme.toggle()">
          Tema: {{ theme.theme() === 'latte' ? 'Latte (claro)' : 'Mocha (escuro)' }}
        </button>
      </footer>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .wrap {
      min-height: 100dvh; box-sizing: border-box; max-width: 420px; margin: 0 auto;
      padding: var(--mm-space-8) var(--mm-space-6) var(--mm-space-6);
      display: flex; flex-direction: column; gap: var(--mm-space-8);
    }
    .hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: var(--mm-space-3); }
    .cats { display: flex; align-items: flex-end; gap: var(--mm-space-2); margin-bottom: var(--mm-space-2); }
    .title { margin: 0; font-family: var(--mm-font-heading); font-weight: 600; font-size: 2.5rem; line-height: 1; }
    .tag { margin: 0; color: var(--mm-text-muted); max-width: 30ch; }
    .actions { display: flex; flex-direction: column; gap: var(--mm-space-3); }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--mm-space-2);
      min-height: 52px; border-radius: var(--mm-radius-md); font: inherit; font-weight: 700; font-size: var(--mm-text-md);
      cursor: pointer; border: var(--mm-border-width) solid transparent;
      transition: transform var(--mm-duration) var(--mm-ease), opacity var(--mm-duration);
    }
    .btn:active:not(:disabled) { transform: scale(0.98); }
    .btn:disabled { opacity: 0.6; cursor: progress; }
    /* Apple pede botão preto no claro e branco no escuro */
    .apple { background: #000; color: #fff; }
    :host-context([data-theme='mocha']) .apple { background: #fff; color: #000; }
    .google { background: var(--mm-bg); color: var(--mm-text); border-color: var(--mm-border-strong); }
    .error { min-height: 1.2em; margin: 0; color: var(--mm-danger); font-size: var(--mm-text-sm); text-align: center; }
    .demo {
      margin: 0; padding: var(--mm-space-3); border-radius: var(--mm-radius-md);
      background: var(--mm-surface); border: var(--mm-border-width) dashed var(--mm-border-strong);
      font-size: var(--mm-text-xs); color: var(--mm-text-muted);
    }
    .demo strong { color: var(--mm-text); }
    .foot { display: flex; justify-content: center; }
    .theme {
      min-height: var(--mm-touch); padding: 0 var(--mm-space-4); border-radius: var(--mm-radius-pill);
      background: transparent; border: 0; color: var(--mm-text-muted); font: inherit; font-size: var(--mm-text-sm); cursor: pointer;
    }
    .spinner {
      width: 16px; height: 16px; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
})
export class LoginPage {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly busy = signal<AuthProviderId | null>(null);
  protected readonly error = signal('');

  protected async signIn(provider: AuthProviderId): Promise<void> {
    this.error.set('');
    this.busy.set(provider);
    try {
      await this.auth.signIn(provider);
      const volta = this.router.parseUrl(this.router.url).queryParams['volta'];
      // Só aceita caminho interno, pra o parâmetro não virar redirecionamento pra fora.
      await this.router.navigateByUrl(typeof volta === 'string' && volta.startsWith('/') && !volta.startsWith('//') ? volta : '/hoje');
    } catch (e) {
      const err = e as AuthError;
      if (err.code !== 'cancelled' && err.code !== 'popup-blocked') this.error.set(err.message);
    } finally {
      this.busy.set(null);
    }
  }
}
