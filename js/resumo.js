async function garantirConfiguracoesPedagogicasResumo() {
  if (typeof carregarConfiguracoesPedagogicas !== "function") {
    return;
  }

  try {
    await carregarConfiguracoesPedagogicas();
  } catch (erro) {
    console.warn(
      "Não foi possível carregar os critérios pedagógicos no Resumo:",
      erro
    );
  }
}

function obterCriteriosAvaliacaoResumo() {
  if (typeof obterConfiguracoesPedagogicas === "function") {
    const configuracoes = obterConfiguracoesPedagogicas();

    if (configuracoes?.avaliacao) {
      return configuracoes.avaliacao;
    }
  }

  return {
    mediaAprovacao: 6,
    limiteRecuperacao: 4,
    mediaDestaque: 8,
    casasDecimais: 1,
    arredondamento: "matematico",
  };
}

function classificarMediaResumo(media) {
  if (typeof classificarMediaPedagogica === "function") {
    return classificarMediaPedagogica(media);
  }

  const criterios = obterCriteriosAvaliacaoResumo();

  const numero = Number(media);

  if (!Number.isFinite(numero)) {
    return {
      codigo: "sem-media",
      texto: "Sem média",
      cor: "var(--primaria)",
    };
  }

  if (numero >= criterios.mediaDestaque) {
    return {
      codigo: "destaque",
      texto: "Destaque",
      cor: "var(--info, var(--primaria))",
    };
  }

  if (numero >= criterios.mediaAprovacao) {
    return {
      codigo: "aprovado",
      texto: "Aprovado",
      cor: "var(--sucesso)",
    };
  }

  if (numero >= criterios.limiteRecuperacao) {
    return {
      codigo: "recuperacao",
      texto: "Em recuperação",
      cor: "var(--alerta)",
    };
  }

  return {
    codigo: "critico",
    texto: "Precisa de atenção",
    cor: "var(--erro)",
  };
}

function formatarNotaResumo(valor) {
  if (typeof formatarNotaPedagogica === "function") {
    return formatarNotaPedagogica(valor);
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "—";
  }

  return numero.toFixed(1).replace(".", ",");
}

async function carregarHistoricoResumo() {
  const usuario =
    window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

  if (
    !usuario ||
    !window.db ||
    !window.firebaseFirestore?.collection ||
    !window.firebaseFirestore?.getDocs
  ) {
    return [];
  }

  try {
    const referencia = window.firebaseFirestore.collection(
      window.db,
      "usuarios",
      usuario.uid,
      "historico"
    );

    const snapshot = await window.firebaseFirestore.getDocs(referencia);

    const registros = [];

    snapshot.forEach((documento) => {
      registros.push({
        id: documento.id,
        ...documento.data(),
      });
    });

    return registros;
  } catch (erro) {
    console.error("Erro ao carregar histórico no Resumo:", erro);

    return [];
  }
}

async function carregarTurmasResumo() {
  if (typeof obterTurmasSalvas === "function") {
    const turmas = obterTurmasSalvas();

    if (Array.isArray(turmas)) {
      return turmas;
    }
  }

  try {
    const dados = JSON.parse(localStorage.getItem("turmas"));

    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    return [];
  }
}

