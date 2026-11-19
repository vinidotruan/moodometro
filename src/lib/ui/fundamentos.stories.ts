import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MOODS } from './mood';

const meta: Meta = {
  title: 'Fundamentos',
  parameters: { controls: { disable: true } },
};
export default meta;
type Story = StoryObj;

const SEMANTIC = [
  ['--mm-bg', 'Fundo'],
  ['--mm-surface', 'Superfície'],
  ['--mm-surface-raised', 'Superfície elevada'],
  ['--mm-border', 'Borda'],
  ['--mm-border-strong', 'Borda forte'],
  ['--mm-text', 'Texto'],
  ['--mm-text-muted', 'Texto suave'],
  ['--mm-primary', 'Primária (mauve)'],
  ['--mm-accent', 'Destaque (peach)'],
  ['--mm-focus', 'Foco (lavender)'],
].map(([token, label]) => ({ token, label }));

const CTP = ['rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender',
  'text', 'subtext1', 'subtext0', 'overlay2', 'overlay1', 'overlay0', 'surface2', 'surface1', 'surface0', 'base', 'mantle', 'crust'];

const swatch = `
  <div style="display:flex;flex-direction:column;gap:4px">
    <div [style.background]="'var(' + s.token + ')'" style="height:56px;border-radius:12px;border:1.5px solid var(--mm-border)"></div>
    <strong style="font-size:13px">{{ s.label }}</strong>
    <code style="font-size:12px;color:var(--mm-text-muted)">{{ s.token }}</code>
  </div>`;

export const Cores: Story = {
  render: () => ({
    props: {
      semantic: SEMANTIC,
      moods: MOODS.map((m) => ({ token: `--mm-mood-${m.id}`, label: m.label })),
      ctp: CTP.map((c) => ({ token: `--ctp-${c}`, label: c })),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:28px;max-width:960px">
        <section>
          <h2 style="font-family:var(--mm-font-heading);margin:0 0 4px">Tokens semânticos</h2>
          <p style="margin:0 0 12px;color:var(--mm-text-muted);font-size:14px">É isso que os componentes usam. Troque o tema na barra de cima.</p>
          <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px">
            @for (s of semantic; track s.token) {${swatch}}
          </div>
        </section>
        <section>
          <h2 style="font-family:var(--mm-font-heading);margin:0 0 12px">Humores</h2>
          <div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px">
            @for (s of moods; track s.token) {${swatch}}
          </div>
        </section>
        <section>
          <h2 style="font-family:var(--mm-font-heading);margin:0 0 12px">Paleta Catppuccin (crua)</h2>
          <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:14px">
            @for (s of ctp; track s.token) {${swatch}}
          </div>
        </section>
      </div>`,
  }),
};

export const Tipografia: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:14px;max-width:640px">
        <div style="display:flex;gap:24px;align-items:flex-end">
          <span style="font-family:var(--mm-font-heading);font-weight:600;font-size:88px;line-height:.9">Aa</span>
          <div style="font-size:14px;color:var(--mm-text-muted)">
            <div><strong style="color:var(--mm-text)">Títulos:</strong> Fredoka 500/600</div>
            <div><strong style="color:var(--mm-text)">Texto:</strong> Nunito 400/600/700</div>
          </div>
        </div>
        <div style="font-family:var(--mm-font-heading);font-weight:600;font-size:var(--mm-text-xl);line-height:1.1">XL 30 · Como você tá hoje?</div>
        <div style="font-family:var(--mm-font-heading);font-weight:600;font-size:var(--mm-text-lg)">LG 22 · O que eu quero hoje</div>
        <div style="font-size:var(--mm-text-md)">MD 16 · Hoje eu tô mais choroso e queria um pouco mais de carinho.</div>
        <div style="font-size:var(--mm-text-sm)">SM 14 · Texto de chips e botões médios</div>
        <div style="font-size:var(--mm-text-xs);color:var(--mm-text-muted)">XS 13 · há 20 min · visto pelo Lucas</div>
      </div>`,
  }),
};

export const EspacosERaios: Story = {
  name: 'Espaços e raios',
  render: () => ({
    props: {
      spaces: [1, 2, 3, 4, 5, 6, 8].map((n) => `--mm-space-${n}`),
      radii: ['--mm-radius-sm', '--mm-radius-md', '--mm-radius-pill'],
    },
    template: `
      <div style="display:flex;gap:48px;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;gap:8px">
          @for (s of spaces; track s) {
            <div style="display:flex;align-items:center;gap:12px">
              <div [style.width]="'var(' + s + ')'" style="height:16px;background:var(--mm-primary);border-radius:3px"></div>
              <code style="font-size:12px">{{ s }}</code>
            </div>
          }
        </div>
        <div style="display:flex;gap:16px">
          @for (r of radii; track r) {
            <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
              <div [style.border-radius]="'var(' + r + ')'" style="width:80px;height:80px;background:var(--mm-surface);border:1.5px solid var(--mm-border-strong)"></div>
              <code style="font-size:12px">{{ r }}</code>
            </div>
          }
        </div>
      </div>`,
  }),
};
