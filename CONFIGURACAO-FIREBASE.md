# Configuração do Firebase: Programação Diária

Projeto no Firebase: **controle-programacao-diaria** (plano gratuito).

## 1. Publicar as regras de segurança (sempre que o arquivo `firestore.rules` mudar)
1. Abra o [Console do Firebase](https://console.firebase.google.com) e entre no projeto.
2. Menu da esquerda: **Firestore Database** (não é o "Realtime Database").
3. Aba **Regras**.
4. Apague tudo o que estiver lá, cole o conteúdo inteiro do arquivo `firestore.rules` e clique em **Publicar**.

Se aparecer "Sem permissão para esta ação" no sistema logo depois de uma atualização, quase sempre é porque as regras novas ainda não foram publicadas.

## 2. Primeiro acesso (só uma vez)
1. Abra o sistema. Na tela de login aparece **"Primeiro acesso: configurar administrador"**.
2. Preencha nome, usuário e senha. Esse usuário vira o administrador.
3. Depois disso o link some. Os demais usuários são criados pelo admin no botão **Usuários** (ícone de pessoas no topo).

## 3. Criar usuários
Botão **Usuários** (só admin) → nome, login, senha e setor:
- **Planejamento**: importa a planilha do WMS, cria cargas extras/frigoríficos e coletas paletizadas.
- **Transporte**: transportadora que se apresentou e cubagem do veículo.
- **Faturamento**: chegada do veículo (hora, placa, motorista) e emissão (início, término, responsável, romaneio).
- **Operação**: status, cronômetro do carregamento, paletes, equipe, sobra de espaço.
- **Consulta**: só visualiza.
- **Administrador**: tudo.

Para bloquear alguém, desmarque **Ativo** na lista de usuários (a pessoa perde o acesso na hora).

## 4. Publicar online (GitHub Pages)
1. Envie a pasta do projeto para um repositório no GitHub (o `.gitignore` já impede que planilhas `.xlsx` sejam enviadas).
2. No repositório: **Settings → Pages → Branch: main / (root) → Save**.
3. Em alguns minutos o endereço `https://<usuario>.github.io/<repositorio>/` fica no ar.
4. No Console do Firebase: **Authentication → Configurações → Domínios autorizados → Adicionar domínio** e informe `<usuario>.github.io`. Sem isso o login não funciona no endereço online.

A chave `apiKey` que aparece no `js/config.js` pode ficar pública: ela só identifica o projeto. Quem protege os dados são as regras do passo 1.
