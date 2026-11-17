# Radar IA & Direito V1.3 — Produto com utilidade recorrente

## Problema constatado

Em 17/11/2026, sete fontes estavam monitoradas, mas somente uma notícia tinha sido publicada. Não havia motivo consistente para o advogado voltar apenas para ler notícias de IA.

## Nova proposta

**O que pode afetar minha atuação e onde confiro isso?**

- Selecionar temas: petições e responsabilidade; IA nos tribunais; dados de clientes; regulação.
- Ler quatro fichas iniciais com o fato, a situação, sua relevância e o que conferir.
- Guardar referências e reabrir sem cadastro; sinalizar atualização de fichas antes consultadas.
- Copiar um resumo com fontes oficiais ou salvar via impressão em PDF.
- Acompanhar automaticamente a situação do PL 2338/2023 na API da Câmara.

## Fontes das fichas

- STJ, decisão de 20/10/2026: https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2026/20102026-Novo-caso-de-prompt-injection-STJ-multa-advogados-em-R--20-mil-por-ato-contra-a-dignidade-da-Justica.aspx
- CNJ, Resolução 615/2025 alterada em 2026: https://atos.cnj.jus.br/atos/detalhar/6001
- ANPD, Guia de Segurança para Pequenos Agentes: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte
- Câmara, PL 2338/2023: https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487262

As datas originais permanecem visíveis. Referências antigas não devem ser divulgadas como notícias de hoje.

## Arquitetura e operação

- Supabase: impact_briefs (RLS público para publicadas; edição somente por editor/admin).
- Controle de temas, favoritos e versões lidas salvo somente no armazenamento local do navegador.
- Painel admin: ficha nova, rascunho, edição, conferência da fonte, publicação e retirada.
- GitHub Actions: consulta a API Dados Abertos da Câmara a cada ciclo e entrega resultado via OIDC.
- Edge Function: radar-legislative-status com assinatura GitHub verificada.
- Tabelas legislative_status e legislative_events para registrar situação e mudanças detectadas após o primeiro acesso ao monitor.
- O agendamento pode atrasar; a interface informa a última execução. Uma movimentação legislativa não é lei vigente.

## Validação

- npm test; npm run build; npm run test:ui.
- Testes de browser para persistência de temas, filtros, favoritos, resumo com fonte, monitor e layouts.
- Auditoria de Supabase sem alertas, consulta pública permitida, escrita anônima bloqueada.
- Fluxo OIDC do motor executado no GitHub Actions com sucesso.

## Limites

Não acompanha número de processo, prazo ou movimentação judicial individual. Não envia push ou e-mail. Não sincroniza preferências entre dispositivos. Apenas o PL 2338/2023 tem monitoramento legislativo especializado; os demais conteúdos ainda dependem de curadoria. Login e administração por usuário real, LGPD, PWA físico e autorização da comissão ainda não estão homologados.

## Métrica para decidir se vale continuar

Piloto com advogados: pelo menos 80% devem conseguir escolher um assunto, localizar uma ficha relevante e abrir sua fonte oficial sem ajuda. Medir utilidade percebida e retorno ao portal, não apenas visitas.
