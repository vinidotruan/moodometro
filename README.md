# Moodômetro UI

Biblioteca de componentes do Moodômetro em **Angular 22** + **Storybook 10**, com tema **Catppuccin** (Latte claro / Mocha escuro).

## Rodar

```bash
npm install
npm start                # app em http://localhost:4200
npm run storybook        # componentes em http://localhost:6006
npm run build            # gera dist/moodometro-ui/browser (estático, qualquer hospedagem)
```

## App

Rotas (hash routing, `#/hoje` etc.):

| Rota | Tela |
|---|---|
| `/entrar` | Entrar ou criar conta (usuário e senha) |
| `/hoje` | Escolher humor, assunto, quem vê, compartilhar |
| `/pessoas` | Lista com o humor de cada um |
| `/pessoas/:id` | O que a pessoa quer + o que eu quero (seção íntima só em namoro confirmado) |
| `/convidar` | Cria convite (link de 7 dias, uso único) |
| `/convite/:código` | Aceitar convite (se não estiver logado, entra e volta pra cá) |
| `/perfil` | Tema, humores (nome, foto, criar e apagar), sair |

As telas só falam com `src/app/core/data.service.ts`, que escolhe o backend:

- `backend/local-backend.ts`: modo demo, dados no localStorage. Simula a outra pessoa confirmando a relação depois de 2 s.
- `backend/firestore-backend.ts`: modo firebase, tempo real com `onSnapshot`.

## Login (usuário e senha)

`src/app/core/config.ts`: **`mode: 'demo'`** (contas e dados só no navegador) ou **`'firebase'`** (login real e Firestore). Tem o passo a passo no próprio arquivo.

`src/app/core/auth/`:

- `auth.service.ts`: signals `user`, `signedIn`, `ready`; `signIn(usuário, senha)` e `signUp(usuário, nome, senha)`. As telas só falam com ele.
- `auth.types.ts`: regras do usuário (3 a 20 caracteres: letras, números, ponto e _; sempre minúsculo) e da senha (mínimo 6).
- `demo-auth.ts`: contas no localStorage, com a senha em hash SHA-256 + salt. É só pra navegar pela demo, não é segurança de verdade.
- `firebase-auth.ts`: Firebase Auth com e-mail e senha; o usuário vira um e-mail sintético (`ruan@usuarios.moodometro.app`). O SDK só é baixado no modo firebase.
- `auth.guard.ts`: `requireAuth` / `redirectIfSignedIn`.

Pontos de atenção:
- No Firebase, ative o provedor **E-mail/senha** em Authentication → Sign-in method.
- Sem e-mail de verdade não dá pra recuperar senha por e-mail; se precisar, peça um e-mail opcional no cadastro.
- O front nunca é a barreira de segurança: o backend deve validar o ID token do Firebase e decidir quem vê o quê (principalmente a seção íntima).

Na barra do Storybook, o botão **Tema** troca entre Latte, Mocha e "Lado a lado".

## Firestore

### Modelo de dados

| Caminho | O que guarda | Quem lê | Quem escreve |
|---|---|---|---|
| `users/{uid}` | nome, nomes personalizados dos humores | a própria pessoa e quem está conectado | a própria pessoa |
| `statuses/{uid}` | humor compartilhado, recado, assuntos, `viewers`, `sharedAt` | dono; quem está em `viewers` **e** ainda conectado (só doc a doc, sem `list`) | dono (`sharedAt` = hora do servidor) |
| `invites/{código}` | quem convidou, apelido, relação, validade, `usedBy` | quem tem o código (`get`); dono lista os seus | dono cria/apaga; quem aceita marca `usedBy` |
| `connections/{uidA_uidB}` | `members`, `relation`, `confirmedBy` | os dois membros | os dois (com regras de confirmação) |
| `connections/{id}/wants/{uid}` | carinho, comida, conversa… (0–100) | os dois | cada um o seu |
| `connections/{id}/intimate/{uid}` | sexo, intensidade (0–100) | os dois, **só se namoro e os dois confirmaram** | idem |

O id da conexão é determinístico (uids em ordem, `a_b`), e por isso as regras sabem se duas pessoas estão conectadas com um `exists()`, sem query.

### Regras (`firestore.rules`)

