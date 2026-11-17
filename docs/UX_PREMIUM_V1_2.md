# Radar IA & Direito — UX Premium V1.2

## Direção de produto
O Radar não deve funcionar apenas como um agregador de manchetes. Ele foi redesenhado para um profissional que conhece Direito, mas pode conhecer pouco de tecnologia.

**Promessa de valor:** menos ruído, mais clareza para advogar.

## Jornada de entrada
- **O que mudou?** Publicação aprovada com data, órgão e link para a fonte.
- **Por que me importa?** Nota editorial, quando existe e foi revisada, separada da notícia original.
- **O que posso fazer?** Três ações já funcionais: checklist, prompt seguro e guias práticos.
- **Quero acompanhar?** Usuário pode guardar a notícia na biblioteca e escolher interesses após cadastrar-se.

Nenhum número de tendência, impacto ou relevância deve ser anunciado como dado real sem suporte; o indicador de relevância é somente uma triagem automatizada e aparece com ressalva no modo avançado.

## Direção visual aplicada
- Editorial institucional, cores de tinta, verde-petróleo, menta e fundo claro.
- Título com serif itálico para hierarquia, texto de interface com alto contraste.
- Nenhuma ilustração genérica de robô como centro da primeira dobra.
- Hero com informação real e link original, no lugar de efeito decorativo.
- Cartões com informação e ação, não somente estatísticas sem contexto.
- Menus separados por objetivo. Navegação móvel inferior de cinco itens.
- Componentes responsivos entre 390, 430, 768 e 1440 px, sem rolagem horizontal nos testes.
- Código dividido em módulos sob demanda, sem dependência de serviço generativo pago.

## Ferramentas educativas funcionais
1. **Checklist de conferência de IA:** seis itens marcáveis e indicador de progresso.
2. **Gerador local de prompts:** resumo, revisão e estrutura de minuta, com avisos de sigilo e restrições para referências inventadas; permite copiar.
3. **Guias rápidos:** conferir jurisprudência, sigilo profissional, revisar minutas e distinguir propostas de normas vigentes.
4. **Minha área:** favoritos e seleção de interesses para acompanhamento; não representa ainda recomendação automatizada personalizada.

Guia e checklist não certificam validade jurídica de um documento. O prompt gera texto de instrução, não executa um modelo de IA.

## Administração preservada e reorganizada
- Curadoria com aprovação após confirmação de leitura da fonte ou rejeição justificada.
- Comunicados públicos ou voltados a cadastrados.
- Histórico editorial e monitoramento do motor para administradores.
- Permissões reais mantidas por RLS e claims administrativas no Supabase.
- Não há envio de e-mail em massa ou push nesta versão.

## Segurança e privacidade
- Chave publicável somente no frontend; nunca service role.
- Cache de runtime da API do Supabase foi removido do PWA.
- Limpeza de cache legado chamado radar-public-news no carregamento do aplicativo.
- Os prompts são montados localmente e não enviados a serviços externos.
- Permanece obrigatório implantar política de privacidade e atendimento ao titular antes do lançamento institucional.

## Validação técnica
- Build TypeScript/Vite aprovado.
- Quatro testes unitários dos guias e gerador de prompt aprovados.
- Smoke test Playwright Core aprovado: navegação móvel, guias, checklist, prompt e cópia, pesquisa, informes, login visual e desktop.
- Larguras inspecionadas: 390, 430, 768 e 1440 px; nenhum scroll horizontal detectado.
- Conta real, papel administrativo, instalação física PWA e aceitabilidade por advogados permanecem pendentes.

## Medição de valor (a coletar em piloto)
- Pelo menos 80% dos participantes encontrarem uma publicação e sua fonte sem ajuda.
- Avaliar compreensão do termo "por que vale minha atenção".
- Avaliar se os participantes completam checklist e montam prompt sem auxílio.
- Identificar quais guias são úteis na prática da advocacia.
- Não registrar comportamento individual sem transparência e base jurídica apropriada.

## Próximos passos de produto
- Cadastro e homologação das permissões com usuário real.
- Melhor categorização de conteúdos (legislação, jurisprudência, notícia), evitando categorias vazias.
- Boletins opt-in, alertas relevantes e leitura acessível offline, respeitando dados privados.
- Piloto institucional com aprovação de nomenclatura e marca pela coordenação.
