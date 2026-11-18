# Programação Diária | Darnel

Webapp (HTML + CSS + JavaScript puro, sem npm nem build) que substitui a planilha Excel compartilhada da programação diária de cargas. Cada carga passa pelos setores **Planejamento → Transporte → Faturamento (chegada) → Operação → Faturamento (emissão)**, e cada setor só edita os próprios campos.

## Sobre o dono do projeto
- Fala português (Brasil). Responda sempre em português.
- Não é programador. Explique em linguagem simples, diga em qual arquivo e em qual trecho cada mudança entra, e evite jargão sem explicar.
- Antes de mudanças grandes, descreva o plano em poucas linhas e espere o ok.

## Arquivos
- `index.html`: estrutura das telas (login, primeiro administrador, sem acesso, painel). No fim carrega o Firebase (bloco `<script type="module">`, que deixa as funções do Firebase, `auth` e `db` disponíveis para os outros arquivos) e os scripts de `js/`.
- `css/estilo.css`: todo o visual, padrão "Corporativo Darnel" (mesmo do projeto irmão `../CONTROLE-OCORREÊNCIAS`). Cores ficam em variáveis no `:root`; o tema escuro repete as variáveis em `@media (prefers-color-scheme: dark)` e em `:root[data-theme="dark"]` (mudar nos dois). No fim ficam os ajustes de tela: monitor grande (≥1900px), notebook / modo compacto (≤1600px de largura ou ≤860px de altura), ≤1400px, ≤1250px e celular (≤860px).
- `js/config.js`: **lugar para configurar o negócio**: `firebaseConfig`, setores (`SETORES`, `COR_SETOR`), etapas, status da operação, categorias de carga, e as seções da ficha (`SECOES` para cargas, `SECOES_PAL` para coletas paletizadas: quais campos, de qual setor). Também as regras que calculam a etapa (`calcEtapa`, `calcEtapaPal`) e o que é pendência de cada setor (`pendenteDe`).
- `js/utils.js`: ícones Lucide (`icone('nome')` + MutationObserver que desenha sozinho), tema claro/escuro (`localStorage` `programacao_tema`), datas, números pt-BR, cálculo de tempos, `toast`, `show`.
- `js/auth.js`: estado do sistema (`S`), permissões (`pode`, `isPlan`), login, criação do primeiro administrador, carregar perfil.
- `js/painel.js`: abre o sistema após o login (`iniciarApp`), ouvintes em tempo real do Firestore, navegação de datas, abas (Todas, Programadas, Extras, Frigoríficos, Em atraso, Paletizadas), filtros, indicadores (KPIs), tabelas, altura automática da tabela (`ajustarAltura`).
- `js/cronometro.js`: cronômetros **START / STOP** (sem pausa, por decisão do dono), configurados em `CRONOS`: `op` (Operação, campo `crono`, preenche início/fim do carregamento e status), `fat` (Faturamento · Emissão, campo `cronoFat`, preenche início/término do faturamento e o responsável) e `pal` (coletas paletizadas). Aparecem dentro da própria seção da ficha (`CRONO_DA_SECAO`) e numa coluna "Cronômetro" na tabela.
- `js/ficha.js`: painel lateral (ficha) da carga/coleta: uma seção por setor, botão "Agora" nos horários, salvar só o que mudou + histórico, excluir.
- `js/cadastro.js`: janelas (modais) e cadastro manual de carga extra/frigorífico e coleta paletizada.
- `js/importacao.js`: botão "Importar do WMS": lê a planilha do Korber One, acha o cabeçalho sozinho, mapeia colunas por sinônimos (`MAP_CAMPOS`), data da programação vem do começo do campo "Comentarios", prévia antes de gravar. Reimportar atualiza só os campos do WMS.
- `js/ferramentas.js`: Exportar Excel (aba atual) e "Limpar dia" (só admin, para testes: apaga cargas/coletas da data e o histórico delas).
- `js/manual.js`: **Manual do usuário** (mesmo formato do Controle de Ocorrências). Botão livro (`#btnManual`) no topo abre o manual (menu de seções à esquerda, busca, conteúdo rolando). O texto fica na lista `SECOES_MANUAL` (uma seção por item; `soAdmin: true` só aparece para admin). **Ao mudar uma regra ou função do sistema, atualizar o texto da seção correspondente.** Primeiro acesso no aparelho mostra a faixa `#faixaManual` ("Novo por aqui?"), uma vez só (`localStorage` `programacao_manual_visto`).
- `js/usuarios.js`: cadastro de usuários (só admin), usando uma segunda conexão do Firebase para não derrubar o login do admin.
- Aplicativo instalável (PWA), igual ao Controle de Ocorrências: `manifest.webmanifest` (nome, ícones, cores), `sw.js` (ajudante: **não** guarda o sistema em cache, sempre busca na internet; só mostra `offline.html` se cair a conexão; ao mudar o `sw.js`, aumentar a `VERSAO`), ícones `img/icone-*.png` e `img/apple-touch-icon.png`. `js/pwa.js`: botão "Instalar app" (`#btnInstalar`, aparece só quando o navegador permite instalar). Só funciona hospedado (GitHub Pages), não abrindo o arquivo direto.
- `js/app.js`: carregado por último; liga o ouvinte de login (`onAuthStateChanged`).
- `firestore.rules`: regras de segurança do Firestore (quem pode mudar qual campo). **A cada mudança, colar no Console do Firebase e publicar.** Ao criar um campo novo numa seção, incluir o nome dele na lista do setor (`camposPlan`, `camposTransp`, `camposFat`, `camposOp`, `palCad`, `palFat`, `palOp`).
- `img/`: logo Darnel e favicon.

Os scripts de `js/` são comuns (não módulos) e compartilham variáveis globais; **a ordem no `index.html` importa**. Funciona abrindo o `index.html` direto (duplo clique) e também hospedado online.

## Dados (Firebase, projeto `controle-programacao-diaria`, Firestore)
- `usuarios/{uid}`: `{nome, usuario, setor, ativo}`. Login é o usuário convertido em e-mail interno `usuario@controle-programacao-diaria.firebaseapp.com`.
- `cargas/{c_<nº carga>}`: campos de todos os setores + `etapa`, `concluida`, `categoria` (programada/extra/frigorifico), `origem` (korber/manual), `crono`, `atualizadoPor/Em`. Subcoleção `historico`.
- `paletizadas/{id}`: coleta paletizada (um veículo com várias `notas`). Subcoleção `historico`.
- `config/setup`: marca que o primeiro admin já foi criado.
- Setores: admin, planejamento, transporte, faturamento, operacao, consulta.

## Testes
Não há node/python no PC. Testar abrindo no Edge; para automatizar usa-se o Edge headless com DevTools via PowerShell.