- **Aceitar convite** é um batch com 2 writes: cria a conexão e marca `usedBy`. As regras checam um contra o outro com `getAfter` / `existsAfter`. Não dá pra trocar a relação do convite, reusar, aceitar expirado ou aceitar o próprio convite.
- **Relação:** propor outra relação zera `confirmedBy` e deixa só a de quem propôs. Cada um só mexe na própria confirmação.
- **Parte íntima:** abre só com `relation == 'namoro'` e os dois em `confirmedBy`. Rebaixar pra amizade ou qualquer um retirar a confirmação fecha **na hora**, tanto leitura quanto escrita. Apagar o próprio dado íntimo é sempre permitido.
- **Status:** desfazer a conexão corta o acesso ao humor na hora, mesmo que o dono ainda não tenha tirado a pessoa de `viewers`.
- **Validação:** só chaves conhecidas, valores inteiros de 0 a 100, textos com limite de tamanho.

### Rodar e testar

```bash
npm run test:rules     # sobe o emulador e roda tests/firestore.rules.test.ts (precisa de Java 11+)
npm run emulators      # Auth + Firestore locais; use com useEmulators: true no config.ts
npm run deploy:rules   # publica regras e índices (depois de `npx firebase use <projeto>`)
```

### Limitações conhecidas

- **Subcoleções órfãs:** desfazer conexão apaga os meus `wants`/`intimate`, mas os da outra pessoa ficam (ilegíveis, porque a conexão sumiu). Limpar de vez pede uma Cloud Function `onDelete`.
- **`viewers` não é validado contra as conexões na escrita.** O app filtra, e a leitura exige conexão, então um uid aleatório em `viewers` não consegue ler nada. Mas o dado fica lá.
- **Sem Cloud Functions:** não tem notificação push nem expiração automática de convites (o convite expirado só deixa de funcionar, não é apagado).
- **Excluir conta:** ainda não tem fluxo. Pela LGPD vai precisar (apagar `users`, `statuses`, conexões e subcoleções).

## Estrutura

```
src/
  styles.scss                 # aplica os temas via [data-theme]
  lib/styles/_tokens.scss     # paleta Catppuccin (--ctp-*) + tokens semânticos (--mm-*)
  lib/ui/
    mood.ts                   # tipos Mood/Relation + definição dos 6 humores
    button/  chip/  mood-icon/  mood-card/  mood-picker/
    want-slider/  private-section/  person-card/  tab-bar/
    fundamentos.stories.ts    # cores, tipografia, espaços
    telas.stories.ts          # telas montadas com os componentes
    index.ts                  # barrel de exportação
```

## Tokens

Duas camadas:

1. `--ctp-*`: as 26 cores cruas da paleta Catppuccin de cada flavor.
2. `--mm-*`: tokens semânticos (`--mm-bg`, `--mm-primary`, `--mm-mood-alegre`…). **Componentes só usam esta camada**, então dá pra trocar o mapeamento sem mexer neles.

Tema: `<html data-theme="latte">` ou `"mocha"`. Sem atributo, segue `prefers-color-scheme`.

Cor dos humores: no Latte as cores são saturadas, então o card selecionado usa
`color-mix(... var(--mm-mood-mix) ...)` (25%) com a base; no Mocha os pastéis entram puros (100%) com texto escuro.

## Componentes

| Componente | Seletor | API principal |
|---|---|---|
| Botão | `mm-button` | `variant` primary/secondary/ghost, `size` md/lg, `loading`, `disabled`, `block` |
| Chip | `mm-chip` | `[(selected)]` |
| Ícone de humor | `mm-mood-icon` | `mood`, `size` |
| Card de humor | `mm-mood-card` | `mood`, `selected`, `label`, `(pick)` |
| Seletor de humor | `mm-mood-picker` | `[(value)]`, `moods` (pra humores customizados) |
| Barrinha "o que eu quero" | `mm-want-slider` | `label`, `low`, `high`, `[(value)]` 0–100 |
| Seção íntima | `mm-private-section` | `unlocked`: sem ele o conteúdo **nem vai pro DOM** |
| Card de pessoa | `mm-person-card` | `name`, `relation`, `mood`, `topic`, `when`, `(open)` |
| Barra de abas | `mm-tab-bar` | `tabs`, `[(active)]` |

Todos standalone, `OnPush`, inputs com signals.

## Observações

- `mm-private-section` só esconde na interface. Quem garante o acesso são as regras do Firestore (ver acima).
- Fontes: Fredoka (títulos) + Nunito (texto), via Google Fonts em `.storybook/preview-head.html`. No app, adicione o mesmo `<link>` no `index.html`.
- Paleta: [catppuccin.com/palette](https://catppuccin.com/palette) (licença MIT).
