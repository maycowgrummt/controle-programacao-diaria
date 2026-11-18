/* Início: carregado por último. Fica ouvindo o login e abre a tela certa. */
"use strict";

onAuthStateChanged(auth, async user=>{
  pararListeners();
  S.user = user; S.perfil = null;
  if (!user){ show("login"); $("#lgPass").value=""; checaSetup(); return; }
  if (S.criandoSetup) return;
  await carregarPerfil(user);
});