async function abrirResumo() {
  await garantirConfiguracoesPedagogicasResumo();

  let historicoOriginal = await carregarHistoricoResumo();

  let turmas = await carregarTurmasResumo();

  document.body.innerHTML =
    ` <h1>📊 Estatísticas</h1> <select id="filtroResumoTurma"> <option value="">📚 Todas as turmas</option> </select> <br><br> <div id="areaResumo"></div> <button onclick="exportarPDF()">📄 Exportar PDF</button> <button onclick="voltarHome()"> ⬅ Voltar </button> ` + barraInferior("resumo");

  aplicarTemaSalvo();

  let filtro = document.getElementById("filtroResumoTurma");

  turmas.forEach((turma) => {
    filtro.innerHTML += ` <option value="${turma.nome}"> ${turma.nome} </option> `;
  });

  function renderizarResumo() {
    let turmaSelecionada = filtro.value;

    let historico = historicoOriginal.filter((aluno) => {
      return (
        turmaSelecionada === "" ||
        (aluno.turma || "Sem turma") === turmaSelecionada
      );
    });

    let total = historico.length;

    let totalRevisoes = historico.reduce((soma, aluno) => {
      return soma + (aluno.revisoes || 0);
    }, 0);

    let alunos = historico.map((aluno) => {
      let valor = parseFloat((aluno.nota || "0/1").split("/")[0]);

      return {
        nome: aluno.nome || "Sem nome",
        notaTexto: aluno.nota || "0/0",
        nota: valor,
        percentual: aluno.percentual || "",
        data: aluno.data || "",
        turma: aluno.turma || "Sem turma",
      };
    });

    alunos.sort((a, b) => b.nota - a.nota);

    let notas = alunos.map((a) => a.nota);

    let media = 0;
    let maior = 0;
    let menor = 0;

    if (notas.length > 0) {
      media = notas.reduce((a, b) => a + b, 0) / notas.length;

      maior = Math.max(...notas);
      menor = Math.min(...notas);
    }

    let alunosAtencao = "";

    alunos.forEach((aluno) => {
      const situacao = classificarMediaResumo(aluno.nota);

      if (situacao.codigo === "recuperacao" || situacao.codigo === "critico") {
        alunosAtencao += ` <div class="card" style=" border-left:8px solid ${situacao.cor}; text-align:left; "> <strong> ${situacao.codigo === "critico" ? "🚨" : "⚠️"} ${aluno.nome} </strong> <br><br> 📊 Nota: ${formatarNotaResumo(aluno.nota)} <br> 📌 Situação: ${situacao.texto} <br> 🏫 Turma: ${aluno.turma} </div> `;
      }
    });

    let ranking = "";

    alunos.forEach((aluno, index) => {
      ranking += ` <div> 🏆 ${index + 1}º - ${aluno.nome} — ${aluno.notaTexto} <br> 📚 ${aluno.turma} </div> <br> `;
    });

    let grafico = "";

    for (let nota = 10; nota >= 0; nota--) {
      let quantidade = notas.filter((n) => n === nota).length;

      if (quantidade > 0) {
        grafico += ` <div style="margin:8px 0;text-align:left;"> ${nota} <div style=" height:25px; background:#4A6CF7; width:${quantidade * 40}px; border-radius:10px; display:inline-block; margin-left:10px; color:white; padding-left:10px; line-height:25px; "> ${quantidade} </div> </div> `;
      }
    }

    let alunosDestaque = 0;
    let alunosCriticos = 0;
    let melhorMedia = 0;
    let melhorAluno = "-";

    alunos.forEach((aluno) => {
      const situacao = classificarMediaResumo(aluno.nota);

      if (situacao.codigo === "destaque") {
        alunosDestaque++;
      }

      if (situacao.codigo === "critico") {
        alunosCriticos++;
      }

      if (aluno.nota > melhorMedia) {
        melhorMedia = aluno.nota;
        melhorAluno = aluno.nome;
      }
    });

    document.getElementById("areaResumo").innerHTML = ` <div>👨‍🎓 Total corrigidas: ${total}</div> <br> <div>⚠ Revisões sugeridas: ${totalRevisoes}</div> <br> <div>📈 Média: ${formatarNotaResumo(media)}</div> <br> <div>🏆 Maior nota: ${maior}</div> <br> <div>📉 Menor nota: ${menor}</div> <br> <div>🥇 Melhor média: ${melhorAluno} (${formatarNotaResumo(melhorMedia)})</div> <br> <div> ⭐ Destaques: ${alunosDestaque} <br> <small> Média ${formatarNotaResumo( obterCriteriosAvaliacaoResumo().mediaDestaque )} ou mais </small> </div> <br> <div> 🚨 Situação crítica: ${alunosCriticos} <br> <small> Abaixo de ${formatarNotaResumo( obterCriteriosAvaliacaoResumo().limiteRecuperacao )} </small> </div> <br> <h2>🚨 Necessitam Atenção</h2> ${alunosAtencao || "<p>Nenhum aluno em recuperação ou situação crítica.</p>"} <br> <h2>🏆 Ranking</h2> ${ranking || "<p>Nenhum aluno corrigido ainda.</p>"} <h2>📊 Gráfico da Turma</h2> ${grafico || "<p>Sem dados ainda.</p>"} `;
  }

  filtro.onchange = function () {
    renderizarResumo();
  };

  renderizarResumo();
}