export type Guide={
  id:string;tag:string;title:string;minutes:number;description:string;
  icon:'shield'|'search'|'file'|'sparkles';
  steps:string[];outcome:string;
};
export const guides:Guide[]=[
  {id:'jurisprudencia',tag:'CONFERÊNCIA',title:'A IA citou uma decisão. Ela existe?',minutes:4,
   description:'Um roteiro simples para conferir referências antes de utilizá-las em uma peça.',
   icon:'search',
   steps:[
    'Anote o tribunal, número do processo, órgão julgador, relator e data informados pela ferramenta.',
    'Consulte diretamente a pesquisa de jurisprudência do tribunal competente. Não considere links criados pela própria IA como prova.',
    'Compare número, relatoria, data, ementa e, quando necessário, o inteiro teor da decisão.',
    'Confira se o trecho citado representa corretamente o contexto do julgamento e se há decisões posteriores relevantes.',
    'Se a referência não for localizada ou houver divergências, não a utilize como se estivesse confirmada.'
   ],
   outcome:'Resultado esperado: referência identificada e conferida na fonte oficial, ou retirada do trabalho.'},
  {id:'sigilo',tag:'PROTEÇÃO DE DADOS',title:'Posso colar dados do cliente em uma IA?',minutes:3,
   description:'Cuidados antes de usar serviços externos com informações profissionais.',
   icon:'shield',
   steps:[
    'Identifique se o material contém dados pessoais, informações sensíveis, segredo de justiça ou informações protegidas por sigilo profissional.',
    'Antes de usar uma ferramenta externa, verifique as regras de tratamento dos dados, retenção, treinamento e acesso de terceiros.',
    'Prefira exemplos fictícios ou informações efetivamente anonimizadas. Remover apenas o nome nem sempre é suficiente.',
    'Consulte as regras institucionais e contratuais aplicáveis ao caso e mantenha supervisão profissional sobre o resultado.'
   ],
   outcome:'Resultado esperado: reduzir a exposição indevida de informações e saber quando não usar uma ferramenta.'},
  {id:'minuta',tag:'PRODUTIVIDADE',title:'Como pedir uma minuta e revisar o resultado',minutes:5,
   description:'Use a IA como apoio de redação, não como fonte de fatos ou normas não conferidas.',
   icon:'file',
   steps:[
    'Defina o objetivo do documento, público-alvo e o que já está efetivamente confirmado.',
    'Solicite uma estrutura organizada e peça que o sistema separe dúvidas de informações fornecidas.',
    'Não insira documentos confidenciais ou identificadores de clientes em ferramentas não autorizadas.',
    'Verifique cada fato, referência jurídica, prazo, pedido e conclusão em fontes adequadas.',
    'Revise linguagem, adequação processual e responsabilidade final antes de qualquer utilização.'
   ],
   outcome:'Resultado esperado: um rascunho mais organizado, ainda sujeito à análise jurídica humana.'},
  {id:'novidades',tag:'ATUALIZAÇÃO',title:'Uma notícia mudou a regra. E agora?',minutes:3,
   description:'Entenda a diferença entre anúncio, proposta legislativa e norma vigente.',
   icon:'sparkles',
   steps:[
    'Confira a data da notícia e abra o documento indicado pela fonte oficial.',
    'Identifique se o conteúdo é projeto, decisão, orientação, regulamento ou lei publicada.',
    'Verifique vigência, possíveis regras de transição e eventual alteração posterior.',
    'Avalie a pertinência para a matéria e o caso específico antes de concluir que existe obrigação imediata.'
   ],
   outcome:'Resultado esperado: compreender o estágio da mudança antes de atuar.'}
];
export type PromptTask='resumo'|'revisao'|'estrutura';
export const promptTasks:{id:PromptTask;label:string;help:string}[]=[
 {id:'resumo',label:'Resumir documento',help:'Resumo objetivo, com lacunas sinalizadas'},
 {id:'revisao',label:'Revisar texto',help:'Clareza, organização e pontos a conferir'},
 {id:'estrutura',label:'Estruturar uma minuta',help:'Esboço para revisão profissional'}
];
const tasks:Record<PromptTask,string>={
 resumo:'Produza um resumo estruturado do conteúdo que eu fornecer, distinguindo fatos, alegações e pontos ainda não comprovados.',
 revisao:'Revise a clareza, organização e coerência do texto que eu fornecer, sem alterar o significado dos fatos nem criar conteúdo novo.',
 estrutura:'Proponha a estrutura de um documento jurídico de trabalho, com seções e perguntas de conferência, sem afirmar que o modelo está adequado a qualquer processo específico.'
};
export function buildSafePrompt(task:PromptTask,goal:string){
 const clean=goal.replace(/\s+/g,' ').trim().slice(0,350);
 return ['Você é um assistente de apoio à organização de textos jurídicos. A decisão e a revisão finais cabem ao profissional.',
 tasks[task],
 clean?'Objetivo descrito pelo usuário (sem dados identificáveis): '+clean:'Objetivo: fornecer um exemplo genérico, sem dados de processos ou clientes.',
 'Regras obrigatórias:',
 '- Não invente decisões, leis, artigos, citações, datas, números de processo, prazos ou fatos.',
 '- Não apresente informação não verificada como verdadeira. Sinalize lacunas com [VERIFICAR].',
 '- Quando uma referência jurídica for necessária, indique o que precisa ser consultado diretamente em fonte oficial.',
 '- Se faltarem elementos, faça perguntas em vez de presumir.',
 '- Produza linguagem clara, com itens para revisão humana.'].join('\n');
}
export const verificationChecks=[
 'Conferi a existência e a origem das decisões mencionadas.',
 'Conferi legislação, vigência e eventuais alterações.',
 'Conferi datas, valores, prazos e identificação de processos.',
 'Verifiquei se existem fatos inventados ou conclusões sem suporte.',
 'Revisei a adequação do texto ao caso concreto e ao sigilo profissional.',
 'Fiz a revisão final como responsável pelo trabalho.'
];
