import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  ButtonComponent,
  ChipComponent,
  MoodPickerComponent,
  PersonCardComponent,
  PrivateSectionComponent,
  TabBarComponent,
  WantSliderComponent,
} from './index';

const imports = [ButtonComponent, ChipComponent, MoodPickerComponent, PersonCardComponent, PrivateSectionComponent, TabBarComponent, WantSliderComponent];

const phone = (inner: string) => `
  <div style="width:390px;height:844px;margin:0 auto;border-radius:36px;overflow:hidden;display:flex;flex-direction:column;
              background:var(--mm-bg);border:1.5px solid var(--mm-border-strong)">
    ${inner}
  </div>`;

const h1 = 'font-family:var(--mm-font-heading);font-weight:600;font-size:var(--mm-text-xl);line-height:1.1;margin:0';
const h2 = 'font-family:var(--mm-font-heading);font-weight:600;font-size:var(--mm-text-lg);margin:4px 0 0';

const meta: Meta = {
  title: 'Telas',
  parameters: { controls: { disable: true } },
};
export default meta;
type Story = StoryObj;

export const Hoje: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: { mood: 'alegre', tab: 'hoje' },
    template: phone(`
      <div style="flex:1;padding:28px 20px 16px;display:flex;flex-direction:column;gap:16px;overflow:auto">
        <div style="font-size:14px;color:var(--mm-text-muted)">Quinta, 19 nov</div>
        <h1 style="${h1}">Como você tá hoje?</h1>
        <mm-mood-picker [(value)]="mood" />
        <label for="falar" style="font-weight:700">Hoje eu quero falar sobre…</label>
        <textarea id="falar" placeholder="Escreve aqui (opcional)"
          style="height:68px;margin-top:-8px;padding:12px;box-sizing:border-box;resize:none;font:inherit;font-size:14px;color:var(--mm-text);
                 background:var(--mm-surface);border:1.5px solid var(--mm-border);border-radius:var(--mm-radius-md)"></textarea>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <mm-chip>Trabalho</mm-chip><mm-chip [selected]="true">Nós dois</mm-chip><mm-chip>Família</mm-chip>
        </div>
        <mm-button size="lg" [block]="true" style="margin-top:auto">Compartilhar humor</mm-button>
      </div>
      <mm-tab-bar [(active)]="tab" />`),
  }),
};

export const Pessoas: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: { tab: 'pessoas' },
    template: phone(`
      <div style="flex:1;padding:28px 20px 16px;display:flex;flex-direction:column;gap:12px;overflow:auto">
        <h1 style="${h1}">Pessoas</h1>
        <p style="margin:0 0 4px;color:var(--mm-text-muted);font-size:14px">Como tá todo mundo hoje</p>
        <mm-person-card name="Lucas" relation="namoro" mood="carente" topic="nós dois" when="há 20 min" />
        <mm-person-card name="Ana" relation="amizade" mood="alegre" topic="trabalho novo" when="há 2 h" />
        <mm-person-card name="Pedro" relation="amizade" mood="cansado" when="há 5 h" />
        <mm-person-card name="Bia" relation="amizade" />
        <mm-button size="lg" [block]="true" style="margin-top:auto">+ Adicionar pessoa</mm-button>
      </div>
      <mm-tab-bar [(active)]="tab" />`),
  }),
};

export const Namoro: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: { carinho: 85, atencao: 60, comida: 50, sexo: 70, intensidade: 40 },
    template: phone(`
      <div style="flex:1;padding:28px 20px 20px;display:flex;flex-direction:column;gap:14px;overflow:auto">
        <mm-person-card name="Lucas" relation="namoro" mood="carente" topic="nós dois" when="há 20 min" />
        <h2 style="${h2}">O que eu quero hoje</h2>
        <mm-want-slider label="Carinho" [(value)]="carinho" />
        <mm-want-slider label="Atenção / conversa" low="Quero espaço" high="Quero grude" [(value)]="atencao" />
        <mm-want-slider label="Comida" [(value)]="comida" />
        <mm-private-section [unlocked]="true">
          <mm-want-slider label="Sexo" [(value)]="sexo" />
          <mm-want-slider label="Intensidade" low="Mais suave" high="Mais intenso" [(value)]="intensidade" />
        </mm-private-section>
        <mm-button size="lg" [block]="true">Enviar pro Lucas</mm-button>
      </div>`),
  }),
};

export const Amizade: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: phone(`
      <div style="flex:1;padding:28px 20px 20px;display:flex;flex-direction:column;gap:14px;overflow:auto">
        <mm-person-card name="Ana" relation="amizade" mood="alegre" topic="trabalho novo" when="há 2 h" />
        <h2 style="${h2}">O que eu quero hoje</h2>
        <mm-want-slider label="Carinho / apoio" [value]="55" />
        <mm-want-slider label="Conversa" low="Quero espaço" high="Bora conversar" [value]="75" />
        <mm-want-slider label="Presente / mimo" low="Nada" high="Me mima" [value]="40" />
        <mm-want-slider label="Rolê / comida" low="Ficar em casa" high="Bora sair" [value]="65" />
        <mm-private-section [unlocked]="false" lockedText="Seção íntima oculta em amizades" />
        <mm-button size="lg" [block]="true" style="margin-top:auto">Enviar pra Ana</mm-button>
      </div>`),
  }),
};
