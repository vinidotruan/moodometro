import type { Meta, StoryObj } from '@storybook/angular-vite';
import { TabBarComponent } from './tab-bar.component';

const meta: Meta<TabBarComponent> = {
  title: 'Componentes/Barra de abas',
  component: TabBarComponent,
  tags: ['autodocs'],
  args: { active: 'hoje' },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:390px"><mm-tab-bar [(active)]="active" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<TabBarComponent>;

export const Padrao: Story = {};
export const Pessoas: Story = { args: { active: 'pessoas' } };
