import type { QuizQuestion } from '../types'
import { buildQuizFromBank, type BankItem } from '../bank'

/**
 * Banco de raciocínio crítico em português.
 * Convenção: a primeira alternativa de `choices` é sempre a correta
 * (as opções são embaralhadas na montagem da sessão).
 * tier: 1 = fácil, 2 = médio, 3 = difícil.
 */
const BANK: BankItem[] = [
  // ---------- TIER 1: silogismos e dedução básica ----------
  {
    tier: 1,
    q: 'Todos os gatos são mamíferos. Mingau é um gato. O que se pode concluir?',
    choices: [
      'Mingau é um mamífero',
      'Todos os mamíferos são gatos',
      'Mingau pode não ser mamífero',
      'Nada se pode concluir',
    ],
    explain: 'Se todo gato é mamífero e Mingau é gato, então necessariamente Mingau é mamífero.',
  },
  {
    tier: 1,
    q: 'Nenhum peixe respira fora da água por muito tempo. O boto respira fora da água por muito tempo. Logo...',
    choices: [
      'O boto não é um peixe',
      'O boto é um peixe especial',
      'Alguns peixes respiram fora da água',
      'O boto vive fora da água',
    ],
    explain: 'Se nenhum peixe tem essa característica e o boto tem, o boto não pode ser peixe.',
  },
  {
    tier: 1,
    q: 'Se chover, a rua fica molhada. A rua está molhada. O que se pode concluir com certeza?',
    choices: [
      'Nada com certeza — pode ter outra causa',
      'Choveu',
      'Não choveu',
      'Vai chover de novo',
    ],
    explain:
      'A rua molhada pode ter outras causas (um caminhão-pipa, por exemplo). Afirmar que choveu é a falácia da afirmação do consequente.',
  },
  {
    tier: 1,
    q: 'Se estudo, passo na prova. Não passei na prova. O que se pode concluir?',
    choices: ['Não estudei', 'Estudei pouco', 'A prova estava difícil', 'Nada se pode concluir'],
    explain:
      'É a forma válida modus tollens: se "estudar garante passar" e não passei, então não estudei.',
  },
  {
    tier: 1,
    q: 'Alguns médicos são pesquisadores. Todos os pesquisadores leem artigos. O que se conclui?',
    choices: [
      'Alguns médicos leem artigos',
      'Todos os médicos leem artigos',
      'Alguns pesquisadores são médicos e não leem artigos',
      'Nenhum médico lê artigos',
    ],
    explain:
      'Os médicos que são pesquisadores leem artigos; logo, pelo menos alguns médicos leem artigos.',
  },
  {
    tier: 1,
    q: '"Você não pode criticar o prefeito, você nem nasceu nesta cidade!" Qual é o problema desse argumento?',
    choices: [
      'Ataca a pessoa em vez do argumento (ad hominem)',
      'Generaliza a partir de um caso',
      'Apela para a emoção',
      'Usa uma falsa analogia',
    ],
    explain:
      'Desqualificar quem fala, em vez de responder ao que foi dito, é a falácia ad hominem.',
  },
  {
    tier: 1,
    q: '"Todo mundo está comprando esse celular, então ele deve ser o melhor." Qual falácia é essa?',
    choices: [
      'Apelo à popularidade',
      'Falsa causa',
      'Espantalho',
      'Apelo à autoridade',
    ],
    explain: 'Popularidade não é evidência de qualidade — essa é a falácia do apelo à popularidade.',
  },
  {
    tier: 1,
    q: 'Ana é mais alta que Bia. Bia é mais alta que Carla. Quem é a mais baixa?',
    choices: ['Carla', 'Bia', 'Ana', 'Impossível saber'],
    explain: 'A relação "mais alta que" é transitiva: Ana > Bia > Carla, então Carla é a mais baixa.',
  },
  {
    tier: 1,
    q: '"Ou você está comigo, ou está contra mim." Qual é o problema dessa frase?',
    choices: [
      'Apresenta só duas opções quando existem outras (falso dilema)',
      'Ataca a pessoa',
      'Inverte causa e efeito',
      'Usa palavras ambíguas',
    ],
    explain:
      'Reduzir a situação a apenas duas alternativas extremas, ignorando posições intermediárias, é o falso dilema.',
  },
  {
    tier: 1,
    q: 'Todos os alunos da turma A usam uniforme. João usa uniforme. João é da turma A?',
    choices: [
      'Não necessariamente — outras turmas podem usar uniforme',
      'Sim, com certeza',
      'Não, com certeza',
      'Sim, se o uniforme for igual',
    ],
    explain:
      'Usar uniforme é necessário para a turma A, mas pode não ser exclusivo dela. Concluir que sim é afirmar o consequente.',
  },
  {
    tier: 1,
    q: '"Meu avô fumou a vida toda e viveu até os 95 anos, então fumar não faz mal." O que há de errado?',
    choices: [
      'Um único caso não anula a evidência estatística',
      'O avô pode ter mentido',
      'A conclusão é verdadeira',
      '95 anos não é uma vida longa',
    ],
    explain:
      'É uma generalização a partir de um caso isolado. Exceções individuais não refutam tendências estatísticas.',
  },
  {
    tier: 1,
    q: 'Se o alarme dispara, o segurança acorda. O alarme disparou. O que se conclui?',
    choices: [
      'O segurança acordou',
      'Houve um assalto',
      'O segurança estava dormindo',
      'Nada se pode concluir',
    ],
    explain: 'Forma válida modus ponens: premissa condicional + antecedente verdadeiro = consequente verdadeiro.',
  },

  // ---------- TIER 2: premissas ocultas, fortalecer/enfraquecer ----------
  {
    tier: 2,
    q: '"Devemos contratar a Marina, pois ela tem 10 anos de experiência." Qual premissa está oculta nesse argumento?',
    choices: [
      'Experiência é o critério decisivo para a vaga',
      'Marina quer o emprego',
      'Os outros candidatos são ruins',
      'Marina tem boas referências',
    ],
    explain:
      'O argumento só funciona se assumirmos que experiência é o que importa para contratar — essa é a premissa não declarada.',
  },
  {
    tier: 2,
    q: '"As vendas caíram depois que trocamos o logotipo. O novo logotipo causou a queda." O que enfraquece MAIS essa conclusão?',
    choices: [
      'As vendas de todo o setor caíram no mesmo período',
      'O logotipo antigo era mais colorido',
      'Alguns clientes elogiaram o novo logotipo',
      'A troca custou caro',
    ],
    explain:
      'Se o setor inteiro caiu, a causa provável é externa, não o logotipo. Isso ataca diretamente o vínculo causal.',
  },
  {
    tier: 2,
    q: '"Cidades com mais bibliotecas têm mais crimes. Logo, bibliotecas causam crime." Qual é o erro?',
    choices: [
      'Confunde correlação com causa — ambas crescem com o tamanho da cidade',
      'As bibliotecas deveriam ser fechadas',
      'Faltam dados sobre os tipos de crime',
      'O erro é de matemática',
    ],
    explain:
      'Cidades maiores têm mais bibliotecas E mais crimes. Uma terceira variável (população) explica a correlação.',
  },
  {
    tier: 2,
    q: '"Estudantes que tomam café da manhã tiram notas melhores. Logo, café da manhã melhora as notas." O que mais enfraquece?',
    choices: [
      'Famílias mais estruturadas oferecem café da manhã E apoio nos estudos',
      'Algumas pessoas não gostam de café da manhã',
      'O estudo foi feito em apenas um país',
      'Notas não medem inteligência',
    ],
    explain:
      'Uma causa comum (ambiente familiar) pode explicar as duas coisas, quebrando a relação causal direta.',
  },
  {
    tier: 2,
    q: '"Proibir carros no centro reduzirá a poluição." O que FORTALECE mais esse argumento?',
    choices: [
      'Cidades semelhantes que proibiram carros tiveram queda de 30% na poluição',
      'Muitas pessoas apoiam a proibição',
      'Carros são caros de manter',
      'O centro tem muitos pedestres',
    ],
    explain:
      'Evidência empírica de casos comparáveis é o que melhor sustenta uma previsão causal.',
  },
  {
    tier: 2,
    q: '"O deputado defende impostos menores porque é rico." Esse ataque é falho porque...',
    choices: [
      'A motivação de alguém não torna seu argumento falso',
      'O deputado pode não ser rico',
      'Impostos menores são sempre bons',
      'Deputados não pagam impostos',
    ],
    explain:
      'Julgar um argumento pela motivação de quem o apresenta é falácia genética/ad hominem circunstancial. O argumento deve ser avaliado por seus méritos.',
  },
  {
    tier: 2,
    q: 'Pesquisa: "80% dos clientes que responderam estão satisfeitos." Qual é a maior fragilidade?',
    choices: [
      'Quem responde pesquisas pode não representar todos os clientes',
      '80% é um número baixo',
      'A pesquisa deveria ser anual',
      'Clientes satisfeitos não são lucrativos',
    ],
    explain:
      'Viés de autosseleção: insatisfeitos podem simplesmente ter ido embora sem responder. A amostra pode não representar o todo.',
  },
  {
    tier: 2,
    q: '"Ninguém provou que o produto X faz mal. Logo, ele é seguro." Qual é o erro?',
    choices: [
      'Ausência de prova contrária não é prova a favor (apelo à ignorância)',
      'O produto X é claramente perigoso',
      'Falta citar a fonte',
      'É um ataque pessoal',
    ],
    explain:
      'Concluir que algo é verdadeiro só porque não foi refutado é a falácia do apelo à ignorância.',
  },
  {
    tier: 2,
    q: '"Se permitirmos home office um dia por semana, logo ninguém mais virá ao escritório." Qual falácia?',
    choices: [
      'Ladeira escorregadia (bola de neve)',
      'Apelo à autoridade',
      'Falso dilema',
      'Ad hominem',
    ],
    explain:
      'Assumir que um pequeno passo levará inevitavelmente a um extremo, sem justificar essa cadeia, é a ladeira escorregadia.',
  },
  {
    tier: 2,
    q: '"João disse que devemos comer menos açúcar. Mas João adora bolo! Ignorem o que ele diz." Qual falácia?',
    choices: [
      'Tu quoque (apelo à hipocrisia)',
      'Espantalho',
      'Falsa causa',
      'Generalização apressada',
    ],
    explain:
      'Apontar a incoerência de quem argumenta não refuta o argumento — comer menos açúcar pode ser um bom conselho mesmo vindo de quem come bolo.',
  },
  {
    tier: 2,
    q: 'Um remédio foi testado só em pessoas que também mudaram a dieta. A melhora dos pacientes prova a eficácia do remédio?',
    choices: [
      'Não — a dieta é uma variável de confusão',
      'Sim, pois houve melhora',
      'Sim, se a amostra for grande',
      'Não, porque remédios não funcionam',
    ],
    explain:
      'Com duas mudanças simultâneas, não dá para atribuir o efeito ao remédio. Seria preciso um grupo de controle.',
  },
  {
    tier: 2,
    q: '"Ele propôs revisar o orçamento da escola. Ou seja, ele quer destruir a educação!" Qual falácia?',
    choices: [
      'Espantalho — distorce a posição do outro para atacá-la',
      'Apelo à popularidade',
      'Círculo vicioso',
      'Analogia falsa',
    ],
    explain:
      'Exagerar ou distorcer o argumento original para combater uma versão caricata dele é a falácia do espantalho.',
  },

  // ---------- TIER 3: análise fina de argumentos ----------
  {
    tier: 3,
    q: '"A empresa deve investir em anúncios, pois toda empresa que cresceu investiu em anúncios." Qual é a falha lógica?',
    choices: [
      'Empresas que investiram e NÃO cresceram foram ignoradas (viés de sobrevivência)',
      'Anúncios são caros demais',
      'Crescer nem sempre é bom',
      'A conclusão repete a premissa',
    ],
    explain:
      'Olhar só os casos de sucesso ignora quantas empresas investiram em anúncios e fracassaram — viés de sobrevivência.',
  },
  {
    tier: 3,
    q: '"A Bíblia é verdadeira porque é a palavra de Deus, e sabemos que é a palavra de Deus porque a Bíblia o diz." Qual é a estrutura desse argumento?',
    choices: [
      'Circular — a conclusão é usada como premissa',
      'Dedutivamente válido',
      'Indutivo forte',
      'Um falso dilema',
    ],
    explain:
      'O argumento pressupõe aquilo que tenta provar: a confiabilidade da fonte é justificada pela própria fonte.',
  },
  {
    tier: 3,
    q: 'Hospital A tem taxa de mortalidade maior que o hospital B. Podemos concluir que B é melhor?',
    choices: [
      'Não — A pode receber os casos mais graves',
      'Sim, os números falam por si',
      'Sim, se a diferença for grande',
      'Não, porque mortalidade não importa',
    ],
    explain:
      'Hospitais de referência atraem pacientes mais graves. Sem ajustar pela gravidade dos casos, a comparação é enganosa.',
  },
  {
    tier: 3,
    q: 'Todos os A são B. Nenhum B é C. Qual conclusão é NECESSARIAMENTE verdadeira?',
    choices: ['Nenhum A é C', 'Alguns A são C', 'Todos os C são A', 'Alguns C são B'],
    explain: 'Se A está contido em B, e B não tem interseção com C, então A também não tem interseção com C.',
  },
  {
    tier: 3,
    q: '"90% dos acidentes ocorrem perto de casa. Logo, dirigir longe de casa é mais seguro." Qual é o erro?',
    choices: [
      'Ignora que a maioria das viagens acontece perto de casa (taxa-base)',
      'A estatística está desatualizada',
      'Acidentes longe de casa são piores',
      'Não há erro',
    ],
    explain:
      'Sem comparar com a proporção de quilômetros rodados perto de casa, o número absoluto nada diz sobre risco relativo.',
  },
  {
    tier: 3,
    q: 'Um teste detecta uma doença rara (1 em 1000) com 99% de acerto. Você testou positivo. A chance de estar doente é...',
    choices: [
      'Bem menor que 99% — os falsos positivos superam os casos reais',
      'Exatamente 99%',
      'Praticamente 100%',
      '50%',
    ],
    explain:
      'Em 1000 pessoas: ~1 doente (positivo real) e ~10 falsos positivos entre os 999 saudáveis. Um positivo tem ~9% de chance de ser real — a taxa-base importa.',
  },
  {
    tier: 3,
    q: 'Se A então B. Se B então C. Não C. O que se conclui?',
    choices: ['Não A e não B', 'Apenas não B', 'A pode ser verdadeiro', 'B é verdadeiro'],
    explain:
      'Modus tollens em cadeia: não C força não B (pela segunda premissa), e não B força não A (pela primeira).',
  },
  {
    tier: 3,
    q: '"As notas da escola subiram após o novo diretor assumir. Ele é a causa." Qual alternativa NÃO é uma explicação rival plausível?',
    choices: [
      'O diretor tem diploma de pedagogia',
      'A prova ficou mais fácil naquele ano',
      'Alunos com dificuldade saíram da escola',
      'Um programa de reforço já vinha em andamento',
    ],
    explain:
      'O diploma do diretor não explica a subida das notas por si só; as outras opções oferecem causas alternativas reais.',
  },
  {
    tier: 3,
    q: 'Numa ilha, cavaleiros sempre falam a verdade e escudeiros sempre mentem. João diz: "Eu sou escudeiro." O que se conclui?',
    choices: [
      'A situação é impossível',
      'João é escudeiro',
      'João é cavaleiro',
      'João é estrangeiro',
    ],
    explain:
      'Cavaleiro não pode dizer isso (seria mentira) e escudeiro também não (seria verdade). A frase gera contradição — ninguém da ilha pode dizê-la.',
  },
  {
    tier: 3,
    q: '"Ou aumentamos os impostos, ou a dívida explode. Aumentar impostos é ruim. Logo, devemos aceitar a dívida." Qual é a fragilidade central?',
    choices: [
      'A primeira premissa ignora alternativas, como cortar gastos',
      'Impostos nunca são ruins',
      'Dívidas nunca explodem',
      'A conclusão não segue das premissas',
    ],
    explain:
      'O argumento é formalmente coerente, mas parte de um falso dilema: existem outras opções além das duas apresentadas.',
  },
  {
    tier: 3,
    q: 'Pedro: "Nenhum estudo prova que o método funciona." Lia: "Então você admite que ele funciona, já que não há prova de que falha!" O erro de Lia é...',
    choices: [
      'Transferir o ônus da prova e apelar à ignorância',
      'Atacar Pedro pessoalmente',
      'Usar uma analogia falsa',
      'Citar autoridade inexistente',
    ],
    explain:
      'Quem afirma que o método funciona é que precisa provar. A falta de prova contrária não sustenta a afirmação.',
  },
  {
    tier: 3,
    q: 'Uma loja anuncia: "Até 70% de desconto!" Qual leitura crítica está correta?',
    choices: [
      '"Até" permite que quase nada tenha 70% — o anúncio pouco garante',
      'Todos os produtos têm 70% de desconto',
      'A média dos descontos é 70%',
      'O desconto mínimo é 70%',
    ],
    explain:
      '"Até 70%" fixa apenas o teto do desconto. Um único item com 70% torna o anúncio tecnicamente verdadeiro.',
  },
  {
    tier: 3,
    q: 'Um fundo de investimento anuncia: "Nossos 10 fundos ativos batem o mercado há 5 anos." O que a análise crítica deve perguntar primeiro?',
    choices: [
      'Quantos fundos a empresa fechou ou fundiu nesses 5 anos',
      'Qual é a taxa de administração',
      'Quem é o gestor dos fundos',
      'Se o mercado subiu no período',
    ],
    explain:
      'Fundos ruins costumam ser fechados ou fundidos; olhar só os sobreviventes infla o desempenho aparente — viés de sobrevivência.',
  },
  {
    tier: 3,
    q: 'Estudo: pacientes que tomam o remédio X têm mais infartos. Crítico: "Talvez o X seja receitado justamente aos pacientes mais graves." Que tipo de objeção é essa?',
    choices: [
      'Causalidade reversa/confusão por indicação — a gravidade causa ambos',
      'Ataque ad hominem ao estudo',
      'Apelo à ignorância',
      'Generalização apressada',
    ],
    explain:
      'Quando a condição do paciente determina o tratamento, o tratamento fica associado ao desfecho ruim sem causá-lo.',
  },
  {
    tier: 3,
    q: 'Se algum A é B, e todo B é C, qual conclusão é NECESSARIAMENTE verdadeira?',
    choices: ['Algum A é C', 'Todo A é C', 'Algum C não é A', 'Nenhuma conclusão é possível'],
    explain:
      'Os A que são B estão dentro de C; logo, pelo menos algum A é C. "Todo A é C" não segue, pois pode haver A fora de B.',
  },
  {
    tier: 3,
    q: 'Uma cidade instala radares nos cruzamentos com mais acidentes. No ano seguinte, os acidentes nesses pontos caem. Por que a queda pode NÃO ser mérito dos radares?',
    choices: [
      'Regressão à média: pontos com números extremos tendem a voltar ao normal',
      'Radares sempre reduzem acidentes',
      'Os motoristas mudaram de cidade',
      'Acidentes não podem ser medidos',
    ],
    explain:
      'Os cruzamentos foram escolhidos por terem tido números excepcionalmente altos; parte da queda aconteceria de qualquer forma.',
  },
  {
    tier: 3,
    q: '"O candidato A subiu 4 pontos na pesquisa (margem de erro: ±3 pontos por candidato)." Qual é a leitura mais rigorosa?',
    choices: [
      'A subida pode ser bem menor ou maior — a variação está próxima do ruído da pesquisa',
      'A subida de 4 pontos é um fato exato',
      'O candidato A vencerá a eleição',
      'A pesquisa está fraudada',
    ],
    explain:
      'Com margem de ±3 em cada medição, uma diferença de 4 pontos entre duas pesquisas é pouco maior que o erro combinado — sinal fraco.',
  },
  {
    tier: 3,
    q: 'Argumento: "Nenhum sistema seguro é simples. Este sistema é simples. Logo, não é seguro." Esse raciocínio é...',
    choices: [
      'Válido: é um silogismo correto (Celarent)',
      'Inválido: afirma o consequente',
      'Inválido: generalização apressada',
      'Válido apenas se o sistema for grande',
    ],
    explain:
      'A forma é válida: se seguro → não-simples, então simples → não-seguro (contrapositiva). A conclusão segue das premissas — o que se pode questionar é a primeira premissa.',
  },
]

export function buildCriticalQuiz(level: number, count = 8): QuizQuestion[] {
  return buildQuizFromBank(BANK, level, count)
}
