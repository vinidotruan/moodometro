import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MOODS } from '../mood';
import { PersonCardComponent } from './person-card.component';

const meta: Meta<PersonCardComponent> = {
  title: 'Componentes/Card de pessoa',
  component: PersonCardComponent,
  tags: ['autodocs'],
  argTypes: {
    mood: { control: 'select', options: [null, ...MOODS.map((m) => m.id)] },
    relation: { control: 'inline-radio', options: ['namoro', 'amizade'] },
    open: { action: 'open' },
  },
  args: { name: 'Lucas', relation: 'namoro', mood: 'carente', topic: 'nós dois', when: 'há 20 min' },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:350px"><mm-person-card [name]="name" [relation]="relation" [mood]="mood" [topic]="topic" [when]="when" (open)="open()" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<PersonCardComponent>;

export const Namoro: Story = {};
export const Amizade: Story = { args: { name: 'Ana', relation: 'amizade', mood: 'alegre', topic: 'trabalho novo', when: 'há 2 h' } };
export const SemHumor: Story = { name: 'Sem humor hoje', args: { name: 'Bia', relation: 'amizade', mood: null, topic: null, when: null } };
