// config geral: firebase, setores, etapas e campos de cada secao
"use strict";

// firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFPvJcJuZxSRDVJcNewO2V0i5fTg1hu6M",
  authDomain: "controle-programacao-diaria.firebaseapp.com",
  projectId: "controle-programacao-diaria",
  storageBucket: "controle-programacao-diaria.firebasestorage.app",
  messagingSenderId: "110335329934",
  appId: "1:110335329934:web:e9169a995128a021e52bdf"
};
// login vira email fake (firebase exige email)
const EMAIL_DOMAIN = "controle-programacao-diaria.firebaseapp.com";

// dominio
const SETORES = { admin:"Administrador", planejamento:"Planejamento", transporte:"Transporte", faturamento:"Faturamento", operacao:"Operação", consulta:"Consulta" };
const COR_SETOR = { admin:"#4527a0", planejamento:"#15803d", transporte:"#7c3aed", faturamento:"#0072bc", operacao:"#ea580c", consulta:"#475569" };
const ETAPAS = [
  ["planejada","Planejada"],["patio","Veículo chegou"],["aguardando_veiculo","Aguardando veículo"],
  ["na_doca","Na doca"],["carregando","Carregando"],["aguardando_fat","Carregado · aguard. faturamento"],
  ["faturando","Faturando"],["concluida","Concluída"]
];
const ETAPA_LBL = Object.fromEntries(ETAPAS);
const STATUS_OP = [["","—"],["aguardando_veiculo","Aguardando veículo"],["na_doca","Na doca"],["carregando","Carregando veículo"],["finalizado","Finalizado"]];
const STATUS_LBL = Object.fromEntries(STATUS_OP);
const CATEGORIAS = [["programada","Programada (WMS)"],["extra","Carga extra"],["frigorifico","Frigorífico"]];
const CAT_LBL = Object.fromEntries(CATEGORIAS);
const catOf = c => c.categoria || "programada";
const SN = [["","—"],["sim","Sim"],["nao","Não"]];

// cargas
const SECOES = [
  { id:"plan", cls:"plan", icon:"clipboard-list", titulo:"Planejamento", btn:"planejamento", del:true, roles:["admin","planejamento"], campos:[
    {k:"categoria",l:"Tipo de carga",t:"select",o:CATEGORIAS,def:"programada"},
    {k:"data",l:"Data da programação",t:"date"},
    {k:"doca",l:"Doca",t:"text",up:true},
    {k:"nome",l:"Nome da carga",t:"text",w:2},
    {k:"cifFob",l:"CIF/FOB",t:"select",o:[["CIF","CIF"],["FOB","FOB"]]},
    {k:"pedidos",l:"Qtd. pedidos",t:"int"},
    {k:"cubagem",l:"Cubagem (m³)",t:"num"},
    {k:"peso",l:"Peso (kg)",t:"num"},
    {k:"uf",l:"UF",t:"text",up:true},
    {k:"transportadora",l:"Transportadora / Cliente",t:"text",list:"dlTransp"},
    {k:"valor",l:"Valor (R$)",t:"num"},
    {k:"obsPlanejamento",l:"Observação do planejamento",t:"textarea",w:3},
  ]},
  { id:"transporte", cls:"transporte", icon:"truck", titulo:"Transporte · Coleta", btn:"transporte", roles:["admin","transporte"], campos:[
    {k:"transpColeta",l:"Transportadora que se apresentou",t:"text",list:"dlTransp",w:2},
    {k:"cubagemVeiculo",l:"Cubagem do veículo (m³)",t:"num"},
  ]},
  { id:"chegada", cls:"chegada", icon:"door-open", titulo:"Faturamento · Chegada do veículo", btn:"chegada", roles:["admin","faturamento"], campos:[
    {k:"chegada",l:"Hora de chegada",t:"time"},
    {k:"placa",l:"Placa",t:"text",up:true},
    {k:"motorista",l:"Motorista",t:"text"},
  ]},
  { id:"operacao", cls:"operacao", icon:"forklift", titulo:"Operação · Carregamento", btn:"operação", roles:["admin","operacao"], campos:[
    {k:"status",l:"Status",t:"select",o:STATUS_OP},
    {k:"inicioCarreg",l:"Início carregamento",t:"time"},
    {k:"fimCarreg",l:"Fim carregamento",t:"time"},
    {k:"paletizado",l:"Paletizado?",t:"select",o:SN},
    {k:"qtdPaletes",l:"Qtd. paletes",t:"int"},
    {k:"equipe",l:"Equipe responsável",t:"text",list:"dlEquipe"},
    {k:"sobrouEspaco",l:"Sobrou espaço?",t:"select",o:SN},
    {k:"espacoM3",l:"Espaço livre (m³ / posições)",t:"text"},
    {k:"obsOperacao",l:"Observação da operação",t:"textarea",w:3},
  ]},
  { id:"faturamento", cls:"faturamento", icon:"receipt-text", titulo:"Faturamento · Emissão", btn:"faturamento", roles:["admin","faturamento"], campos:[
    {k:"inicioFat",l:"Início faturamento",t:"time"},
    {k:"fimFat",l:"Término faturamento",t:"time"},
    {k:"responsavelFat",l:"Responsável",t:"text",list:"dlResp"},
    {k:"romaneio",l:"Romaneio",t:"text",w:3},
    {k:"obsFaturamento",l:"Observação do faturamento",t:"textarea",w:3},
  ]},
];
function calcEtapa(c){
  if (c.fimFat && c.romaneio) return "concluida";
  if (c.inicioFat) return "faturando";
  if (c.status === "finalizado") return "aguardando_fat";
  if (c.status) return c.status;
  if (c.chegada) return "patio";
  return "planejada";
}

