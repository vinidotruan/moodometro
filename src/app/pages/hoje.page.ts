import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent, ChipComponent, Mood, MoodPickerComponent } from '../../lib/ui';
import { AuthService } from '../core/auth/auth.service';
import { DataService } from '../core/data.service';
import { ToastService } from '../core/toast.service';

const TOPICS = ['Trabalho', 'Nós dois', 'Família', 'Saúde', 'Prefiro não falar'];

@Component({
  selector: 'mm-hoje-page',
  imports: [MoodPickerComponent, ChipComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mm-page">
      <p class="mm-muted">{{ today }}</p>
      <h1 class="mm-h1">Oi, {{ firstName() }}! Como você tá hoje?</h1>

      <mm-mood-picker [moods]="data.moods()" [value]="me().mood" (valueChange)="setMood($event)" />

      <div class="mm-field">
        <label class="mm-label" for="nota">Hoje eu quero falar sobre…</label>
        <textarea id="nota" class="mm-input" placeholder="Escreve aqui (opcional)"
          [value]="me().note" (input)="data.updateMe({ note: $any($event.target).value })"></textarea>
        <div class="mm-row">
          @for (t of topics; track t) {
            <mm-chip [selected]="me().topics.includes(t)" (selectedChange)="toggleTopic(t, $event)">{{ t }}</mm-chip>
          }
        </div>
      </div>

      <div class="mm-field">
        <span class="mm-label" id="quem">Quem vê</span>
        <div class="mm-row" role="group" aria-labelledby="quem">
          @for (p of people(); track p.id) {
            <mm-chip [selected]="me().viewers.includes(p.id)" (selectedChange)="toggleViewer(p.id, $event)">{{ p.name }}</mm-chip>
          }
        </div>
      </div>

      <mm-button size="lg" [block]="true" [disabled]="!me().mood" [loading]="sharing()" (click)="share()">
        {{ me().sharedAt ? 'Atualizar humor' : 'Compartilhar humor' }}
      </mm-button>
      @if (sharedLabel(); as s) {
        <p class="mm-muted" style="text-align:center">{{ s }}</p>
      } @else if (!me().mood) {
        <p class="mm-muted" style="text-align:center">Escolhe um humor pra compartilhar</p>
      }
    </div>
  `,
})
export class HojePage {
  protected readonly data = inject(DataService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly topics = TOPICS;
  protected readonly me = this.data.me;
  protected readonly people = this.data.connectedPeople;
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? 'você');
  protected readonly today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());
  protected readonly sharedLabel = computed(() => {
    const at = this.me().sharedAt;
    if (!at) return null;
    const hh = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(at));
    return `Compartilhado às ${hh} com ${this.me().viewers.length} pessoa(s)`;
  });

  protected setMood(m: Mood | null): void {
    this.data.updateMe({ mood: m });
  }

  protected toggleTopic(t: string, on: boolean): void {
    const cur = this.me().topics;
    this.data.updateMe({ topics: on ? [...cur, t] : cur.filter((x) => x !== t) });
  }

  protected toggleViewer(id: string, on: boolean): void {
    const cur = this.me().viewers;
    this.data.updateMe({ viewers: on ? [...cur, id] : cur.filter((x) => x !== id) });
  }

  protected readonly sharing = signal(false);

  protected async share(): Promise<void> {
    if (!this.me().mood || this.sharing()) return;
    if (this.me().viewers.length === 0) {
      this.toast.show('Escolhe pelo menos uma pessoa');
      return;
    }
    this.sharing.set(true);
    try {
      await this.data.shareMood();
      this.toast.show('Humor compartilhado');
    } catch {
      this.toast.show('Não deu pra compartilhar agora');
    } finally {
      this.sharing.set(false);
    }
  }
}
