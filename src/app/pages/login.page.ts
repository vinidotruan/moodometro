import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { AuthError } from '../core/auth/auth.types';
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

      <form #form class="actions" (submit)="$event.preventDefault(); submit(form)">
        <div class="seg" role="group" aria-label="Entrar ou criar conta">
          <button type="button" [attr.aria-pressed]="mode() === 'entrar'" (click)="setMode('entrar')">Entrar</button>
          <button type="button" [attr.aria-pressed]="mode() === 'criar'" (click)="setMode('criar')">Criar conta</button>
        </div>

        <label class="field">
          <span>Usuário</span>
          <input class="mm-input" name="username" autocomplete="username" autocapitalize="none"
            spellcheck="false" maxlength="21" required />
        </label>
        @if (mode() === 'criar') {
          <label class="field">
            <span>Seu nome</span>
            <input class="mm-input" name="name" autocomplete="name" maxlength="40" required />
          </label>
        }
        <label class="field">
          <span>Senha</span>
          <input class="mm-input" type="password" name="password" maxlength="64" required
            [attr.autocomplete]="mode() === 'criar' ? 'new-password' : 'current-password'" />
        </label>

        <button type="submit" class="btn primary" [disabled]="busy()">
          @if (busy()) { <span class="spinner" aria-hidden="true"></span> }
          {{ mode() === 'criar' ? 'Criar conta' : 'Entrar' }}
        </button>

        <p class="error" role="alert" aria-live="assertive">{{ error() }}</p>

        @if (auth.isDemo) {
          <p class="demo">
            <strong>Modo demo:</strong> a conta fica só neste navegador. Nada vai pra internet.
          </p>
        }
      </form>

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
    .primary { background: var(--mm-primary); color: var(--mm-on-primary); }
    .field { display: flex; flex-direction: column; gap: var(--mm-space-1); font-weight: 700; font-size: var(--mm-text-sm); }
    .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: var(--mm-radius-md); background: var(--mm-surface); border: var(--mm-border-width) solid var(--mm-border); }
    .seg button {
      min-height: var(--mm-touch); border: 0; border-radius: calc(var(--mm-radius-md) - 4px); background: transparent;
      color: var(--mm-text-muted); font: inherit; font-weight: 700; font-size: var(--mm-text-sm); cursor: pointer;
    }
    .seg button[aria-pressed='true'] { background: var(--mm-bg); color: var(--mm-text); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12); }
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

  protected readonly mode = signal<'entrar' | 'criar'>('entrar');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected setMode(m: 'entrar' | 'criar'): void {
    this.mode.set(m);
    this.error.set('');
  }

  protected async submit(form: HTMLFormElement): Promise<void> {
    if (this.busy()) return;
    const f = new FormData(form);
    const [username, password, name] = ['username', 'password', 'name'].map((k) => String(f.get(k) ?? ''));
    this.error.set('');
    this.busy.set(true);
    try {
      if (this.mode() === 'criar') await this.auth.signUp(username, name, password);
      else await this.auth.signIn(username, password);
      const volta = this.router.parseUrl(this.router.url).queryParams['volta'];
      // Só aceita caminho interno, pra o parâmetro não virar redirecionamento pra fora.
      await this.router.navigateByUrl(typeof volta === 'string' && volta.startsWith('/') && !volta.startsWith('//') ? volta : '/hoje');
    } catch (e) {
      this.error.set(e instanceof AuthError ? e.message : 'Não deu pra entrar agora.');
    } finally {
      this.busy.set(false);
    }
  }
}
