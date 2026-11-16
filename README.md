# Humanity's Best Friend (TES_HBF)

Jogo de investigação *point-and-click* para navegador, feito na disciplina de Tópicos Especiais (`tes786205`).
MEE, um robô que acorda numa praia 87 anos depois do Arrebatamento, precisa se passar por humano usando uma venda,
investigar a casa para onde o Agente o leva e descobrir o que aconteceu com o antigo morador.

O jogo em si é HTML/CSS/JavaScript puro (módulos ES, sem *bundler*) em `public/game/`.
A aplicação Next.js na raiz apenas exibe o jogo em tela cheia através de um `iframe`.

## Como rodar

### Opção 1: com Next.js (como o projeto é publicado)

Requisitos: Node.js 20+ e [pnpm](https://pnpm.io/).

```bash
pnpm install
```

```bash
pnpm dev
```

Abra <http://localhost:3000>. Para gerar a versão de produção:

```bash
pnpm build
```

```bash
pnpm start
```

### Opção 2: só o jogo, sem instalar nada

O jogo é estático, então qualquer servidor HTTP serve (abrir o `index.html` direto pelo `file://` não funciona por causa dos módulos ES):

```bash
cd public/game && python3 -m http.server 8000
```

Abra <http://localhost:8000>.

### Controles

- Mouse: botões de ação na parte de baixo da tela, botão da venda e barra superior (Inventário, Objetivos, Pausar).
- **Espaço**: completa o texto do diálogo / pula a introdução.
- **Esc**: fecha o documento, o livro, o cofre, o inventário e os objetivos (uma camada por vez) e retoma o jogo pausado.
- **Setas**: viram as páginas do livro.

### Configuração da Feira de Jogos

Edite `public/game/data/feira-config.js`:

- `productId`: id do jogo cadastrado no banco da Feira de Jogos (hoje está `1`, valor provisório);
- `creditValue`: quantidade de tijolinhos creditados ao terminar o jogo;
- o domínio onde o jogo roda precisa estar nas origens autorizadas do *client* Google usado pela Feira (`clientId`).

## Onde está cada entrega

Entregas listadas no [projeto da disciplina](https://github.com/orgs/tes786205/projects/2) (issues de [`tes786205/docs`](https://github.com/tes786205/docs/issues) e [`tes786205/game`](https://github.com/tes786205/game/issues)).

| Entrega | Onde está no projeto |
|---|---|
| Premissa do jogo ([docs#7](https://github.com/tes786205/docs/issues/7)) | [`docs/Premissa.md`](docs/Premissa.md) |
| Game design ([docs#8](https://github.com/tes786205/docs/issues/8)) | [`docs/GDD.md`](docs/GDD.md) |
| Level design ([docs#9](https://github.com/tes786205/docs/issues/9)) | Fluxo dos cenários em [`docs/GDD.md`](docs/GDD.md) (Jogabilidade detalhada) e definição dos cenários em [`public/game/data/scenes.js`](public/game/data/scenes.js) |
| Implementação do(s) mapa(s) ([game#17](https://github.com/tes786205/game/issues/17)) | Imagens em [`public/game/assets/maps/`](public/game/assets/maps) (`C_Venda/` com venda, `S_Venda/` sem venda; originais em [`maps/`](maps)); cenários em [`public/game/data/scenes.js`](public/game/data/scenes.js); carregamento em [`public/game/game/scene-loader.js`](public/game/game/scene-loader.js) |
| Projeto e implementação dos sprites ([game#18](https://github.com/tes786205/game/issues/18)) | Itens em [`public/game/assets/items/`](public/game/assets/items), Agente em [`public/game/assets/overlay/`](public/game/assets/overlay), ícones em [`public/game/assets/images/`](public/game/assets/images) |
| Animação e controle do(s) personagem(ns) ([game#19](https://github.com/tes786205/game/issues/19)) | Ações por cenário em [`public/game/game/actions.js`](public/game/game/actions.js); interações em [`public/game/game/outside.js`](public/game/game/outside.js) e [`public/game/game/house.js`](public/game/game/house.js); mecânica da venda em [`public/game/game/blindfold.js`](public/game/game/blindfold.js); diálogos animados em [`public/game/ui/dialogue.js`](public/game/ui/dialogue.js) |
| Colisão, câmeras e sons ([game#20](https://github.com/tes786205/game/issues/20)) | Transições/"câmera" (zoom em quadro, cofre, máquina, efeito CRT) em [`public/game/ui/transitions.js`](public/game/ui/transitions.js) e [`public/game/game/scene-loader.js`](public/game/game/scene-loader.js); sons em [`public/game/core/audio.js`](public/game/core/audio.js) e [`public/game/assets/sfx/`](public/game/assets/sfx). Por ser *point-and-click*, não há colisão física: as áreas e ações liberadas por cenário fazem esse papel |
| Expansão 1 do jogo ([game#22](https://github.com/tes786205/game/issues/22), [game#23](https://github.com/tes786205/game/issues/23)): **Push/Notification** | [`public/game/ui/notifications.js`](public/game/ui/notifications.js) (Notification API; ativar em Pausar → Notificações) |



## Estrutura do código

```
app/                 Next.js: página que exibe o jogo (iframe)
docs/                Premissa e GDD
maps/                Artes originais dos mapas
public/game/
  index.html         Telas e painéis do jogo
  main.js            Ponto de entrada: liga eventos e módulos
  core/              Estado do jogo, áudio e utilitários
  data/              Cenários, diálogos (dialogues.json), livro, configuração da Feira
  game/              Regras: cenários, ações, venda, casa, portões, interrogatório, fluxo (início, game over, final)
  ui/                Interface: diálogo, HUD, inventário, leitores, cofre, objetivos, notificações, Feira
  css/               Estilos separados por parte da interface (cores em css/base.css)
  assets/            Imagens, itens e sons
```
