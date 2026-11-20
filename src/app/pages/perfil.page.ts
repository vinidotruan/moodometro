import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent, Mood, moodColor, MoodIconComponent } from '../../lib/ui';
import { AuthService } from '../core/auth/auth.service';
import { DataService } from '../core/data.service';
import { fileToPhoto } from '../core/photo';
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
            <div class="mm-muted" style="overflow:hidden;text-overflow:ellipsis">{{ '@' + u.username }}</div>
            @if (auth.isDemo) {
              <div class="mm-muted" style="font-size:var(--mm-text-xs)">Conta da demo (só neste navegador)</div>
            }
          </div>
        </section>
      }

      <h2 class="mm-h2">Tema</h2>
      <div class="seg" role="group" aria-label="Tema">
        <button type="button" [attr.aria-pressed]="theme.theme() === 'latte'" (click)="theme.theme.set('latte')">Latte (claro)</button>
        <button type="button" [attr.aria-pressed]="theme.theme() === 'mocha'" (click)="theme.theme.set('mocha')">Mocha (escuro)</button>
      </div>

      <h2 class="mm-h2">Meus humores</h2>
      <p class="mm-muted">
        Dá um nome do seu jeito pra cada humor.{{ data.canCustomizeMoods ? ' Toque na carinha pra usar uma foto sua.' : '' }}
      </p>
      @for (m of data.moods(); track m.id) {
        <div class="mood-row">
          @if (data.canCustomizeMoods) {
            <label class="photo-btn" [attr.aria-label]="'Foto do humor ' + m.label">
              <mm-mood-icon [mood]="m.id" [def]="m" [size]="40" [style.color]="moodColor(m.id)" />
              <input type="file" accept="image/*" class="mm-sr-only" (change)="pickPhoto(m.id, $event)" />
            </label>
          } @else {
            <mm-mood-icon [mood]="m.id" [def]="m" [size]="40" [style.color]="moodColor(m.id)" />
          }
          <label class="mm-sr-only" [attr.for]="'mood-' + m.id">Nome do humor {{ m.label }}</label>
          <input class="mm-input" [id]="'mood-' + m.id" [value]="m.label" maxlength="30" (change)="data.renameMood(m.id, $any($event.target).value)" />
          @if (m.photo) {
            <button type="button" class="mini" (click)="data.setMoodPhoto(m.id, null)">Tirar foto</button>
          }
          @if (m.custom) {
            <button type="button" class="mini" (click)="remove(m.id, m.label)">Apagar</button>
          }
        </div>
      }

      @if (data.canCustomizeMoods) {
        <form class="add" (submit)="$event.preventDefault(); add(emoji, nome)">
          <label class="mm-sr-only" for="novo-emoji">Emoji do novo humor</label>
          <input #emoji id="novo-emoji" class="mm-input emoji" maxlength="8" placeholder="🙂" />
          <label class="mm-sr-only" for="novo-nome">Nome do novo humor</label>
          <input #nome id="novo-nome" class="mm-input" maxlength="30" placeholder="Novo humor" />
          <mm-button type="submit" variant="secondary">Adicionar</mm-button>
        </form>
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
    .mood-row .mm-input, .add .mm-input { flex: 1; min-width: 0; }
    .photo-btn { display: inline-flex; border-radius: 50%; cursor: pointer; flex-shrink: 0; }
    .photo-btn:focus-within { outline: 2px solid var(--mm-primary); outline-offset: 2px; }
    .mini {
      border: 0; background: none; padding: 4px; flex-shrink: 0; cursor: pointer;
      color: var(--mm-text-muted); font: inherit; font-size: var(--mm-text-xs); text-decoration: underline;
    }
    .add { display: flex; align-items: center; gap: var(--mm-space-2); }
    .add .mm-input.emoji { flex: 0 0 3.5rem; text-align: center; }
  `,
})
export class PerfilPage {
  protected readonly auth = inject(AuthService);
  protected readonly data = inject(DataService);
  protected readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly initial = computed(() => (this.auth.user()?.name ?? '?').charAt(0).toUpperCase());
  protected readonly moodColor = moodColor;

  protected async pickPhoto(id: Mood, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      await this.data.setMoodPhoto(id, await fileToPhoto(file));
    } catch (e) {
      this.toast.show(e instanceof Error ? e.message : 'Não deu pra usar essa foto');
    }
  }

  protected async add(emoji: HTMLInputElement, nome: HTMLInputElement): Promise<void> {
    if (!nome.value.trim()) {
      this.toast.show('Dá um nome pro humor');
      return;
    }
    await this.data.addMood(nome.value, emoji.value);
    emoji.value = nome.value = '';
    this.toast.show('Humor adicionado');
  }

  protected async remove(id: Mood, label: string): Promise<void> {
    if (!confirm(`Apagar o humor "${label}"?`)) return;
    await this.data.removeMood(id);
  }

  protected reset(): void {
    this.data.reset();
    this.toast.show('Dados da demo resetados');
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/entrar');
  }
}
