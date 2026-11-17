# Radar IA & Direito — Portal e PWA

## V1.3 — Meu Radar

O produto agora prioriza o acompanhamento de assuntos jurídicos: o advogado escolhe temas, recebe fichas verificadas com contexto e passos de conferência, salva leituras e gera um resumo com fontes. A primeira rotina de acompanhamento automático consulta a situação do PL 2338/2023 na API oficial da Câmara, via GitHub Actions e OIDC, registrando alterações no Supabase. Não há promessa de notificação push ou de acompanhamento processual.

Documento do produto e limites: docs/PRODUTO_COM_SENTIDO_V1_3.md

**Observatório jurídico experimental**, com fontes identificadas e ferramentas práticas para advogados com pouca familiaridade com IA.

**Acesse:** https://rafaelmsp.github.io/radar-ia-portal/

> O Radar ainda não é canal oficial da OAB. Qualquer publicação institucional, identidade visual ou associação à subseção exige autorização da coordenação.

## Por que existe?
Em vez de apenas exibir notícias, a experiência responde três perguntas:

1. **O que mudou?** — Publicações aprovadas pela curadoria, com fontes originais.
2. **Por que importa?** — Nota editorial quando revisada, transparência sobre datas e contexto.
3. **O que posso fazer agora?** — Guias e ferramentas educativas disponíveis, mesmo sem notícias novas.

## Funcionalidades implementadas
- Página inicial editorial responsiva, com destaque de notícia real e indicadores sem números fictícios.
- Atualizações pesquisáveis, filtro de categoria, leitura essencial/avançada e favoritos.
- **IA na Prática**: quatro guias interativos, checklist de conferência e gerador local de prompts.
- Área do usuário: login por e-mail, interesses, favoritos, sugestões.
- Informes da comissão, leitura de comunicados, público/usuários cadastrados.
- Painel editorial: aprovar/rejeitar (rejeição com justificativa), publicar informes, acompanhar coletores e auditoria.
- Manifesto PWA, navegação móvel dedicada e carregamento sob demanda das páginas mais pesadas.
- **Privacidade:** o gerador de prompts é local. O Service Worker não armazena respostas da API Supabase.

## Desenvolver
Requisitos: Node.js 22+ e npm.

    npm ci
    npm run dev
    npm test
    npm run build

Para testar a interface com Playwright Core e Google Chrome instalado, configure a variável RADAR_CHROME_PATH se o executável não estiver no caminho padrão do Windows:

    npm run test:ui

Os testes de interface iniciam uma prévia Vite temporária na porta 4174.

## Arquitetura
- React 19 + TypeScript + Vite + lucide-react.
- Supabase: conteúdo, perfis, favoritos, preferências, mensagens, curadoria e auditoria.
- GitHub Pages: hospedagem estática; Actions: publicação do portal.
- Motor separado em repositório privado: Python + fontes oficiais + Edge Function OIDC.
- O arquivo .env.production contém somente URL pública e chave publicável. Nunca adicionar service_role ou chaves secretas. O acesso depende de RLS e claims administrativas em app_metadata.

## Critérios de honestidade
- Notícias não são fabricadas; o feed exibe apenas o que foi aprovado no banco.
- Filtros sem conteúdo mostram estados vazios úteis, não estatísticas fictícias.
- Guias e prompts são auxílio educativo, não análise de caso ou validação automática.
- Cadastro e administração reais ainda necessitam de homologação com conta autorizada.
- Instalação em Android e iPhone reais ainda necessita de teste prático.
- Antes do lançamento institucional: política LGPD, exclusão de conta, aprovação de marca e piloto de usabilidade.

## Próximos itens
- Validar login real no Supabase Auth e redirecionamento.
- Configurar administrador autorizado e testar publicação por usuário real.
- Ampliar fontes e categorização por área, com curadoria humana.
- Testar PWA em aparelhos físicos e medir aceitação pelos usuários.

**Documento de UX:** docs/UX_PREMIUM_V1_2.md
