import type { Meta, StoryObj } from '@storybook/angular-vite';
import { argsToTemplate } from '@storybook/angular-vite';
import { ButtonComponent } from './button.component';

type Args = ButtonComponent & { label: string };

const meta: Meta<Args> = {
  title: 'Componentes/Botão',
  component: ButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
  },
  args: { label: 'Compartilhar humor', variant: 'primary', size: 'lg', disabled: false, loading: false, block: false },
  render: ({ label, ...args }) => ({
    props: args,
    template: `<mm-button ${argsToTemplate(args)}>${label}</mm-button>`,
  }),
};
export default meta;
type Story = StoryObj<Args>;

export const Primario: Story = {};
export const Secundario: Story = { args: { variant: 'secondary', label: 'Agora não' } };
export const Fantasma: Story = { args: { variant: 'ghost', label: 'Pular' } };
export const Carregando: Story = { args: { loading: true, label: 'Enviando…' } };
export const Desativado: Story = { args: { disabled: true } };
export const LarguraTotal: Story = { args: { block: true } };

export const Todos: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
        <mm-button size="lg">Primário</mm-button>
        <mm-button size="lg" variant="secondary">Secundário</mm-button>
        <mm-button size="lg" variant="ghost">Fantasma</mm-button>
        <mm-button size="lg" [loading]="true">Enviando…</mm-button>
        <mm-button size="lg" [disabled]="true">Desativado</mm-button>
        <mm-button>Médio</mm-button>
      </div>`,
  }),
};
