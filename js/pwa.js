// pwa: botao instalar + service worker
"use strict";

let pedidoInstalacao = null;

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
  e.preventDefault(); // usa nosso botao
  pedidoInstalacao = e; atualizarBotaoInstalar();
});
window.addEventListener("appinstalled", ()=>{ pedidoInstalacao = null; atualizarBotaoInstalar(); });

// sw so funciona em http/https
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
  navigator.serviceWorker.register("sw.js").catch(err=>console.warn("Ajudante do app não registrado:", err));
}
// limpa ?origem=app da url
if (new URLSearchParams(location.search).has("origem")) history.replaceState(null, "", location.pathname);

$("#btnInstalar").addEventListener("click", instalarApp);
atualizarBotaoInstalar();
