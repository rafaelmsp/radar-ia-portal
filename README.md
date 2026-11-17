# Radar IA & Direito — Portal/PWA

Portal React 19 e Supabase com notícias verificáveis, Área do Advogado, Informes, Curadoria e PWA.
**Projeto experimental independente** — uso oficial da marca OAB depende de autorização institucional.

## Executar localmente
- Node.js 22+
- \`npm ci\`
- \`npm run dev\`
- \`npm run build\` para validação.
- Configuração de conexão pública em \`.env.production\` (chave \`sb_publishable_...\` não é segredo).
- NUNCA colocar service_role, secret keys ou credenciais privadas no repositório público.

## Publicação
O workflow publica \`dist/\` por GitHub Pages. Selecionar **Settings > Pages > Build and deployment > GitHub Actions** no repositório, caso ainda não esteja configurado.

## Papéis e segurança
- Visitantes: apenas notícias e informes publicados.
- Usuário cadastrado: favoritos, preferências e sugestões.
- Editor/admin: revisão de artigos e publicação de informes.
- Papéis são definidos somente por \`auth.users.raw_app_meta_data.radar_role\`, que não é editável pelo usuário. Nunca em \`user_metadata\`.
- Para conceder perfil após o primeiro cadastro, administrador Supabase deve definir \`radar_role\` em app metadata usando ambiente administrativo autorizado e renovar a sessão.
- A autorização é aplicada por RLS no Supabase (não por ocultação de menus).
- E-mail por link exige configuração do serviço de autenticação para uso real.

## Limites de V1
Não há push, disparo de e-mail em massa, IA generativa, edição rica, detecção normativa ou boletins em PDF nesta versão.
O motor coleta notícias como rascunhos: a curadoria deve aprovar antes da publicação.
Instalação no iPhone continua sendo uma ação do usuário; há guia assistido.

## Privacidade
Não usar dados processuais ou dados sensíveis de clientes. Os únicos dados de perfil coletados são nome, e-mail, área e preferências, optativos. O operador deverá providenciar política de privacidade e canal de exclusão antes de lançamento institucional.
