import type { Meta, StoryObj } from '@storybook/angular-vite';
import { ChipComponent } from './chip.component';

type Args = ChipComponent & { label: string };

const meta: Meta<Args> = {
  title: 'Componentes/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
  args: { label: 'Nós dois', selected: false, disabled: false },
  render: ({ label, ...args }) => ({
    props: args,
    template: `<mm-chip [(selected)]="selected" [disabled]="disabled">${label}</mm-chip>`,
  }),
};
export default meta;
type Story = StoryObj<Args>;

export const Padrao: Story = {};
export const Selecionado: Story = { args: { selected: true } };
export const Desativado: Story = { args: { disabled: true } };

export const AssuntosDoDia: Story = {
  name: 'Assuntos do dia',
  render: () => ({
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <mm-chip>Trabalho</mm-chip>
        <mm-chip [selected]="true">Nós dois</mm-chip>
        <mm-chip>Família</mm-chip>
        <mm-chip>Prefiro não falar</mm-chip>
      </div>`,
  }),
};
