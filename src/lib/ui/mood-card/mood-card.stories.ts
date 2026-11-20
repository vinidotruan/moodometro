import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MOODS } from '../mood';
import { MoodCardComponent } from './mood-card.component';
import { MoodPickerComponent } from '../mood-picker/mood-picker.component';

const meta: Meta<MoodCardComponent> = {
  title: 'Componentes/Humor',
  component: MoodCardComponent,
  tags: ['autodocs'],
  argTypes: {
    mood: { control: 'select', options: MOODS.map((m) => m.id) },
    pick: { action: 'pick' },
  },
  args: { mood: 'alegre', selected: true },
};
export default meta;
type Story = StoryObj<MoodCardComponent>;

export const Card: Story = {
  render: (args) => ({
    props: args,
    template: `<div style="width:120px"><mm-mood-card [mood]="mood" [selected]="selected" (pick)="pick($event)" /></div>`,
  }),
};

export const NomePersonalizado: Story = {
  name: 'Nome personalizado',
  render: () => ({
    template: `<div style="width:120px"><mm-mood-card mood="choroso" label="Chorão" [selected]="true" /></div>`,
  }),
};

export const Seletor: Story = {
  name: 'Seletor de humor',
  render: () => ({
    moduleMetadata: { imports: [MoodPickerComponent] },
    props: { value: 'alegre' },
    template: `
      <div style="max-width:350px">
        <mm-mood-picker [(value)]="value" />
        <p style="font-size:13px;opacity:.8">Selecionado: {{ value }}</p>
      </div>`,
  }),
};

/** Foto de exemplo (SVG inline) pra mostrar o card com foto sem depender de arquivo. */
const FOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f5c2e7"/>` +
      `<circle cx="50" cy="58" r="30" fill="#fab387"/><circle cx="40" cy="52" r="4" fill="#1e1e2e"/>` +
      `<circle cx="60" cy="52" r="4" fill="#1e1e2e"/><path d="M38 66 q12 10 24 0" stroke="#1e1e2e" stroke-width="4" fill="none"/></svg>`,
  );

export const ComFoto: Story = {
  name: 'Com foto e humor criado',
  render: () => ({
    moduleMetadata: { imports: [MoodPickerComponent] },
    props: {
      moods: [
        { ...MOODS[0], photo: FOTO },
        ...MOODS.slice(1, 3),
        { id: 'c-festeiro', label: 'Festeiro', emoji: '🥳', custom: true },
      ],
      value: 'alegre',
    },
    template: `
      <div style="max-width:350px">
        <mm-mood-picker [moods]="moods" [(value)]="value" />
        <p style="font-size:13px;opacity:.8">No app, a foto entra em Perfil → Meus humores (toque na carinha).</p>
      </div>`,
  }),
};
