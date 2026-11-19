import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent, MoodIconComponent, RELATION_LABEL } from '../../lib/ui';
import { DataService, InvitePreview } from '../core/data.service';
import { ToastService } from '../core/toast.service';

/** Abre pelo link do convite: #/convite/<código>. Exige login (o guard manda pro /entrar e volta). */
@Component({
  selector: 'mm-convite-page',
  imports: [ButtonComponent, MoodIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="wrap">
      @if (state() === 'loading') {
        <p class="mm-muted">Abrindo convite…</p>
      } @else if (invite(); as inv) {
        <mm-mood-icon mood="animado" [size]="64" style="color: var(--mm-primary)" />
        @if (inv.mine) {
          <h1 class="mm-h1">Esse convite é seu</h1>
          <p class="mm-muted">Manda o link pra outra pessoa abrir.</p>
        } @else if (inv.used) {
          <h1 class="mm-h1">Convite já usado</h1>
          <p class="mm-muted">Pede um link novo pra {{ inv.fromName }}.</p>
        } @else if (inv.expired) {
          <h1 class="mm-h1">Convite expirado</h1>
          <p class="mm-muted">Pede um link novo pra {{ inv.fromName }}.</p>
        } @else {
          <h1 class="mm-h1">{{ inv.fromName }} te convidou</h1>
          <p class="mm-muted">
            Como <strong>{{ label(inv) }}</strong>. Aceitando, vocês veem o humor um do outro
            e o que cada um tá precisando.
            @if (inv.relation === 'namoro') { A parte íntima também fica disponível pros dois. }
          </p>
          <mm-button size="lg" [block]="true" [loading]="state() === 'accepting'" (click)="accept()">Aceitar convite</mm-button>
        }
        <mm-button variant="ghost" [block]="true" (click)="router.navigate(['/hoje'])">Agora não</mm-button>
      } @else {
        <h1 class="mm-h1">Convite não encontrado</h1>
        <p class="mm-muted">Confere se o link veio inteiro.</p>
        <mm-button variant="secondary" [block]="true" (click)="router.navigate(['/hoje'])">Ir pro app</mm-button>
      }
    </main>
  `,
  styles: `
    .wrap {
      min-height: 100dvh; box-sizing: border-box; max-width: 420px; margin: 0 auto; padding: var(--mm-space-8) var(--mm-space-6);
      display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: var(--mm-space-4);
    }
    mm-button { align-self: stretch; }
  `,
})
export class ConvitePage implements OnInit {
  readonly code = input.required<string>();
  private readonly data = inject(DataService);
  private readonly toast = inject(ToastService);
  protected readonly router = inject(Router);

  protected readonly state = signal<'loading' | 'ready' | 'accepting'>('loading');
  protected readonly invite = signal<InvitePreview | null>(null);

  async ngOnInit(): Promise<void> {
    this.invite.set(await this.data.readInvite(this.code()));
    this.state.set('ready');
  }

  protected label(inv: InvitePreview): string {
    return RELATION_LABEL[inv.relation].toLowerCase();
  }

  protected async accept(): Promise<void> {
    this.state.set('accepting');
    try {
      const personId = await this.data.acceptInvite(this.code());
      this.toast.show('Conectados!');
      await this.router.navigate(['/pessoas', personId]);
    } catch (e) {
      this.toast.show((e as Error).message || 'Não deu pra aceitar agora');
      this.state.set('ready');
    }
  }
}
