import type { Preview } from '@storybook/angular-vite';
import { componentWrapperDecorator } from '@storybook/angular-vite';
import '../src/styles.scss';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Tema Catppuccin',
      toolbar: {
        title: 'Tema',
        icon: 'mirror',
        items: [
          { value: 'latte', title: 'Latte (claro)' },
          { value: 'mocha', title: 'Mocha (escuro)' },
          { value: 'side', title: 'Lado a lado' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'latte' },
  decorators: [
    componentWrapperDecorator(
      (story) => `
        @if (theme === 'side') {
          <div style="display:grid;grid-template-columns:1fr 1fr;min-height:100vh">
            <div class="mm-root" data-theme="latte" style="padding:24px">${story}</div>
            <div class="mm-root" data-theme="mocha" style="padding:24px">${story}</div>
          </div>
        } @else {
          <div class="mm-root" [attr.data-theme]="theme" style="padding:24px;min-height:100vh;box-sizing:border-box">${story}</div>
        }`,
      ({ globals }) => ({ theme: globals['theme'] ?? 'latte' }),
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: { storySort: { order: ['Fundamentos', 'Componentes', 'Telas'] } },
  },
};

export default preview;
