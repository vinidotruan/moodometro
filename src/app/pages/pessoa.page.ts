import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent, PersonCardComponent, PrivateSectionComponent, Relation, RELATION_LABEL, WantSliderComponent } from '../../lib/ui';
import { bothConfirmed, DataService, intimateOpen, inviteUrl, relativeTime, WANTS } from '../core/data.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'mm-pessoa-page',
  imports: [RouterLink, PersonCardComponent, WantSliderComponent, PrivateSectionComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (person(); as p) {
      <div class="mm-page">
        <div style="display:flex;align-items:center;gap:12px">
          <a class="mm-back" routerLink="/pessoas" aria-label="Voltar pra Pessoas">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </a>
          <h1 class="mm-h1" style="font-size:var(--mm-text-lg)">{{ p.name }}</h1>
        </div>

        @if (p.pending) {
          <!-- Convite ainda não aceito -->
          <p class="mm-muted">
            Convite de <strong>{{ relationLabel(p.relation) }}</strong> enviado. Quando {{ p.name }} abrir o link
            e entrar, vocês ficam conectados. O link vale por 7 dias.
          </p>
          <div class="box">
            <div class="mm-muted" style="font-size:var(--mm-text-xs)">Link do convite</div>
            <div class="link">{{ link() }}</div>
            <div class="mm-row">
              <mm-button variant="secondary" (click)="copy()">Copiar link</mm-button>
              <mm-button variant="ghost" (click)="cancel(p.inviteCode!)">Cancelar convite</mm-button>
            </div>
          </div>
        } @else {
          <mm-person-card [name]="p.name" [relation]="p.relation" [mood]="p.mood" [topic]="p.topic" [when]="when()" />

          <!-- Estado da relação -->
          @if (!both()) {
            <div class="box" role="status">
              @if (p.confirmedByMe) {
                <strong>Esperando {{ p.name }} confirmar</strong>
                <span class="mm-muted">Você propôs {{ relationLabel(p.relation) }}. Até a outra pessoa confirmar, a parte íntima fica fechada.</span>
              } @else {
                <strong>{{ p.name }} propôs {{ relationLabel(p.relation) }}</strong>
                <span class="mm-muted">Confirmando, vocês dois veem as categorias de {{ relationLabel(p.relation).toLowerCase() }}.</span>
                <div class="mm-row">
                  <mm-button (click)="confirm(true)" [loading]="busy()">Confirmar</mm-button>
                  <mm-button variant="secondary" (click)="propose(other(p.relation))" [disabled]="busy()">Prefiro {{ relationLabel(other(p.relation)).toLowerCase() }}</mm-button>
                </div>
              }
            </div>
          }

          @if (theirSummary().length) {
            <section class="mm-field">
              <h2 class="mm-h2" style="font-size:var(--mm-text-md)">O que {{ p.name }} quer hoje</h2>
              <div class="mm-row">
                @for (w of theirSummary(); track w.id) {
                  <span class="want-pill">{{ w.arrow }} {{ w.label }}</span>
                }
              </div>
            </section>
          }

          <h2 class="mm-h2">O que eu quero hoje</h2>
          @for (w of basic(); track w.id) {
            <mm-want-slider [label]="w.label" [low]="w.low" [high]="w.high"
              [value]="p.myWants[w.id] ?? 50" (valueChange)="data.setMyWant(p.id, w.id, $event)" />
          }

          @if (p.relation === 'namoro') {
            <mm-private-section [unlocked]="open()" lockedText="A parte íntima abre quando os dois confirmarem o namoro">
              @for (w of intimate(); track w.id) {
                <mm-want-slider [label]="w.label" [low]="w.low" [high]="w.high"
                  [value]="p.myWants[w.id] ?? 50" (valueChange)="data.setMyWant(p.id, w.id, $event)" />
              }
            </mm-private-section>
          } @else {
            <mm-private-section [unlocked]="false" lockedText="Seção íntima oculta em amizades" />
          }
          <p class="mm-muted" style="font-size:var(--mm-text-xs)">As barrinhas salvam sozinhas e {{ p.name }} vê na hora.</p>

          <details class="more">
            <summary>Relação com {{ p.name }}</summary>
            <div class="more-body">
              @if (both()) {
                <mm-button variant="secondary" [block]="true" [disabled]="busy()" (click)="propose(other(p.relation))">
                  Propor mudar pra {{ relationLabel(other(p.relation)).toLowerCase() }}
                </mm-button>
                <span class="mm-muted" style="font-size:var(--mm-text-xs)">
                  Mudar a relação fecha a parte íntima até {{ p.name }} confirmar.
                </span>
              }
              @if (p.confirmedByMe && p.relation === 'namoro') {
                <mm-button variant="ghost" [block]="true" [disabled]="busy()" (click)="confirm(false)">Retirar minha confirmação</mm-button>
              }
              <mm-button variant="ghost" [block]="true" [disabled]="busy()" (click)="disconnect()">Desfazer conexão</mm-button>
            </div>
          </details>
        }
      </div>
    } @else if (data.loading()) {
      <div class="mm-page"><p class="mm-muted">Carregando…</p></div>
    } @else {
      <div class="mm-page">
        <h1 class="mm-h1">Pessoa não encontrada</h1>
        <a routerLink="/pessoas">Voltar</a>
      </div>
    }
  `,
  styles: `
    .want-pill {
      font-size: var(--mm-text-xs); font-weight: 700; padding: 6px 12px; border-radius: var(--mm-radius-pill);
      background: var(--mm-surface); border: var(--mm-border-width) solid var(--mm-border);
    }
    .box {
      display: flex; flex-direction: column; gap: var(--mm-space-2); padding: var(--mm-space-4);
      border-radius: var(--mm-radius-md); background: var(--mm-surface); border: var(--mm-border-width) solid var(--mm-border);
    }
    .link { font-weight: 700; word-break: break-all; font-size: var(--mm-text-sm); }
    .more { border-top: var(--mm-border-width) solid var(--mm-border); padding-top: var(--mm-space-3); }
    .more summary { min-height: var(--mm-touch); display: flex; align-items: center; cursor: pointer; font-weight: 700; color: var(--mm-text-muted); }
    .more-body { display: flex; flex-direction: column; gap: var(--mm-space-2); padding-top: var(--mm-space-2); }
  `,
})
export class PessoaPage {
  readonly id = input.required<string>();
  protected readonly data = inject(DataService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly busy = signal(false);

  protected readonly person = computed(() => this.data.people().find((p) => p.id === this.id()));
  protected readonly both = computed(() => {
    const p = this.person();
    return !!p && bothConfirmed(p);
  });
  protected readonly open = computed(() => {
    const p = this.person();
    return !!p && intimateOpen(p);
  });
  protected readonly when = computed(() => relativeTime(this.person()?.when ?? null));
  protected readonly link = computed(() => inviteUrl(this.person()?.inviteCode ?? ''));
  protected readonly basic = computed(() => WANTS[this.person()?.relation ?? 'amizade'].filter((w) => !w.intimate));
  protected readonly intimate = computed(() => WANTS[this.person()?.relation ?? 'amizade'].filter((w) => w.intimate));

  protected readonly theirSummary = computed(() => {
    const p = this.person();
    if (!p) return [];
    return WANTS[p.relation]
      .filter((w) => p.theirWants[w.id] !== undefined && (!w.intimate || this.open()))
      .map((w) => {
        const v = p.theirWants[w.id];
        return { id: w.id, label: w.label, arrow: v >= 65 ? '↑' : v <= 35 ? '↓' : '=' };
      });
  });

  protected relationLabel = (r: Relation) => RELATION_LABEL[r];
  protected other = (r: Relation): Relation => (r === 'namoro' ? 'amizade' : 'namoro');

  private async run(fn: () => Promise<unknown>, ok: string): Promise<void> {
    this.busy.set(true);
    try {
      await fn();
      this.toast.show(ok);
    } catch {
      this.toast.show('Não deu certo agora. Tenta de novo?');
    } finally {
      this.busy.set(false);
    }
  }

  protected confirm(on: boolean) {
    return this.run(() => this.data.setMyConfirmation(this.id(), on), on ? 'Relação confirmada' : 'Confirmação retirada');
  }

  protected propose(r: Relation) {
    return this.run(() => this.data.proposeRelation(this.id(), r), `Proposta de ${RELATION_LABEL[r].toLowerCase()} enviada`);
  }

  protected async disconnect(): Promise<void> {
    await this.run(() => this.data.disconnect(this.id()), 'Conexão desfeita');
    this.router.navigate(['/pessoas']);
  }

  protected async cancel(code: string): Promise<void> {
    await this.run(() => this.data.cancelInvite(code), 'Convite cancelado');
    this.router.navigate(['/pessoas']);
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
      this.toast.show('Link copiado');
    } catch {
      this.toast.show('Não deu pra copiar aqui. Seleciona o link e copia.');
    }
  }
}
