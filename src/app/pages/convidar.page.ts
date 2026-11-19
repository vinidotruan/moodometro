import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent, Relation, RELATION_LABEL } from '../../lib/ui';
import { DataService, inviteUrl } from '../core/data.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'mm-convidar-page',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!code()) {
      <form class="mm-page" (submit)="submit($event)">
        <h1 class="mm-h1">Convidar pessoa</h1>

        <div class="mm-field">
          <label class="mm-label" for="nome">Como você chama essa pessoa?</label>
          <input id="nome" class="mm-input" placeholder="Ex.: Lucas, mozão, Ana" autocomplete="off" maxlength="60"
            [value]="name()" (input)="name.set($any($event.target).value)" />
          <span class="mm-muted" style="font-size:var(--mm-text-xs)">Só você vê esse apelido. Depois aparece o nome que a pessoa usa.</span>
        </div>

        <fieldset class="opts">
          <legend class="mm-label">Tipo de relação</legend>
          @for (o of options; track o.id) {
            <label class="opt" [class.on]="relation() === o.id">
              <input type="radio" name="rel" [value]="o.id" [checked]="relation() === o.id" (change)="relation.set(o.id)" />
              <span>
                <strong>{{ o.title }}</strong>
                <span class="mm-muted">{{ o.desc }}</span>
              </span>
            </label>
          }
        </fieldset>

        <p class="mm-muted">Aceitar o convite conta como a confirmação da outra pessoa. Depois, qualquer um pode propor mudar.</p>

        <mm-button size="lg" type="submit" [block]="true" [loading]="busy()" [disabled]="!name().trim()">Criar convite</mm-button>
      </form>
    } @else {
      <div class="mm-page">
        <h1 class="mm-h1">Convite criado</h1>
        <p class="mm-muted">Manda esse link pra <strong>{{ name() }}</strong>. Vale por 7 dias e só pode ser usado uma vez.</p>
        <div class="link">{{ link() }}</div>
        <mm-button size="lg" [block]="true" (click)="copy()">Copiar link</mm-button>
        <mm-button variant="secondary" size="lg" [block]="true" (click)="router.navigate(['/pessoas'])">Ver em Pessoas</mm-button>
        <mm-button variant="ghost" [block]="true" (click)="again()">Convidar outra pessoa</mm-button>
      </div>
    }
  `,
  styles: `
    .opts { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--mm-space-3); }
    .opts legend { padding: 0; margin-bottom: var(--mm-space-3); }
    .opt {
      display: flex; gap: var(--mm-space-3); align-items: flex-start; cursor: pointer;
      padding: var(--mm-space-4); border-radius: var(--mm-radius-md);
      border: var(--mm-border-width) solid var(--mm-border); background: var(--mm-surface);
    }
    .opt.on { border-color: var(--mm-primary); box-shadow: inset 0 0 0 1px var(--mm-primary); }
    .opt input { width: 20px; height: 20px; margin: 2px 0 0; accent-color: var(--mm-primary); }
    .opt > span { display: flex; flex-direction: column; gap: 2px; }
    .link {
      padding: var(--mm-space-4); border-radius: var(--mm-radius-md); border: var(--mm-border-width) dashed var(--mm-border-strong);
      font-weight: 700; font-size: var(--mm-text-sm); word-break: break-all; user-select: all;
    }
  `,
})
export class ConvidarPage {
  private readonly data = inject(DataService);
  private readonly toast = inject(ToastService);
  protected readonly router = inject(Router);

  protected readonly name = signal('');
  protected readonly relation = signal<Relation>('amizade');
  protected readonly code = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly link = computed(() => (this.code() ? inviteUrl(this.code()!) : ''));
  protected readonly options: { id: Relation; title: string; desc: string }[] = [
    { id: 'namoro', title: RELATION_LABEL.namoro, desc: 'Carinho, atenção, comida + parte íntima' },
    { id: 'amizade', title: RELATION_LABEL.amizade, desc: 'Carinho, conversa, presente e rolê' },
  ];

  protected async submit(ev: Event): Promise<void> {
    ev.preventDefault();
    const n = this.name().trim();
    if (!n || this.busy()) return;
    this.busy.set(true);
    try {
      this.code.set(await this.data.createInvite(n, this.relation()));
    } catch {
      this.toast.show('Não deu pra criar o convite agora');
    } finally {
      this.busy.set(false);
    }
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
      this.toast.show('Link copiado');
    } catch {
      this.toast.show('Não deu pra copiar aqui. Seleciona o link e copia.');
    }
  }

  protected again(): void {
    this.name.set('');
    this.code.set(null);
  }
}
