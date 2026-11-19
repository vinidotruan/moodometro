import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent, PersonCardComponent } from '../../lib/ui';
import { DataService, relativeTime } from '../core/data.service';

@Component({
  selector: 'mm-pessoas-page',
  imports: [PersonCardComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mm-page">
      <h1 class="mm-h1">Pessoas</h1>
      <p class="mm-muted">Como tá todo mundo hoje</p>
      @if (data.loading() && data.people().length === 0) {
        <p class="mm-muted">Carregando…</p>
      } @else if (data.people().length === 0) {
        <p class="mm-muted">Ninguém por aqui ainda. Convida alguém!</p>
      }
      @for (p of data.people(); track p.id) {
        <mm-person-card
          [name]="p.name"
          [relation]="p.relation"
          [mood]="p.mood"
          [topic]="p.topic"
          [emptyText]="p.pending ? 'Convite enviado, esperando aceitar' : 'Ainda não marcou o humor hoje'"
          [when]="rel(p.when)"
          (open)="router.navigate(['/pessoas', p.id])"
        />
      }
      <mm-button size="lg" variant="secondary" [block]="true" (click)="router.navigate(['/convidar'])">+ Adicionar pessoa</mm-button>
    </div>
  `,
})
export class PessoasPage {
  protected readonly data = inject(DataService);
  protected readonly router = inject(Router);
  protected readonly rel = relativeTime;
}
