/* =========================================================
   MANUAL DO USUÁRIO
   Botão "livro" no topo abre o manual (janela com menu de seções, busca e conteúdo).
   O texto de cada seção fica na lista SECOES_MANUAL abaixo: para mudar uma
   explicação, é só editar o texto da seção. AO MUDAR UMA REGRA OU FUNÇÃO DO
   SISTEMA, ATUALIZAR AQUI TAMBÉM.
   Primeiro acesso no aparelho: faixa "Novo por aqui?" no painel (uma vez só).
   ========================================================= */
"use strict";

const CHAVE_MANUAL_VISTO = "programacao_manual_visto";

// Pequenos ajudantes para escrever o texto do manual
const mIc = nome => icone(nome, 'class="man-ic"');
const mDica = txt => `<p class="man-dica">${icone("lightbulb")}<span>${txt}</span></p>`;
const mAtencao = txt => `<p class="man-dica man-atencao">${icone("triangle-alert")}<span>${txt}</span></p>`;
const mPassos = itens => `<ol class="man-passos">${itens.map(i=>`<li>${i}</li>`).join("")}</ol>`;
const mLista = itens => `<ul class="man-lista">${itens.map(i=>`<li>${i}</li>`).join("")}</ul>`;
const mTabela = (cab, linhas) => `<table class="man-tabela"><thead><tr>${cab.map(c=>`<th>${c}</th>`).join("")}</tr></thead>
  <tbody>${linhas.map(l=>`<tr>${l.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const mEt = e => `<span class="et et-${e}">${ETAPA_LBL[e]}</span>`;
const mSetor = (cor, nome) => `<span class="man-setor" style="--c:${cor}">${nome}</span>`;

const SECOES_MANUAL = [
  { id:"inicio", titulo:"Primeiros passos", icone:"rocket", html:()=>`
    <p>O <strong>Controle de Programação Diária</strong> substitui a planilha da expedição. Cada carga passa pelos setores
    <strong>Planejamento → Transporte → Faturamento → Operação → Faturamento</strong>, e cada setor preenche só a sua parte.
    Tudo se atualiza sozinho, na hora, em todos os computadores.</p>
    <h4>Entrar no sistema</h4>
    ${mPassos([
      "O administrador cadastra você e passa o seu <strong>usuário</strong> (ex.: <em>juliana</em>) e a <strong>senha</strong>.",
      "Digite usuário e senha na tela de entrada e clique em <strong>Entrar</strong>.",
      "O seu <strong>setor</strong> define o que você pode editar. Ele aparece no topo, embaixo do seu nome."
    ])}
    <h4>O topo da tela</h4>
    ${mTabela(["Item","Para que serve"],[
      [`${mIc("chevron-left")} data ${mIc("chevron-right")}`, "Escolhe o dia da programação. As setas vão para o dia anterior e o próximo."],
      [`${mIc("calendar-check")} Hoje`, "Volta para o dia de hoje."],
      [`${mIc("download")} Instalar app`, "Instala o sistema como aplicativo no computador (aparece só quando dá para instalar)."],
      [`${mIc("book-open")} Manual`, "Abre este manual."],
      [`${mIc("sun")} / ${mIc("moon")}`, "Modo claro ou escuro."],
      [`${mIc("log-out")}`, "Sair do sistema."],
    ])}
    <h4>Instalar como aplicativo</h4>
    <p>No Edge ou Chrome, abra o endereço do sistema e clique em <strong>${mIc("download")} Instalar app</strong> no topo.
    Ele ganha um ícone na área de trabalho e no menu Iniciar e abre em janela própria. O aplicativo sempre abre a versão mais nova.</p>
    ${mDica("Se o botão não aparecer, use o menu do navegador: no Edge, <strong>⋯ → Aplicativos → Instalar este site como aplicativo</strong>.")}`
  },
  { id:"painel", titulo:"O painel", icone:"layout-dashboard", html:()=>`
    <h4>Números do topo</h4>
    ${mTabela(["Indicador","O que mostra"],[
      ["Total peso · Cubagem · Pedidos","Somas das cargas do dia escolhido."],
      ["Cargas","Quantas cargas estão programadas no dia."],
      ["Paletizados","Cargas marcadas como paletizadas pela Operação."],
      ["Carregadas","Cargas que já terminaram o carregamento."],
      ["Concluídas","Cargas com faturamento terminado e romaneio preenchido (com a barra de progresso do dia)."],
      ["Coletas","Coletas paletizadas do dia e quantas já foram finalizadas."],
      ["Em atraso","Cargas de dias anteriores que ainda não foram concluídas. Fica vermelho quando tem alguma."],
    ])}
    <h4>Abas</h4>
    ${mTabela(["Aba","O que tem"],[
      [`${mIc("layout-list")} Todas`, "Todas as cargas do dia."],
      [`${mIc("calendar-check")} Programadas`, "Cargas importadas do WMS."],
      [`${mIc("zap")} Cargas extras`, "Cargas lançadas à mão, fora da programação."],
      [`${mIc("snowflake")} Frigoríficos`, "Cargas de frigorífico."],
      [`${mIc("alarm-clock")} Em atraso`, "Cargas de dias anteriores ainda não concluídas."],
      [`${mIc("boxes")} Paletizadas`, "Coletas paletizadas (veja a seção própria)."],
    ])}
    <h4>A tabela</h4>
    ${mLista([
      "As colunas são separadas por setor, cada um com a sua cor: <strong>Planejamento</strong>, <strong>Transporte</strong>, <strong>Faturamento · Chegada</strong>, <strong>Operação</strong> e <strong>Faturamento</strong>.",
      "A primeira coluna mostra a <strong>etapa</strong> em que a carga está, e a barrinha colorida à esquerda acompanha essa cor.",
      "<strong>Clique numa linha</strong> para abrir a ficha da carga.",
      "<strong>Clique no título de uma coluna</strong> para ordenar por ela (clique de novo para inverter).",
      "No pé da tabela ficam os totais de cargas, pedidos, cubagem e peso.",
    ])}
    <h4>Etapas da carga</h4>
    <div class="man-fluxo">${["planejada","patio","na_doca","carregando","aguardando_fat","faturando","concluida"].map(mEt).join(mIc("arrow-right"))}</div>
    <p>A etapa muda <strong>sozinha</strong> conforme os setores preenchem: chegou o veículo → "Veículo chegou"; Operação pôs um status → "Na doca", "Carregando" ou "Aguardando veículo";
    fim do carregamento → "Carregado · aguardando faturamento"; início do faturamento → "Faturando"; término do faturamento <strong>e</strong> romaneio → "Concluída".</p>
    <h4>Filtros</h4>
    ${mLista([
      "<strong>Busca:</strong> carga, nome, doca, placa, romaneio, transportadora, equipe, motorista ou cidade.",
      "<strong>Etapa:</strong> mostra só as cargas de uma etapa.",
      "<strong>Minhas pendências:</strong> só o que está esperando o <strong>seu setor</strong>. Já vem ligado para quem não é administrador.",
      "<strong>Incluir pendentes de outros dias:</strong> junta as cargas atrasadas de dias anteriores (aparecem com a data em amarelo ao lado do número).",
    ])}`
  },
  { id:"ficha", titulo:"A ficha da carga", icone:"panel-right-open", html:()=>`
    <p>Ao clicar numa carga, abre a <strong>ficha</strong> do lado direito. No topo ficam o número, o nome, a doca e a etapa, as etapas já passadas e um resumo dos tempos:</p>
    ${mTabela(["Tempo","Como é calculado"],[
      ["Espera p/ carregar","Da chegada do veículo até o início do carregamento."],
      ["Carregamento","Do início ao fim do carregamento."],
      ["Faturamento","Do início ao término do faturamento."],
      ["Tempo total","Da chegada do veículo até o término do faturamento."],
      ["Ocupação do veículo","Cubagem da carga ÷ cubagem do veículo. Verde a partir de 85%, amarelo a partir de 60%, vermelho abaixo disso."],
    ])}
    <h4>Seções por setor</h4>
    ${mLista([
      "Cada setor tem a sua seção. Você só consegue editar a do <strong>seu setor</strong>; as outras aparecem com o cadeado " + mIc("lock") + " <em>somente leitura</em>.",
      `Nos campos de horário, o botão <strong>${mIc("clock")} Agora</strong> preenche com a hora atual.`,
      "Depois de preencher, clique em <strong>Salvar</strong> da seção. O botão pisca enquanto houver algo não salvo.",
      "O sistema grava <strong>só o que mudou</strong>, com o seu nome.",
    ])}
    <h4>Histórico de alterações</h4>
    <p>No fim da ficha fica o histórico: <strong>quem</strong> mudou, <strong>o quê</strong> e <strong>quando</strong>. Cada salvamento e cada START/STOP de cronômetro fica registrado.</p>
    ${mDica("Feche a ficha com o X, clicando fora dela ou com a tecla <strong>Esc</strong>.")}`
  },
  { id:"planejamento", titulo:"Planejamento", icone:"clipboard-list", html:()=>`
    <h4>Importar do WMS (Korber One)</h4>
    ${mPassos([
      "No Korber, exporte as cargas para Excel.",
      `No sistema, clique em <strong>${mIc("file-up")} Importar do WMS</strong> e arraste o arquivo (ou clique para escolher).`,
      "O sistema acha as colunas sozinho e mostra uma <strong>prévia</strong>: cada carga aparece como <strong>Nova</strong> ou <strong>Atualizar</strong> (se já existe).",
      "Confira a <strong>data da programação</strong> (por padrão vem do começo do comentário, ex.: 17/11/26) e o <strong>Importar como</strong> (Programada, Extra ou Frigorífico).",
      "Ajuste o <strong>CIF/FOB</strong> de cada carga se precisar e desmarque as que não quiser importar.",
      `Clique em <strong>${mIc("download")} Importar</strong>.`,
    ])}
    ${mDica("Pode importar de novo o mesmo arquivo ao longo do dia: as cargas que já existem só têm os dados do WMS atualizados (peso, cubagem, pedidos, doca, nome…). O que os outros setores preencheram não é apagado.")}
    ${mDica("Se uma coluna não for reconhecida, abra <strong>Ajustar colunas do arquivo</strong> na prévia e escolha a coluna certa. O sistema lembra da escolha nas próximas vezes.")}
    <h4>Carga extra ou frigorífico (à mão)</h4>
    <p>Clique em <strong>${mIc("plus")} Nova carga</strong> (na aba Extras ou Frigoríficos o botão já vem com o tipo certo), preencha e salve.</p>
    <h4>Mudar uma carga de dia</h4>
    <p>Na ficha, seção <strong>Planejamento</strong>, troque a <strong>Data da programação</strong> e salve. A carga vai para o outro dia.</p>
    <h4>Excluir uma carga</h4>
    <p>Na ficha, seção <strong>Planejamento</strong>, botão <strong>${mIc("trash-2")} Excluir</strong>. Pede confirmação e não tem como desfazer.</p>`
  },
  { id:"transporte", titulo:"Transporte", icone:"truck", html:()=>`
    <p>Na ficha da carga, seção <strong>Transporte · Coleta</strong>:</p>
    ${mLista([
      "<strong>Transportadora que se apresentou:</strong> quem realmente veio buscar (o sistema sugere nomes já usados).",
      "<strong>Cubagem do veículo (m³):</strong> capacidade do veículo que chegou.",
    ])}
    <p>Com a cubagem do veículo preenchida, o sistema calcula a <strong>ocupação</strong> (cubagem da carga ÷ cubagem do veículo), que aparece na tabela e na ficha.</p>
    ${mDica("Com <strong>Minhas pendências</strong> ligado, aparecem só as cargas sem transportadora ou sem cubagem do veículo.")}`
  },
  { id:"faturamento", titulo:"Faturamento", icone:"receipt-text", html:()=>`
    <p>O Faturamento aparece em <strong>dois momentos</strong> da carga.</p>
    <h4>1. Chegada do veículo</h4>
    <p>Seção <strong>Faturamento · Chegada do veículo</strong>: hora de chegada (use o botão <strong>Agora</strong>), <strong>placa</strong> e <strong>motorista</strong>. A carga passa para "Veículo chegou".</p>
    <h4>2. Emissão</h4>
    ${mPassos([
      `Quando começar a faturar, clique em <strong>${mIc("play")} START</strong> no cronômetro da seção <strong>Faturamento · Emissão</strong>. O <strong>Início faturamento</strong> é preenchido sozinho, e o <strong>Responsável</strong> também, se estiver vazio.`,
      `Ao terminar, clique em <strong>${mIc("square")} STOP</strong> e confirme. O <strong>Término faturamento</strong> é preenchido.`,
      "Preencha o <strong>Romaneio</strong> e, se precisar, a <strong>Observação do faturamento</strong>, e clique em <strong>Salvar faturamento</strong>.",
    ])}
    ${mAtencao("A carga só fica <strong>Concluída</strong> quando tem o <strong>término do faturamento</strong> e o <strong>romaneio</strong>.")}`
  },
  { id:"operacao", titulo:"Operação", icone:"forklift", html:()=>`
    ${mPassos([
      `Quando o carregamento começar, clique em <strong>${mIc("play")} START</strong> no cronômetro da seção <strong>Operação · Carregamento</strong> (ou direto na coluna Cronômetro da tabela). O <strong>Início carregamento</strong> é preenchido e o status vira <strong>Carregando veículo</strong>.`,
      `Ao terminar, clique em <strong>${mIc("square")} STOP</strong> e confirme. O <strong>Fim carregamento</strong> é preenchido e o status vira <strong>Finalizado</strong>.`,
      "Complete <strong>Paletizado?</strong>, <strong>Qtd. paletes</strong>, <strong>Equipe responsável</strong>, <strong>Sobrou espaço?</strong>, <strong>Espaço livre</strong> e a observação, e clique em <strong>Salvar operação</strong>.",
    ])}
    <h4>Status</h4>
    ${mTabela(["Status","Quando usar"],[
      ["Aguardando veículo","A carga está separada, mas o veículo não chegou."],
      ["Na doca","O veículo está na doca, mas o carregamento ainda não começou."],
      ["Carregando veículo","Carregamento em andamento (o START já coloca)."],
      ["Finalizado","Carregamento terminado (o STOP já coloca)."],
    ])}`
  },
  { id:"cronometros", titulo:"Cronômetros (START / STOP)", icone:"timer", html:()=>`
    <p>Existem dois cronômetros na carga: o do <strong>carregamento</strong> (Operação) e o da <strong>emissão</strong> (Faturamento). As coletas paletizadas também têm o do carregamento.</p>
    ${mTabela(["Botão","O que faz"],[
      [`<span class="man-btn ok">${mIc("play")} START</span>`, "Começa a contar e preenche o horário de início. Fica gravado na hora, sem precisar clicar em Salvar."],
      [`<span class="man-btn stop">${mIc("square")} STOP</span>`, "Pede confirmação, para de contar e preenche o horário de fim."],
    ])}
    ${mLista([
      "O cronômetro é o <strong>mesmo em todos os computadores</strong>: quem der START num PC, os outros veem o tempo correndo.",
      "Ele <strong>continua contando</strong> mesmo se a página for fechada.",
      "Não existe pausa: o tempo é do START até o STOP.",
      "Os botões aparecem só para o setor responsável (e o administrador). Os outros setores só veem o tempo.",
    ])}
    ${mDica("Esqueceu de clicar? Preencha o início e o fim à mão nos campos de horário e salve. Nesse caso o cronômetro mostra <em>Horários lançados manualmente</em>.")}`
  },
  { id:"paletizadas", titulo:"Coletas paletizadas", icone:"boxes", html:()=>`
    <p>Na aba <strong>${mIc("boxes")} Paletizadas</strong>, cada linha é uma <strong>coleta</strong>: um veículo que leva uma ou mais notas fiscais.</p>
    ${mPassos([
      `<strong>Planejamento ou Faturamento</strong> clica em <strong>${mIc("plus")} Nova coleta paletizada</strong>, informa a transportadora, a observação/agendamento e as <strong>notas fiscais com o cliente</strong> (botão "Adicionar nota" para cada uma).`,
      "<strong>Faturamento</strong> registra a chegada: hora, placa e motorista.",
      "<strong>Operação</strong> usa o cronômetro START/STOP (ou preenche início e término), informa paletes (quantidade ou m³), equipe e observação (ex.: 2º turno).",
    ])}
    ${mTabela(["Etapa","Quando"],[
      ["Aguardando veículo","Coleta cadastrada, veículo ainda não chegou."],
      ["Veículo chegou","Chegada registrada."],
      ["Carregando","Carregamento iniciado."],
      ["Finalizada","Carregamento terminado."],
    ])}`
  },
  { id:"atraso", titulo:"Cargas em atraso", icone:"alarm-clock", html:()=>`
    <p>Uma carga fica <strong>em atraso</strong> quando é de um dia anterior e ainda não foi concluída. Ela <strong>não se perde</strong>:</p>
    ${mLista([
      "Aparece na aba <strong>Em atraso</strong> (com o número em vermelho) e no indicador <strong>Em atraso</strong>.",
      "Com <strong>Incluir pendentes de outros dias</strong> ligado, aparece também na aba Todas, com a data original em amarelo.",
      "Para resolver, é só continuar preenchendo normalmente. Se ela vai sair em outro dia, o Planejamento pode trocar a <strong>Data da programação</strong>.",
    ])}`
  },
  { id:"excel", titulo:"Exportar para Excel", icone:"file-spreadsheet", html:()=>`
    <p>Clique em <strong>${mIc("file-spreadsheet")} Exportar Excel</strong> na barra de ferramentas. Baixa uma planilha com as cargas <strong>da aba aberta</strong>
    (respeitando a data e os filtros), com todos os campos dos setores e os tempos calculados (espera, carregamento, faturamento e tempo total).</p>
    ${mDica("Em telas menores o botão mostra só o ícone " + mIc("file-spreadsheet") + ". Passe o mouse para ver o nome.")}`
  },
  { id:"permissoes", titulo:"Quem pode fazer o quê", icone:"shield-check", html:()=>
    mTabela(["Setor","Pode"],[
      [mSetor("#15803d","Planejamento"), "Importar do WMS, criar carga extra/frigorífico, editar a seção Planejamento, mudar de dia, excluir carga, criar coleta paletizada."],
      [mSetor("#7c3aed","Transporte"), "Transportadora que se apresentou e cubagem do veículo."],
      [mSetor("#0072bc","Faturamento"), "Chegada do veículo, emissão (cronômetro, responsável, romaneio, observação), criar coleta paletizada e registrar a chegada dela."],
      [mSetor("#ea580c","Operação"), "Status, cronômetro do carregamento, paletes, equipe, sobra de espaço e observação; carregamento das coletas paletizadas."],
      [mSetor("#475569","Consulta"), "Só visualiza tudo, sem editar."],
      [mSetor("#4527a0","Administrador"), "Tudo, além de cadastrar usuários e limpar um dia."],
    ]) + mDica("As permissões ficam no servidor: mesmo que alguém tente, o sistema não aceita a alteração de um campo de outro setor.")
  },
  { id:"duvidas", titulo:"Dúvidas comuns", icone:"circle-help", html:()=>{
    const p = (perg, resp) => `<details class="man-faq"><summary>${perg}</summary><div>${resp}</div></details>`;
    return [
      p("Não acho uma carga.", "Confira a <strong>data</strong> no topo, a <strong>aba</strong> e se não há filtro ligado (busca, etapa, <em>Minhas pendências</em>). Se ela é de outro dia e não foi concluída, está na aba <strong>Em atraso</strong>."),
      p("Os campos estão com cadeado.", "Essa seção é de outro setor. Você só edita a seção do seu setor."),
      p("Cliquei em salvar e apareceu \"Nada para salvar\".", "Nenhum campo foi alterado desde a última vez que foi salvo."),
      p("Apareceu \"Sem permissão para esta ação\".", "Você tentou alterar algo que não é do seu setor, ou o seu usuário foi desativado. Se tiver certeza de que deveria conseguir, fale com o administrador."),
      p("Cliquei em STOP sem querer.", "Peça para o setor corrigir o horário de fim no campo da seção e salvar. O histórico mostra o que aconteceu."),
      p("A carga não fica Concluída.", "Precisa do <strong>Término faturamento</strong> e do <strong>Romaneio</strong> preenchidos e salvos."),
      p("O sistema não mostra as mudanças novas.", "Aperte <strong>Ctrl+Shift+R</strong> para recarregar. No aplicativo instalado, feche e abra de novo."),
      p("Esqueci a senha.", "Fale com o administrador."),
    ].join("");
  }},
  { id:"admin", titulo:"Só para o administrador", icone:"user-cog", soAdmin:true, html:()=>`
    <h4>Usuários (botão ${mIc("users")} no topo)</h4>
    ${mLista([
      "<strong>Criar:</strong> nome, usuário (login), senha inicial (mínimo 6 caracteres) e setor. Passe o usuário e a senha para a pessoa.",
      "<strong>Mudar de setor:</strong> escolha o novo setor na lista. Vale na hora.",
      "<strong>Desativar:</strong> desmarque <em>Ativo</em>. A pessoa perde o acesso na hora; o histórico dela continua.",
      "<strong>Trocar a senha de alguém:</strong> pelo Console do Firebase → Authentication.",
    ])}
    <h4>Limpar dia (testes)</h4>
    <p>Botão vermelho <strong>${mIc("trash-2")} Limpar dia</strong> na barra de ferramentas. Apaga as cargas e/ou coletas da <strong>data escolhida no topo</strong>, junto com o histórico delas.
    Escolha o que apagar (importadas do WMS, lançadas à mão, paletizadas) e digite <strong>EXCLUIR</strong> para confirmar.</p>
    ${mAtencao("Não tem como desfazer. Use só para testes, nunca com dados reais do dia a dia.")}
    <h4>Regras de segurança</h4>
    <p>Quando o arquivo <strong>firestore.rules</strong> mudar numa atualização, cole o conteúdo no Console do Firebase → Firestore → Regras → Publicar. Passo a passo no <strong>CONFIGURACAO-FIREBASE.md</strong>.</p>`
  },
];

/* ---------- Montagem da janela ---------- */
let secaoManualEscolhida = null;
const secoesManualVisiveis = () => SECOES_MANUAL.filter(s => !s.soAdmin || S.perfil?.setor === "admin");

function abrirManual(secao){
  const secoes = secoesManualVisiveis();
  abrirModal(`<div class="hd"><h2>${icone("book-open")}Manual do usuário</h2>
      <div class="man-busca">${icone("search")}<input id="manualBusca" type="search" placeholder="Buscar no manual... (ex.: cronômetro, romaneio)" aria-label="Buscar no manual"></div>
      <button class="btn-fechar" data-close title="Fechar">${icone("x")}</button></div>
    <div class="man-corpo">
      <nav class="man-menu" id="manualMenu">${secoes.map(s=>`<button type="button" class="man-menu-item" data-man-ir="${s.id}">${icone(s.icone)}<span>${esc(s.titulo)}</span></button>`).join("")}</nav>
      <div class="man-conteudo" id="manualConteudo">${secoes.map(s=>`
        <section class="man-secao" id="man-${s.id}" data-man-secao="${s.id}"><h3>${icone(s.icone)}${esc(s.titulo)}</h3>${s.html()}</section>`).join("")}
        <p class="man-vazio hidden" id="manualVazio">Nada encontrado. Tente outra palavra.</p></div>
    </div>`);
  $("#modalRoot .box").classList.add("manual");
  $("#manualMenu").addEventListener("click", e=>{ const b = e.target.closest("[data-man-ir]"); if (b) irParaSecaoManual(b.dataset.manIr); });
  $("#manualConteudo").addEventListener("scroll", ()=>requestAnimationFrame(marcarMenuManual), {passive:true});
  $("#manualBusca").addEventListener("input", filtrarManual);
  try { localStorage.setItem(CHAVE_MANUAL_VISTO, "sim"); } catch {}
  $("#faixaManual").classList.add("hidden"); ajustarAltura();
  irParaSecaoManual(secao || secoes[0].id, false);
}
function irParaSecaoManual(id, suave=true){
  const alvo = $("#man-"+id); if (!alvo) return;
  secaoManualEscolhida = id; acenderMenuManual(id);
  $("#manualConteudo").scrollTo({top: alvo.offsetTop, behavior: suave ? "smooth" : "instant"});
  clearTimeout(irParaSecaoManual.t);
  irParaSecaoManual.t = setTimeout(()=>{ secaoManualEscolhida = null; }, suave ? 700 : 50);
}
function acenderMenuManual(id){
  document.querySelectorAll(".man-menu-item").forEach(b=>{
    const ativo = b.dataset.manIr === id;
    b.classList.toggle("ativo", ativo);
    if (ativo) b.scrollIntoView({block:"nearest", inline:"nearest"});
  });
}
// acende no menu a seção que está no topo da área de leitura
function marcarMenuManual(){
  if (secaoManualEscolhida) return;
  const area = $("#manualConteudo"); if (!area) return;
  const vis = [...area.querySelectorAll(".man-secao:not(.hidden)")]; if (!vis.length) return;
  let atual = vis[0];
  if (area.scrollTop + area.clientHeight >= area.scrollHeight - 4) atual = vis.at(-1);
  else vis.forEach(s=>{ if (s.offsetTop <= area.scrollTop + 40) atual = s; });
  acenderMenuManual(atual.dataset.manSecao);
}
// busca: mostra só as seções que têm todas as palavras digitadas
function filtrarManual(){
  const termos = norm($("#manualBusca").value).split(/\s+/).filter(Boolean);
  let algum = false;
  document.querySelectorAll(".man-secao").forEach(s=>{
    const ok = !termos.length || termos.every(t=>norm(s.textContent).includes(t));
    s.classList.toggle("hidden", !ok);
    document.querySelector(`.man-menu-item[data-man-ir="${s.dataset.manSecao}"]`)?.classList.toggle("apagado", !ok);
    if (ok) algum = true;
  });
  $("#manualVazio").classList.toggle("hidden", algum);
  $("#manualConteudo").scrollTop = 0;
  marcarMenuManual();
}

$("#btnManual").addEventListener("click", ()=>abrirManual());
$("#btnAbrirManualFaixa").addEventListener("click", ()=>abrirManual());
$("#btnFecharFaixaManual").addEventListener("click", ()=>{
  try { localStorage.setItem(CHAVE_MANUAL_VISTO, "sim"); } catch {}
  $("#faixaManual").classList.add("hidden"); ajustarAltura();
});
// primeiro acesso neste aparelho: convite para ler o manual
(()=>{ let visto = false; try { visto = localStorage.getItem(CHAVE_MANUAL_VISTO) === "sim"; } catch { visto = true; }
  $("#faixaManual").classList.toggle("hidden", visto); })();
