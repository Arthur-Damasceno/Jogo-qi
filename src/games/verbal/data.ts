import type { QuizQuestion } from '../types'
import { buildQuizFromBank, type BankItem } from '../bank'

/**
 * Banco de raciocínio verbal em português: analogias, intrusos e relações
 * entre palavras. A primeira alternativa é sempre a correta.
 */
const BANK: BankItem[] = [
  // ---------- TIER 1 ----------
  {
    tier: 1,
    q: 'CÃO está para LATIR assim como GATO está para...',
    choices: ['Miar', 'Arranhar', 'Dormir', 'Ronronar alto'],
    explain: 'A relação é animal → som característico: o cão late, o gato mia.',
  },
  {
    tier: 1,
    q: 'PILOTO está para AVIÃO assim como MAQUINISTA está para...',
    choices: ['Trem', 'Navio', 'Máquina', 'Estrada'],
    explain: 'A relação é profissional → veículo que conduz.',
  },
  {
    tier: 1,
    q: 'Qual palavra NÃO pertence ao grupo? MAÇÃ, BANANA, CENOURA, UVA',
    choices: ['Cenoura', 'Maçã', 'Banana', 'Uva'],
    explain: 'Cenoura é a única hortaliça (raiz); as demais são frutas.',
  },
  {
    tier: 1,
    q: 'QUENTE está para FRIO assim como CLARO está para...',
    choices: ['Escuro', 'Luz', 'Brilhante', 'Dia'],
    explain: 'A relação é de antônimos: o oposto de claro é escuro.',
  },
  {
    tier: 1,
    q: 'LIVRO está para BIBLIOTECA assim como QUADRO está para...',
    choices: ['Museu', 'Parede', 'Moldura', 'Tinta'],
    explain: 'A relação é objeto → instituição que o guarda e exibe.',
  },
  {
    tier: 1,
    q: 'Qual é o sinônimo mais próximo de VELOZ?',
    choices: ['Rápido', 'Forte', 'Ágil de raciocínio', 'Imediato'],
    explain: '"Veloz" descreve alta velocidade; o sinônimo direto é "rápido".',
  },
  {
    tier: 1,
    q: 'DEDO está para MÃO assim como PÉTALA está para...',
    choices: ['Flor', 'Jardim', 'Caule', 'Perfume'],
    explain: 'A relação é parte → todo: o dedo compõe a mão, a pétala compõe a flor.',
  },
  {
    tier: 1,
    q: 'Qual palavra NÃO pertence ao grupo? VIOLÃO, PIANO, FLAUTA, PINCEL',
    choices: ['Pincel', 'Violão', 'Piano', 'Flauta'],
    explain: 'Pincel é instrumento de pintura; os demais são instrumentos musicais.',
  },
  {
    tier: 1,
    q: 'ABELHA está para MEL assim como GALINHA está para...',
    choices: ['Ovo', 'Pena', 'Milho', 'Granja'],
    explain: 'A relação é animal → produto que ele produz.',
  },
  {
    tier: 1,
    q: 'Qual é o antônimo de GENEROSO?',
    choices: ['Mesquinho', 'Pobre', 'Tímido', 'Rude'],
    explain: 'Generoso é quem dá com facilidade; mesquinho é quem reluta em dar.',
  },
  {
    tier: 1,
    q: 'MÉDICO está para HOSPITAL assim como PROFESSOR está para...',
    choices: ['Escola', 'Livro', 'Aluno', 'Aula'],
    explain: 'A relação é profissional → local de trabalho.',
  },
  {
    tier: 1,
    q: 'SEMENTE está para ÁRVORE assim como OVO está para...',
    choices: ['Ave', 'Ninho', 'Casca', 'Galinheiro'],
    explain: 'A relação é origem → ser desenvolvido: da semente nasce a árvore, do ovo nasce a ave.',
  },

  // ---------- TIER 2 ----------
  {
    tier: 2,
    q: 'ESCASSO está para ABUNDANTE assim como EFÊMERO está para...',
    choices: ['Duradouro', 'Rápido', 'Frágil', 'Antigo'],
    explain: 'Pares de antônimos: efêmero (passageiro) opõe-se a duradouro.',
  },
  {
    tier: 2,
    q: 'Qual palavra NÃO pertence ao grupo? EUFORIA, JÚBILO, REGOZIJO, MELANCOLIA',
    choices: ['Melancolia', 'Euforia', 'Júbilo', 'Regozijo'],
    explain: 'As três primeiras expressam alegria intensa; melancolia é tristeza.',
  },
  {
    tier: 2,
    q: 'FOME está para COMER assim como FADIGA está para...',
    choices: ['Descansar', 'Trabalhar', 'Correr', 'Bocejar'],
    explain: 'A relação é necessidade → ação que a satisfaz.',
  },
  {
    tier: 2,
    q: 'Qual é o sinônimo mais próximo de PROLIXO?',
    choices: ['Excessivamente longo ao falar', 'Confuso', 'Eloquente', 'Repetitivo por má-fé'],
    explain: 'Prolixo é quem se estende demais, usando mais palavras que o necessário.',
  },
  {
    tier: 2,
    q: 'ESCULTOR está para MÁRMORE assim como POETA está para...',
    choices: ['Palavras', 'Livros', 'Rimas', 'Inspiração'],
    explain: 'A relação é artista → matéria-prima: o escultor molda o mármore, o poeta molda as palavras.',
  },
  {
    tier: 2,
    q: 'MICROSCÓPIO está para PEQUENO assim como TELESCÓPIO está para...',
    choices: ['Distante', 'Grande', 'Espaço', 'Estrela'],
    explain: 'O microscópio permite ver o que é pequeno; o telescópio, o que é distante.',
  },
  {
    tier: 2,
    q: 'Qual é o antônimo de CÉTICO?',
    choices: ['Crédulo', 'Otimista', 'Sábio', 'Confiável'],
    explain: 'O cético duvida; o crédulo acredita com facilidade.',
  },
  {
    tier: 2,
    q: 'FAÍSCA está para INCÊNDIO assim como BOATO está para...',
    choices: ['Escândalo', 'Conversa', 'Jornal', 'Segredo'],
    explain: 'Algo pequeno que pode crescer e sair do controle: a faísca vira incêndio, o boato vira escândalo.',
  },
  {
    tier: 2,
    q: 'Qual palavra NÃO pertence ao grupo? RELUTANTE, HESITANTE, VACILANTE, RESOLUTO',
    choices: ['Resoluto', 'Relutante', 'Hesitante', 'Vacilante'],
    explain: 'Resoluto é quem decide com firmeza; as demais indicam dúvida ou indecisão.',
  },
  {
    tier: 2,
    q: 'REMO está para BARCO assim como PEDAL está para...',
    choices: ['Bicicleta', 'Pé', 'Corrida', 'Roda'],
    explain: 'A relação é mecanismo de propulsão → veículo.',
  },
  {
    tier: 2,
    q: 'Qual é o sinônimo mais próximo de PERSPICAZ?',
    choices: ['Sagaz', 'Curioso', 'Atento aos detalhes visuais', 'Estudioso'],
    explain: 'Perspicaz é quem percebe e compreende com agudeza — sagaz.',
  },
  {
    tier: 2,
    q: 'PARTITURA está para MÚSICO assim como RECEITA está para...',
    choices: ['Cozinheiro', 'Médico', 'Ingrediente', 'Restaurante'],
    explain: 'A relação é guia escrito → profissional que o executa (no sentido culinário).',
  },

  // ---------- TIER 3 ----------
  {
    tier: 3,
    q: 'MITIGAR está para AGRAVAR assim como CONCISO está para...',
    choices: ['Prolixo', 'Claro', 'Breve', 'Complexo'],
    explain: 'Antônimos: mitigar/agravar e conciso (breve) / prolixo (extenso demais).',
  },
  {
    tier: 3,
    q: 'Qual palavra NÃO pertence ao grupo? EFÊMERO, TRANSITÓRIO, FUGAZ, PERENE',
    choices: ['Perene', 'Efêmero', 'Transitório', 'Fugaz'],
    explain: 'Perene significa duradouro; as outras três indicam curta duração.',
  },
  {
    tier: 3,
    q: 'EPÍLOGO está para ROMANCE assim como CODA está para...',
    choices: ['Sinfonia', 'Poema', 'Peça de teatro', 'Pintura'],
    explain: 'A relação é seção final → obra: o epílogo encerra o romance, a coda encerra a peça musical.',
  },
  {
    tier: 3,
    q: 'Qual é o sinônimo mais próximo de LACÔNICO?',
    choices: ['Breve nas palavras', 'Melancólico', 'Indiferente', 'Cansado'],
    explain: 'Lacônico é quem se expressa com pouquíssimas palavras.',
  },
  {
    tier: 3,
    q: 'ICONOCLASTA está para TRADIÇÃO assim como PACIFISTA está para...',
    choices: ['Guerra', 'Paz', 'Exército', 'Diplomacia'],
    explain: 'A relação é pessoa → aquilo a que se opõe: o iconoclasta combate tradições, o pacifista combate a guerra.',
  },
  {
    tier: 3,
    q: 'Qual é o antônimo de MAGNÂNIMO?',
    choices: ['Vingativo', 'Humilde', 'Covarde', 'Avarento'],
    explain: 'Magnânimo é quem perdoa com grandeza de espírito; o oposto é o vingativo, que não perdoa.',
  },
  {
    tier: 3,
    q: 'PALIATIVO está para CURA assim como TRÉGUA está para...',
    choices: ['Paz', 'Guerra', 'Acordo', 'Batalha'],
    explain: 'Solução temporária → solução definitiva: o paliativo alivia sem curar; a trégua interrompe sem encerrar a guerra.',
  },
  {
    tier: 3,
    q: 'Qual palavra NÃO pertence ao grupo? VERBORRAGIA, ELOQUÊNCIA, RETÓRICA, TACITURNO',
    choices: ['Taciturno', 'Verborragia', 'Eloquência', 'Retórica'],
    explain: 'Taciturno é quem fala pouco; as demais dizem respeito ao uso (abundante ou hábil) da fala.',
  },
  {
    tier: 3,
    q: 'ANACRÔNICO está para ÉPOCA assim como DESLOCADO está para...',
    choices: ['Lugar', 'Tempo', 'Pessoa', 'Situação'],
    explain: 'Anacrônico é o que está fora de sua época; deslocado, fora de seu lugar.',
  },
  {
    tier: 3,
    q: 'Qual é o sinônimo mais próximo de PUSILÂNIME?',
    choices: ['Covarde', 'Insignificante', 'Preguiçoso', 'Doentio'],
    explain: 'Pusilânime é quem carece de coragem — covarde.',
  },
  {
    tier: 3,
    q: 'DILUIR está para CONCENTRAR assim como DISSIPAR está para...',
    choices: ['Acumular', 'Espalhar', 'Gastar', 'Evaporar'],
    explain: 'Antônimos de intensidade: dissipar (desfazer, espalhar até sumir) opõe-se a acumular.',
  },
  {
    tier: 3,
    q: 'ÁPICE está para MONTANHA assim como CLÍMAX está para...',
    choices: ['Narrativa', 'Teatro', 'Emoção', 'Final'],
    explain: 'A relação é ponto máximo → estrutura: o ápice é o topo da montanha; o clímax, o ponto alto da narrativa.',
  },
]

export function buildVerbalQuiz(level: number, count = 8): QuizQuestion[] {
  return buildQuizFromBank(BANK, level, count)
}
