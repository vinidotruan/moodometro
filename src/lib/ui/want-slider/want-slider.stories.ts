import type { Meta, StoryObj } from '@storybook/angular-vite';
import { WantSliderComponent } from './want-slider.component';
import { PrivateSectionComponent } from '../private-section/private-section.component';

const meta: Meta<WantSliderComponent> = {
  title: 'Componentes/O que eu quero',
  component: WantSliderComponent,
  tags: ['autodocs'],
  args: { label: 'Carinho', low: 'Menos', high: 'Mais', value: 70, step: 5, disabled: false },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:350px"><mm-want-slider [label]="label" [low]="low" [high]="high" [(value)]="value" [step]="step" [disabled]="disabled" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<WantSliderComponent>;

export const Barrinha: Story = {};
export const RotulosCustom: Story = {
  name: 'Rótulos personalizados',
  args: { label: 'Atenção / conversa', low: 'Quero espaço', high: 'Quero grude', value: 40 },
};

export const SecaoIntima: Story = {
  name: 'Seção íntima (namoro)',
  render: () => ({
    moduleMetadata: { imports: [PrivateSectionComponent] },
    template: `
      <div style="max-width:350px">
        <mm-private-section [unlocked]="true">
          <mm-want-slider label="Sexo" [value]="70" />
          <mm-want-slider label="Intensidade" low="Mais suave" high="Mais intenso" [value]="40" />
        </mm-private-section>
      </div>`,
  }),
};

export const SecaoIntimaOculta: Story = {
  name: 'Seção íntima (amizade, oculta)',
  render: () => ({
    moduleMetadata: { imports: [PrivateSectionComponent] },
    template: `
      <div style="max-width:350px">
        <mm-private-section [unlocked]="false" lockedText="Seção íntima oculta em amizades">
          <mm-want-slider label="Sexo" [value]="70" />
        </mm-private-section>
      </div>`,
  }),
};
