import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MOODS } from '../mood';
import { MoodCardComponent } from './mood-card.component';
import { MoodPickerComponent } from '../mood-picker/mood-picker.component';
import { MoodIconComponent } from '../mood-icon/mood-icon.component';

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

export const Icones: Story = {
  name: 'Ícones (gatinhos)',
  render: () => ({
    moduleMetadata: { imports: [MoodIconComponent] },
    props: { moods: MOODS },
    template: `
      <div style="display:flex;gap:16px">
        @for (m of moods; track m.id) {
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px">
            <mm-mood-icon [mood]="m.id" [size]="48" [style.color]="'var(--mm-mood-' + m.id + ')'" />
            {{ m.label }}
          </div>
        }
      </div>`,
  }),
};
