/* Cadastro de usuários (somente administrador). */
"use strict";

/* ---------- Usuários (admin) ---------- */
let secApp = null;
$("#btnUsers").onclick = ()=>{
  abrirModal(`${cabecalho("users","Usuários")}
  <div class="bd">
    <form id="uForm" class="row" style="margin-bottom:18px">
      <div><label>Nome</label><input name="nome" required></div>
      <div><label>Usuário (login)</label><input name="usuario" required></div>
      <div><label>Senha inicial</label><input name="senha" type="text" minlength="6" required></div>
      <div><label>Setor</label><select name="setor">${Object.entries(SETORES).map(([k,l])=>`<option value="${k}" ${k==="operacao"?"selected":""}>${l}</option>`).join("")}</select></div>
      <div style="flex:0 0 auto"><button class="btn primary">${icone("user-plus")}Criar usuário</button></div>
    </form>
    <div style="overflow:auto"><table class="users"><thead><tr><th>Nome</th><th>Login</th><th>Setor</th><th>Ativo</th></tr></thead><tbody id="uList"><tr><td colspan="4">Carregando…</td></tr></tbody></table></div>
    <p style="font-size:12px;color:var(--texto-3)">Para trocar a senha de alguém: desative o usuário e crie um novo login, ou redefina no console do Firebase (Authentication).</p>
  </div>`);
  S.unsubUsers?.();
  S.unsubUsers = onSnapshot(collection(db,"usuarios"), snap=>{
    S.usuarios = snap.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    const el = $("#uList"); if (!el) return;
    el.innerHTML = S.usuarios.map(u=>`<tr><td><span class="avatar" style="background:${COR_SETOR[u.setor]||"#0072bc"}">${esc(iniciais(u.nome))}</span>${esc(u.nome)}</td><td>${esc(u.usuario)}</td>
      <td><select data-uset="${u.uid}" ${u.uid===S.perfil.uid?"disabled":""}>${Object.entries(SETORES).map(([k,l])=>`<option value="${k}" ${u.setor===k?"selected":""}>${l}</option>`).join("")}</select></td>
      <td><input type="checkbox" data-uat="${u.uid}" ${u.ativo?"checked":""} ${u.uid===S.perfil.uid?"disabled":""}></td></tr>`).join("");
    el.querySelectorAll("[data-uset]").forEach(s=>s.onchange=()=>updateDoc(doc(db,"usuarios",s.dataset.uset),{setor:s.value}).then(()=>toast("Setor alterado")).catch(e=>toast(authMsg(e),true)));
    el.querySelectorAll("[data-uat]").forEach(s=>s.onchange=()=>updateDoc(doc(db,"usuarios",s.dataset.uat),{ativo:s.checked}).then(()=>toast(s.checked?"Usuário ativado":"Usuário desativado")).catch(e=>toast(authMsg(e),true)));
  }, err=>toast(authMsg(err), true));
  $("#uForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const f = e.target.elements, usuario = slug(f.usuario.value);
    if (!usuario) return toast("Login inválido.", true);
    const btn = e.target.querySelector("button"); btn.disabled = true;
    try{
      secApp = secApp || initializeApp(firebaseConfig, "secundario");
      const secAuth = getAuth(secApp);
      const cred = await createUserWithEmailAndPassword(secAuth, toEmail(usuario), f.senha.value);
      await signOut(secAuth);
      await setDoc(doc(db,"usuarios",cred.user.uid), {nome:f.nome.value.trim(), usuario, setor:f.setor.value, ativo:true, criadoEm:serverTimestamp(), criadoPor:S.perfil.nome});
      e.target.reset(); toast(`Usuário "${usuario}" criado`);
    }catch(err){ toast(authMsg(err), true); }
    finally{ btn.disabled = false; }
  });
};
