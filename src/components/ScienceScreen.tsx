interface Props {
  onBack: () => void
  onStudy: () => void
}

/** Tela "Sobre a ciência": o que o app treina e o que realmente aumenta o QI. */
export default function ScienceScreen({ onBack, onStudy }: Props) {
  return (
    <div className="screen">
      <header className="game-header">
        <button className="back" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <h2>🔬 Sobre a ciência</h2>
        <span />
      </header>

      <section className="science-card">
        <h3>O que o QI estimado significa</h3>
        <p>
          O número na tela inicial mede seu <strong>progresso dentro do app</strong> (escala
          80–200), combinando nível e acerto recente em cada jogo. Ele <strong>não é</strong> um QI
          psicométrico: testes reais comparam você com uma amostra da população, em aplicação única
          e com itens inéditos. Use-o como bússola de evolução, não como diagnóstico.
        </p>
      </section>

      <section className="science-card">
        <h3>O que este app treina de verdade</h3>
        <p>
          Os jogos vêm de paradigmas validados (matrizes de Raven, N-Back, Stroop, blocos de
          Corsi). A ciência mostra que a prática melhora fortemente{' '}
          <strong>as habilidades treinadas</strong> — atenção à tarefa, memória de trabalho no
          exercício, velocidade — mas transfere pouco para a inteligência geral (Owen et al.,
          2010; Simons et al., 2016).
        </p>
        <p>
          A exceção importante é o <strong>raciocínio crítico</strong>: reconhecer falácias e
          avaliar argumentos são habilidades ensináveis que transferem para situações novas do dia
          a dia.
        </p>
      </section>

      <section className="science-card">
        <h3>O que comprovadamente aumenta a inteligência</h3>
        <ul className="science-list">
          <li>
            🎓 <strong>Educação estruturada</strong> — o achado mais sólido: 1 a 5 pontos de QI por
            ano de estudo (Ritchie &amp; Tucker-Drob, 2018). Cursos exigentes, com progressão e
            avaliação.
          </li>
          <li>
            😴 <strong>Sono de 7–9h</strong> — privação crônica derruba atenção e raciocínio de
            forma mensurável.
          </li>
          <li>
            🏃 <strong>Exercício aeróbico</strong> — ~150 min/semana; efeito modesto agora, grande
            na prevenção de declínio.
          </li>
          <li>
            🩺 <strong>Cuidar da saúde</strong> — tratar depressão, ansiedade, TDAH e apneia
            recupera desempenho; controlar pressão e glicemia protege o cérebro a longo prazo.
          </li>
          <li>
            🚫 <strong>Evitar danos</strong> — álcool em excesso, tabaco e traumatismos cranianos.
          </li>
        </ul>
      </section>

      <section className="science-card">
        <h3>O que não funciona</h3>
        <p>
          Suplementos "nootrópicos" comerciais, o "efeito Mozart" e apps que prometem aumentar seu
          QI só com joguinhos — inclusive este. 😉 Por isso o app tem a{' '}
          <strong>meta semanal de estudo</strong>: o hábito que de fato move QI.
        </p>
        <button className="btn primary" onClick={onStudy}>
          🎓 Configurar minha meta de estudo
        </button>
      </section>

      <p className="qi-disclaimer">
        Referências: Ritchie &amp; Tucker-Drob (2018), Psychological Science; Owen et al. (2010),
        Nature; Simons et al. (2016), Psychological Science in the Public Interest; Melby-Lervåg
        &amp; Hulme (2016).
      </p>
    </div>
  )
}
