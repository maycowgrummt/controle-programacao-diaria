/* Aplicativo instalável (PWA): botão "Instalar app" no topo (Chrome/Edge) e o ajudante sw.js (tela sem conexão).
   Arquivos ligados: manifest.webmanifest, sw.js, offline.html, img/icone-*.png */
"use strict";

let pedidoInstalacao = null;   // guardado pelo navegador quando o app pode ser instalado

const rodandoComoApp = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function atualizarBotaoInstalar(){
  $("#btnInstalar")?.classList.toggle("hidden", rodandoComoApp() || !(pedidoInstalacao || ehIOS()));
}
async function instalarApp(){
  if (pedidoInstalacao){
    pedidoInstalacao.prompt();
    const escolha = await pedidoInstalacao.userChoice;
    pedidoInstalacao = null; atualizarBotaoInstalar();
    if (escolha.outcome === "accepted") toast("Aplicativo instalado! O ícone está na área de trabalho e no menu Iniciar.");
  } else if (ehIOS()){
    toast("No iPhone/iPad: toque em Compartilhar e depois em \"Adicionar à Tela de Início\".");
  }
}

window.addEventListener("beforeinstallprompt", e=>{
  e.preventDefault();          // em vez da barrinha do navegador, usamos o nosso botão
  pedidoInstalacao = e; atualizarBotaoInstalar();
});
window.addEventListener("appinstalled", ()=>{ pedidoInstalacao = null; atualizarBotaoInstalar(); });

// o ajudante só funciona com o sistema hospedado (http/https), não abrindo o arquivo direto
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
  navigator.serviceWorker.register("sw.js").catch(err=>console.warn("Ajudante do app não registrado:", err));
}
// aberto pelo ícone do app: tira o "?origem=app" do endereço
if (new URLSearchParams(location.search).has("origem")) history.replaceState(null, "", location.pathname);

$("#btnInstalar").addEventListener("click", instalarApp);
atualizarBotaoInstalar();
