# Corrida Insana LIVE — versão inicial

Jogo web experimental para lives. Comentários `carro` e `moto` adicionam participantes automaticamente.

## O que precisa
- Conta gratuita no GitHub
- Conta gratuita no Render
- Navegador do celular

## Publicar pelo celular
1. Crie uma conta ou entre em https://github.com
2. Crie um repositório novo chamado `corrida-insana-live`.
3. Envie os arquivos deste projeto mantendo a estrutura: `package.json`, `server.js`, pasta `public` e `public/index.html`.
4. Entre em https://render.com e crie uma conta.
5. No painel Render, escolha **New + → Web Service** e conecte o repositório GitHub.
6. Configure:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
7. Clique em Create Web Service e espere o deploy.
8. Abra o endereço `https://SEU-SERVICO.onrender.com`.
9. Digite `fruta_dramas` e toque em CONECTAR enquanto a conta estiver ao vivo.

## Segurança
Não coloque senha do TikTok, cookies ou códigos de login neste projeto. A conexão de leitura usa o nome público do perfil e depende de a LIVE estar pública.

## Limitações
- A integração usa uma biblioteca não oficial e pode parar se o TikTok mudar o protocolo.
- A instância gratuita do Render pode dormir após inatividade e não é indicada para produção.
- Esta versão é um protótipo: a corrida é local no servidor e os presentes apenas aparecem no feed; poderes, persistência, controle de moderação e proteção contra spam serão desenvolvidos depois.
