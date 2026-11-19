// funcoes de apoio
"use strict";

// icones e tema
const icone = (nome, extra="") => `<i data-lucide="${nome}" ${extra}></i>`;
(function iniciarIcones(){
  if (!window.lucide) return; // offline
  let agendado = false;
  const desenhar = () => { agendado = false; if (document.querySelector("i[data-lucide]")) lucide.createIcons(); };
  new MutationObserver(()=>{ if (!agendado){ agendado = true; requestAnimationFrame(desenhar); } })
    .observe(document.body, {childList:true, subtree:true});
  desenhar();
})();
function temaAtual(){
  let t = null; try { t = localStorage.getItem("programacao_tema"); } catch {}
  if (t==="claro" || t==="escuro") return t;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}
function aplicarTema(tema, guardar=true){
  const escuro = tema==="escuro";
  document.documentElement.setAttribute("data-theme", escuro ? "dark" : "light");
  if (guardar) try { localStorage.setItem("programacao_tema", tema); } catch {}
  document.querySelectorAll('[data-acao="tema"]').forEach(b=>{
    b.classList.toggle("ligado", escuro); b.setAttribute("aria-checked", String(escuro));
    b.title = escuro ? "Modo escuro ligado. Clique para o modo claro." : "Modo claro ligado. Clique para o modo escuro.";
  });
}
document.querySelectorAll('[data-acao="tema"]').forEach(b=>{
  b.innerHTML = `${icone("sun",'class="tema-sol"')}${icone("moon",'class="tema-lua"')}<span class="tema-bola"></span>`;
  b.addEventListener("click", ()=>aplicarTema(temaAtual()==="escuro" ? "claro" : "escuro"));
});
aplicarTema(temaAtual(), false);


// util
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const pad = n => String(n).padStart(2,"0");
const hojeISO = () => { const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const agoraHM = () => { const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const addDias = (iso,n) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const brData = iso => iso ? iso.split("-").reverse().join("/") : "";
const fmtN = (n,d=2) => (n==null||n==="") ? "" : Number(n).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtI = n => (n==null||n==="") ? "" : Number(n).toLocaleString("pt-BR");
function num(v){
  if (v==null || v==="") return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim().replace(/\s/g,"").replace(/^R\$/,"");
  if (s.includes(",")) s = s.replace(/\./g,"").replace(",",".");
  const n = parseFloat(s); return isNaN(n) ? 0 : n;
}
function norm(s){ return String(s??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }
function mins(a,b){
  if(!a||!b) return null;
  const [ah,am]=a.split(":").map(Number),[bh,bm]=b.split(":").map(Number);
  let d=(bh*60+bm)-(ah*60+am); if(d<0) d+=1440; return d;
}
const fmtDur = m => m==null ? "" : `${Math.floor(m/60)}h${pad(m%60)}`;
const ocupacao = c => (c.cubagemVeiculo>0 && c.cubagem>0) ? c.cubagem / c.cubagemVeiculo * 100 : null;
const fmtOcup = p => p==null ? "" : `<span class="${p>=85?"ocup-alta":p>=60?"ocup-media":"ocup-baixa"}">${fmtN(p,0)}%</span>`;
const carregEfetivo = (c, ini, fim) => c.crono?.estado==="parado" ? Math.round((c.crono.acum||0)/60000) : mins(c[ini], c[fim]);
function tempos(c){
  return {
    espera: mins(c.chegada, c.inicioCarreg),
    carreg: carregEfetivo(c, "inicioCarreg", "fimCarreg"),
    fat: mins(c.inicioFat, c.fimFat),
    total: mins(c.chegada, c.fimFat || c.fimCarreg),
  };
}
function temposPal(p){
  return { espera: mins(p.chegada, p.inicio), carreg: carregEfetivo(p, "inicio", "termino"), total: mins(p.chegada, p.termino) };
}


const fmtNotas = n => (n||[]).map(x=>x.nota+(x.cliente?` (${x.cliente})`:"")).join(", ");
const iniciais = nome => { const p = String(nome||"?").trim().split(/\s+/); return ((p[0]||"?")[0] + (p.length>1 ? p.at(-1)[0] : "")).toUpperCase(); };
const toEmail = u => u.includes("@") ? u.trim().toLowerCase() : `${slug(u)}@${EMAIL_DOMAIN}`;
const slug = u => String(u).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9._-]/g,"");
function authMsg(e){
  const c = e?.code || "";
  if (c.includes("invalid-credential")||c.includes("wrong-password")||c.includes("user-not-found")||c.includes("invalid-email")) return "Usuário ou senha inválidos.";
  if (c.includes("email-already-in-use")) return "Esse usuário já existe.";
  if (c.includes("weak-password")) return "Senha fraca: use pelo menos 6 caracteres.";
  if (c.includes("too-many-requests")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (c.includes("network")) return "Sem conexão com a internet.";
  if (c.includes("permission-denied")) return "Sem permissão para esta ação (confira se as regras do Firestore estão atualizadas).";
  return e?.message || "Erro inesperado.";
}
function toast(msg, err=false){
  const el = document.createElement("div"); if (err) el.className="err";
  el.innerHTML = `${icone(err?"circle-alert":"circle-check")}<span>${esc(msg)}</span>`;
  $("#toast").appendChild(el); setTimeout(()=>el.remove(), err?6000:3000);
}
function show(id){ for (const s of ["boot","login","noaccess","app"]) $("#"+s).classList.toggle("hidden", s!==id); }