// paletizadas
const SECOES_PAL = [
  { id:"pcad", cls:"plan", icon:"boxes", titulo:"Coleta paletizada · Cadastro", btn:"cadastro", del:true, roles:["admin","planejamento","faturamento"], campos:[
    {k:"data",l:"Data",t:"date"},
    {k:"transportadora",l:"Transportadora",t:"text",list:"dlTransp",w:2},
    {k:"obs",l:"Obs / Entrega (agendamento)",t:"text",w:3},
    {k:"notas",l:"Notas fiscais e clientes",t:"notas",w:3},
  ]},
  { id:"pchegada", cls:"chegada", icon:"door-open", titulo:"Faturamento · Chegada do veículo", btn:"chegada", roles:["admin","faturamento"], campos:[
    {k:"chegada",l:"Hora de chegada",t:"time"},
    {k:"placa",l:"Placa",t:"text",up:true},
    {k:"motorista",l:"Motorista",t:"text"},
  ]},
  { id:"pop", cls:"operacao", icon:"forklift", titulo:"Operação · Carregamento", btn:"operação", roles:["admin","operacao"], campos:[
    {k:"inicio",l:"Início",t:"time"},
    {k:"termino",l:"Término",t:"time"},
    {k:"paletes",l:"Paletes (qtd. ou m³)",t:"text"},
    {k:"equipe",l:"Equipe",t:"text",list:"dlEquipe"},
    {k:"obsOp",l:"Observação (ex.: 2º turno)",t:"text",w:2},
  ]},
];
function calcEtapaPal(p){
  if (p.termino) return "concluida";
  if (p.inicio) return "carregando";
  if (p.chegada) return "patio";
  return "aguardando_veiculo";
}

const TIPOS = {
  carga: { col:"cargas", secoes:SECOES, etapa:calcEtapa,
    podeExcluir: () => ["admin","planejamento"].includes(S.perfil.setor) },
  pal: { col:"paletizadas", secoes:SECOES_PAL, etapa:calcEtapaPal,
    podeExcluir: () => ["admin","planejamento","faturamento"].includes(S.perfil.setor) },
};
const CAMPO = Object.fromEntries([...SECOES_PAL, ...SECOES].flatMap(s=>s.campos.map(c=>[c.k,c])));
const etapaDe = (tipo, c) => c.etapa || TIPOS[tipo].etapa(c);
const etapaLbl = (tipo, e) => tipo==="pal" && e==="concluida" ? "Finalizada" : ETAPA_LBL[e];

function pendenteDe(setor, c){
  const e = etapaDe("carga", c);
  if (setor === "planejamento") return e === "planejada";
  if (setor === "transporte") return e !== "concluida" && (!c.transpColeta || !c.cubagemVeiculo);
  if (setor === "faturamento") return (e === "planejada" && !c.chegada) || ["aguardando_fat","faturando"].includes(e);
  if (setor === "operacao") return ["patio","aguardando_veiculo","na_doca","carregando"].includes(e);
  return e !== "concluida";
}
function pendenteDePal(setor, p){
  if (setor === "faturamento") return !p.chegada;
  if (setor === "operacao") return !p.termino;
  if (setor === "planejamento" || setor === "transporte") return false;
  return !p.termino;
}
