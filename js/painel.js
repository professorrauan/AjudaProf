async function garantirConfiguracoesPedagogicasPainel() {
  if (typeof carregarConfiguracoesPedagogicas !== "function") {
    return;
  }

  try {
    await carregarConfiguracoesPedagogicas();
  } catch (erro) {
    console.warn(
      "Não foi possível carregar os critérios pedagógicos no Painel:",
      erro
    );
  }
}

function obterCriteriosAvaliacaoPainel() {
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

function classificarMediaPainel(media) {
  if (typeof classificarMediaPedagogica === "function") {
    return classificarMediaPedagogica(media);
  }

  const numero = Number(media);

  if (!Number.isFinite(numero)) {
    return {
      codigo: "sem-media",
      texto: "Sem média",
      icone: "schedule",
      cor: "var(--primaria)",
    };
  }

  const criterios = obterCriteriosAvaliacaoPainel();

  if (numero >= criterios.mediaDestaque) {
    return {
      codigo: "destaque",
      texto: "Destaque",
      icone: "star",
      cor: "var(--info, var(--primaria))",
    };
  }

  if (numero >= criterios.mediaAprovacao) {
    return {
      codigo: "aprovado",
      texto: "Aprovado",
      icone: "check_circle",
      cor: "var(--sucesso)",
    };
  }

  if (numero >= criterios.limiteRecuperacao) {
    return {
      codigo: "recuperacao",
      texto: "Em recuperação",
      icone: "warning",
      cor: "var(--alerta)",
    };
  }

  return {
    codigo: "critico",
    texto: "Precisa de atenção",
    icone: "error",
    cor: "var(--erro)",
  };
}

function formatarNotaPainel(valor) {
  if (typeof formatarNotaPedagogica === "function") {
    return formatarNotaPedagogica(valor);
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "—";
  }

  return numero.toFixed(1).replace(".", ",");
}

async function carregarHistoricoPainel() {
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
    console.error("Erro ao carregar histórico para o Painel:", erro);

    return [];
  }
}

async function carregarTurmasPainel() {
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

function obterNotaNumericaPainel(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  let texto = String(valor).trim().replace(",", ".");

  if (texto.includes("/")) {
    texto = texto.split("/")[0];
  }

  const nota = parseFloat(texto);

  return Number.isFinite(nota) ? nota : null;
}

function normalizarNomePerfilAluno(nome) {
  return String(nome || "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function formatarDataPerfilAluno(valor) {
  if (!valor) {
    return "Data não informada";
  }

  let texto = String(valor).trim();

  let data;

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    let partes = texto.split("-");

    data = new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    );
  } else {
    data = new Date(texto);
  }

  if (Number.isNaN(data.getTime())) {
    return texto;
  }

  return data.toLocaleDateString("pt-BR");
}

async function abrirPerfilAluno(nomeAluno, turmaInformada = "") {
  await garantirConfiguracoesPedagogicasPainel();

  let nomeNormalizado = normalizarNomePerfilAluno(nomeAluno);

  if (!nomeNormalizado) {
    mostrarToast("Aluno não identificado.");

    return;
  }

  let historico = await carregarHistoricoPainel();

  let turmas = await carregarTurmasPainel();

  /* Os indicadores atuais usam exclusivamente avaliações que ainda existem nas turmas. O histórico completo permanece apenas para consulta e não interfere na média, índice, evolução ou situação pedagógica. */

  let registrosAtivos = [];
  let registrosHistoricos = [];
  let avaliacoesAtivas = new Set();

  function chaveAvaliacaoPerfil(turma, avaliacao) {
    return [
      normalizarNomePerfilAluno(turma),
      normalizarNomePerfilAluno(avaliacao),
    ].join("|");
  }

  /* ========================================================= AVALIAÇÕES ATIVAS — FONTE DOS INDICADORES ========================================================= */

  turmas.forEach((turma) => {
    let nomeTurma = turma.nome || turmaInformada || "Sem turma";

    if (
      turmaInformada &&
      normalizarNomePerfilAluno(nomeTurma) !==
        normalizarNomePerfilAluno(turmaInformada)
    ) {
      return;
    }

    let alunos = Array.isArray(turma.alunos) ? turma.alunos : [];

    let alunoEncontrado = alunos.some((aluno) => {
      let nomeLista =
        typeof aluno === "string" ? aluno : aluno.nome || aluno.nomeAluno || "";

      return normalizarNomePerfilAluno(nomeLista) === nomeNormalizado;
    });

    let avaliacoes = Array.isArray(turma.avaliacoes) ? turma.avaliacoes : [];

    avaliacoes.forEach((avaliacao, indexAvaliacao) => {
      let nomeAvaliacao = avaliacao.nome || `Avaliação ${indexAvaliacao + 1}`;

      avaliacoesAtivas.add(chaveAvaliacaoPerfil(nomeTurma, nomeAvaliacao));

      let notas =
        avaliacao.notas && typeof avaliacao.notas === "object"
          ? avaliacao.notas
          : {};

      let chaveAluno = Object.keys(notas).find((nomeNota) => {
        return normalizarNomePerfilAluno(nomeNota) === nomeNormalizado;
      });

      if (!chaveAluno) {
        return;
      }

      let nota = obterNotaNumericaPainel(notas[chaveAluno]);

      if (nota === null) {
        return;
      }

      registrosAtivos.push({
        nome: nomeAluno,

        turma: nomeTurma,

        avaliacao: nomeAvaliacao,

        nota: nota,

        valor: obterNotaNumericaPainel(avaliacao.valor) || 10,

        data:
          avaliacao.data || avaliacao.dataAplicacao || avaliacao.criadoEm || "",

        habilidadeBNCC:
          avaliacao.habilidadeBNCC || avaliacao.bncc || "Não informada",

        descritor: avaliacao.descritor || "Não informado",

        origem: "avaliacao",

        ativa: true,
      });
    });

    if (alunoEncontrado && !turmaInformada) {
      turmaInformada = nomeTurma;
    }
  });

  /* ========================================================= HISTÓRICO COMPLETO — SOMENTE CONSULTA ========================================================= */

  historico.forEach((item, index) => {
    let nomeRegistro = item.nome || item.aluno || item.nomeAluno || "";

    if (normalizarNomePerfilAluno(nomeRegistro) !== nomeNormalizado) {
      return;
    }

    let turmaRegistro = item.turma || turmaInformada || "Sem turma";

    if (
      turmaInformada &&
      normalizarNomePerfilAluno(turmaRegistro) !==
        normalizarNomePerfilAluno(turmaInformada)
    ) {
      return;
    }

    let nota = obterNotaNumericaPainel(item.nota);

    if (nota === null) {
      return;
    }

    let nomeAvaliacao =
      item.avaliacao ||
      item.nomeAvaliacao ||
      item.atividade ||
      item.titulo ||
      `Avaliação ${index + 1}`;

    let ativa = avaliacoesAtivas.has(
      chaveAvaliacaoPerfil(turmaRegistro, nomeAvaliacao)
    );

    registrosHistoricos.push({
      nome: nomeAluno,

      turma: turmaRegistro,

      avaliacao: nomeAvaliacao,

      nota: nota,

      valor:
        obterNotaNumericaPainel(item.valor || item.valorAvaliacao || 10) || 10,

      data:
        item.data || item.dataCorrecao || item.criadoEm || item.timestamp || "",

      habilidadeBNCC: item.habilidadeBNCC || item.bncc || "Não informada",

      descritor: item.descritor || "Não informado",

      origem: "historico",

      ativa: ativa,
    });
  });

  /* ========================================================= NORMALIZAÇÃO DOS REGISTROS ATIVOS ========================================================= */

  let registrosAtivosUnicos = [];
  let chavesAtivas = new Set();

  registrosAtivos.forEach((item) => {
    let chave = [
      normalizarNomePerfilAluno(item.nome),
      normalizarNomePerfilAluno(item.turma),
      normalizarNomePerfilAluno(item.avaliacao),
    ].join("|");

    if (chavesAtivas.has(chave)) {
      return;
    }

    chavesAtivas.add(chave);
    registrosAtivosUnicos.push(item);
  });

  registrosAtivos = registrosAtivosUnicos;

  registrosAtivos.sort((a, b) => {
    let dataA = a.data ? new Date(a.data).getTime() : 0;

    let dataB = b.data ? new Date(b.data).getTime() : 0;

    if (Number.isNaN(dataA) || Number.isNaN(dataB) || dataA === dataB) {
      return String(a.avaliacao).localeCompare(String(b.avaliacao), "pt-BR", {
        sensitivity: "base",
      });
    }

    return dataA - dataB;
  });

  /* ========================================================= NORMALIZAÇÃO DO HISTÓRICO EXIBIDO ========================================================= */

  let historicoExibicao = [];
  let chavesHistorico = new Set();

  registrosHistoricos.forEach((item) => {
    let chave = [
      normalizarNomePerfilAluno(item.nome),
      normalizarNomePerfilAluno(item.turma),
      normalizarNomePerfilAluno(item.avaliacao),
      item.nota,
      item.data,
    ].join("|");

    if (chavesHistorico.has(chave)) {
      return;
    }

    chavesHistorico.add(chave);
    historicoExibicao.push(item);
  });

  /* Inclui avaliações ativas que ainda não possuam registro correspondente no histórico. */

  registrosAtivos.forEach((item) => {
    let existeNoHistorico = historicoExibicao.some(
      (registro) =>
        normalizarNomePerfilAluno(registro.turma) ===
          normalizarNomePerfilAluno(item.turma) &&
        normalizarNomePerfilAluno(registro.avaliacao) ===
          normalizarNomePerfilAluno(item.avaliacao) &&
        Number(registro.nota) === Number(item.nota)
    );

    if (!existeNoHistorico) {
      historicoExibicao.push({
        ...item,
        origem: "avaliacao",
        ativa: true,
      });
    }
  });

  historicoExibicao.sort((a, b) => {
    let dataA = a.data ? new Date(a.data).getTime() : 0;

    let dataB = b.data ? new Date(b.data).getTime() : 0;

    if (Number.isNaN(dataA) || Number.isNaN(dataB) || dataA === dataB) {
      return 0;
    }

    return dataA - dataB;
  });

  /* ========================================================= INDICADORES ATUAIS ========================================================= */

  let turmaAluno =
    turmaInformada ||
    registrosAtivos.find((item) => item.turma)?.turma ||
    historicoExibicao.find((item) => item.turma)?.turma ||
    "Sem turma";

  let notasAtivas = registrosAtivos.map((item) => item.nota);

  let quantidadeAvaliacoes = notasAtivas.length;

  let media = quantidadeAvaliacoes
    ? notasAtivas.reduce((soma, nota) => soma + nota, 0) / quantidadeAvaliacoes
    : 0;

  let melhorNota = quantidadeAvaliacoes ? Math.max(...notasAtivas) : 0;

  let menorNota = quantidadeAvaliacoes ? Math.min(...notasAtivas) : 0;

  let situacao = "Sem dados";
  let iconeSituacao = "⚪";
  let corSituacao = "#64748B";

  if (quantidadeAvaliacoes) {
    const classificacao = classificarMediaPainel(media);

    situacao = classificacao.texto;

    corSituacao = classificacao.cor;

    iconeSituacao =
      classificacao.codigo === "destaque"
        ? "⭐"
        : classificacao.codigo === "aprovado"
        ? "✅"
        : classificacao.codigo === "recuperacao"
        ? "⚠️"
        : "🚨";
  }

  /* ========================================================= DESEMPENHO BNCC — SOMENTE AVALIAÇÕES ATIVAS ========================================================= */

  let desempenhoBNCC = {};

  registrosAtivos.forEach((item) => {
    let codigo = item.habilidadeBNCC || "Não informada";

    if (!desempenhoBNCC[codigo]) {
      desempenhoBNCC[codigo] = {
        soma: 0,
        quantidade: 0,
      };
    }

    desempenhoBNCC[codigo].soma += item.nota;

    desempenhoBNCC[codigo].quantidade++;
  });

  let listaBNCC = Object.keys(desempenhoBNCC)
    .map((codigo) => {
      let item = desempenhoBNCC[codigo];

      return {
        codigo: codigo,

        media: item.soma / item.quantidade,

        quantidade: item.quantidade,
      };
    })
    .sort((a, b) => b.media - a.media);

  /* ========================================================= EVOLUÇÃO — SOMENTE AVALIAÇÕES ATIVAS ========================================================= */

  let htmlEvolucao = "";

  registrosAtivos.forEach((item, index) => {
    let largura = Math.min(Math.max(item.nota * 10, 0), 100);

    let variacaoTexto = "Primeira avaliação ativa";
    let indicador = "➖";

    if (index > 0) {
      let diferenca = item.nota - registrosAtivos[index - 1].nota;

      if (diferenca > 0.05) {
        indicador = "📈";
        variacaoTexto = `Evolução de ${formatarNotaPainel(diferenca)} ponto(s)`;
      } else if (diferenca < -0.05) {
        indicador = "📉";
        variacaoTexto = `Queda de ${formatarNotaPainel( Math.abs(diferenca) )} ponto(s)`;
      } else {
        indicador = "➡️";
        variacaoTexto = "Desempenho estável";
      }
    }

    htmlEvolucao += ` <div style=" text-align:left; margin-bottom:20px; "> <div style=" display:flex; justify-content:space-between; align-items:flex-start; gap:12px; "> <div> <strong> ${item.avaliacao} </strong> <div style=" font-size:13px; opacity:0.72; margin-top:3px; "> ${formatarDataPerfilAluno(item.data)} </div> </div> <strong> ${formatarNotaPainel(item.nota)} </strong> </div> <div style=" height:22px; background:rgba(148,163,184,0.25); border-radius:999px; overflow:hidden; margin-top:8px; "> <div style=" height:100%; width:${largura}%; min-width:${item.nota > 0 ? "28px" : "0"}; background:#4A6CF7; border-radius:999px; color:#FFFFFF; font-size:12px; font-weight:700; line-height:22px; text-align:right; padding-right:7px; box-sizing:border-box; "> ${formatarNotaPainel(item.nota)} </div> </div> <div style=" font-size:13px; opacity:0.75; margin-top:6px; "> ${indicador} ${variacaoTexto} </div> </div> `;
  });

  /* ========================================================= BNCC ========================================================= */

  let htmlBNCC = "";

  listaBNCC.forEach((item) => {
    const classificacaoBNCC = classificarMediaPainel(item.media);

    let cor = classificacaoBNCC.cor;

    let icone =
      classificacaoBNCC.codigo === "destaque"
        ? "⭐"
        : classificacaoBNCC.codigo === "aprovado"
        ? "✅"
        : classificacaoBNCC.codigo === "recuperacao"
        ? "⚠️"
        : "🚨";

    htmlBNCC += ` <div style=" text-align:left; border-left:6px solid ${cor}; background:rgba(148,163,184,0.10); border-radius:12px; padding:14px; margin-bottom:12px; "> <strong> ${icone} ${item.codigo} </strong> <br> <span style="opacity:0.78;"> Média: ${formatarNotaPainel(item.media)} • ${item.quantidade} avaliação(ões) ativa(s) </span> </div> `;
  });

  /* ========================================================= HISTÓRICO COMPLETO — NÃO INFLUENCIA INDICADORES ========================================================= */

  let htmlHistorico = "";

  [...historicoExibicao].reverse().forEach((item) => {
    let avisoInativo = item.ativa
      ? ` <span style=" display:inline-block; margin-top:7px; padding:4px 8px; border-radius:999px; background:rgba(34,197,94,0.12); color:var(--sucesso); font-size:12px; font-weight:800; "> Avaliação ativa </span> `
      : ` <span style=" display:inline-block; margin-top:7px; padding:4px 8px; border-radius:999px; background:rgba(245,158,11,0.14); color:var(--alerta); font-size:12px; font-weight:800; "> Registro histórico — não entra no índice atual </span> `;

    htmlHistorico += ` <div style=" text-align:left; padding:14px 0; border-bottom:1px solid rgba(148,163,184,0.25); "> <div style=" display:flex; justify-content:space-between; gap:12px; "> <strong> ${item.avaliacao} </strong> <strong> ${formatarNotaPainel(item.nota)} </strong> </div> <div style=" font-size:13px; opacity:0.72; margin-top:5px; "> 📅 ${formatarDataPerfilAluno(item.data)} <br> 📚 ${item.turma} <br> 🎯 ${item.habilidadeBNCC} </div> ${avisoInativo} </div> `;
  });

  document.body.innerHTML =
    ` <div style=" max-width:900px; margin:0 auto; padding-bottom:100px; "> <div class="card" style=" text-align:left; border-left:8px solid ${corSituacao}; "> <div style=" display:flex; align-items:center; gap:14px; "> <div style=" width:62px; height:62px; border-radius:50%; background:rgba(74,108,247,0.15); display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; "> 👤 </div> <div style="min-width:0;"> <h1 style=" margin:0; font-size:25px; overflow-wrap:anywhere; "> ${nomeAluno} </h1> <p style=" margin:6px 0 0; opacity:0.75; "> 📚 ${turmaAluno} </p> </div> </div> <div style=" display:inline-flex; align-items:center; gap:6px; margin-top:16px; padding:8px 13px; border-radius:999px; background:${corSituacao}20; color:${corSituacao}; font-weight:800; "> ${iconeSituacao} ${situacao} </div> </div> <div style=" display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:18px; "> <div class="card"> <div style="font-size:25px;font-weight:800;"> ${quantidadeAvaliacoes ? formatarNotaPainel(media) : "—"} </div> <div style="opacity:0.72;"> Média atual </div> </div> <div class="card"> <div style="font-size:25px;font-weight:800;"> ${quantidadeAvaliacoes} </div> <div style="opacity:0.72;"> Avaliações ativas </div> </div> <div class="card"> <div style="font-size:25px;font-weight:800;"> ${quantidadeAvaliacoes ? formatarNotaPainel(melhorNota) : "—"} </div> <div style="opacity:0.72;"> Melhor nota atual </div> </div> <div class="card"> <div style="font-size:25px;font-weight:800;"> ${quantidadeAvaliacoes ? formatarNotaPainel(menorNota) : "—"} </div> <div style="opacity:0.72;"> Menor nota atual </div> </div> </div> <div class="card"> <h3>📈 Evolução das avaliações ativas</h3> <div id="evolucaoPerfilAluno"> ${htmlEvolucao || "Sem avaliações ativas com nota para este aluno."} </div> </div> <div class="card"> <h3>📚 Desempenho por BNCC</h3> <div> ${htmlBNCC || "Sem habilidades BNCC em avaliações ativas."} </div> </div> <div class="card"> <h3>📝 Histórico completo</h3> <p style=" text-align:left; opacity:0.78; line-height:1.5; "> Os registros antigos são preservados para consulta, mas somente as avaliações ativas participam da média, da evolução e da situação pedagógica atual. </p> <div> ${htmlHistorico || "Sem histórico de avaliações."} </div> </div> <div class="card"> <h3>📊 Análise pedagógica atual</h3> <p style=" text-align:left; line-height:1.6; "> ${ quantidadeAvaliacoes === 0 ? "Não existem avaliações ativas com nota suficientes para analisar o desempenho atual deste aluno." : classificarMediaPainel(media).codigo === "destaque" || classificarMediaPainel(media).codigo === "aprovado" ? `${nomeAluno} apresenta situação ${classificarMediaPainel( media ).texto.toLowerCase()}, com média atual ${formatarNotaPainel( media )}, calculada a partir de ${quantidadeAvaliacoes} avaliação(ões) ativa(s).` : classificarMediaPainel(media).codigo === "recuperacao" ? `${nomeAluno} está em recuperação, com média atual ${formatarNotaPainel( media )}, calculada a partir de ${quantidadeAvaliacoes} avaliação(ões) ativa(s). Recomenda-se revisar as habilidades com menor desempenho e planejar atividades de reforço.` : `${nomeAluno} apresenta média atual ${formatarNotaPainel( media )}, calculada a partir de ${quantidadeAvaliacoes} avaliação(ões) ativa(s), e necessita de acompanhamento prioritário.` } </p> </div> <div style=" display:grid; gap:10px; "> <button onclick="abrirPainelPedagogico()"> ⬅ Voltar ao Painel </button> </div> </div> ` + barraInferior();

  aplicarTemaSalvo();
}

async function abrirPainelPedagogico() {
  await garantirConfiguracoesPedagogicasPainel();

  let historico = await carregarHistoricoPainel();

  let turmasPainel = await carregarTurmasPainel();

  let registrosAvaliacoes = [];

  turmasPainel.forEach((turma) => {
    const avaliacoes = Array.isArray(turma.avaliacoes) ? turma.avaliacoes : [];

    avaliacoes.forEach((avaliacao) => {
      const notas =
        avaliacao.notas && typeof avaliacao.notas === "object"
          ? avaliacao.notas
          : {};

      Object.entries(notas).forEach(([nomeAluno, notaAluno]) => {
        const notaNumerica = obterNotaNumericaPainel(notaAluno);

        if (notaNumerica === null) {
          return;
        }

        registrosAvaliacoes.push({
          nome: nomeAluno,

          aluno: nomeAluno,

          nota: notaNumerica,

          turma: turma.nome || "Sem turma",

          avaliacao: avaliacao.nome || "Avaliação",

          habilidadeBNCC:
            avaliacao.habilidadeBNCC || avaliacao.bncc || "Não informada",

          descritor: avaliacao.descritor || "Não informado",

          origem: "avaliacao",
        });
      });
    });
  });

  let historicoCompleto = [...historico, ...registrosAvaliacoes];

  historico = [...historicoCompleto];

  let filtroTurmaSalvo = localStorage.getItem("filtroTurmaPainel") || "";

  if (filtroTurmaSalvo !== "") {
    historico = historico.filter((item) => {
      return (item.turma || "Sem turma") === filtroTurmaSalvo;
    });
  }

  let aprovados = 0;
  let recuperacao = 0;
  let abaixo = 0;

  historico.forEach((item) => {
    let nota = obterNotaNumericaPainel(item.nota);

    if (nota === null) {
      return;
    }

    const classificacao = classificarMediaPainel(nota);

    if (
      classificacao.codigo === "destaque" ||
      classificacao.codigo === "aprovado"
    ) {
      aprovados++;
    } else if (classificacao.codigo === "recuperacao") {
      recuperacao++;
    } else if (classificacao.codigo === "critico") {
      abaixo++;
    }
  });

  let contagemBNCC = {};

  historico.forEach((item) => {
    let codigo = item.habilidadeBNCC || "Não informada";

    contagemBNCC[codigo] = (contagemBNCC[codigo] || 0) + 1;
  });

  let dadosBNCC = Object.keys(contagemBNCC).map((codigo) => {
    return {
      nome: codigo,
      valor: contagemBNCC[codigo],
    };
  });

  let contagemDescritor = {};

  historico.forEach((item) => {
    let codigo = item.descritor || "Não informado";

    contagemDescritor[codigo] = (contagemDescritor[codigo] || 0) + 1;
  });

  let dadosDescritor = Object.keys(contagemDescritor).map((codigo) => {
    return {
      nome: codigo,
      valor: contagemDescritor[codigo],
    };
  });

  document.body.innerHTML =
    ` <h1>🥧 Painel Pedagógico</h1> <select id="filtroTurmaPainel"> <option value="">📚 Todas as turmas</option> </select> <br><br> <div class="card"> <h3>🧠 Inteligência Pedagógica</h3> <div id="insightsPedagogicos"> Gerando análise... </div> </div> <div class="card"> <h3>📊 Desempenho geral</h3> <canvas id="graficoPizza" width="300" height="300"></canvas> <p>🟢 Aprovados: ${aprovados}</p> <p>🟡 Recuperação: ${recuperacao}</p> <p>🔴 Abaixo de 5: ${abaixo}</p> </div> <div class="card"> <h3>📚 Avaliações por BNCC</h3> <canvas id="graficoBNCC" width="300" height="300"></canvas> <div id="legendaBNCC"></div> </div> <div class="card"> <h3>📊 Avaliações por descritor</h3> <canvas id="graficoDescritor" width="300" height="300"></canvas> <div id="legendaDescritor"></div> </div> <div class="card"> <h3>📊 Média por turma</h3> <div class="card"> <h3>📈 Evolução do desempenho</h3> <p style="opacity:0.75;"> Média obtida em cada avaliação. </p> <div id="evolucaoDesempenhoPainel"></div> </div> <div id="graficoTurmas"></div> </div> <div class="card"> <h3>📉 Habilidades com menor desempenho</h3> <div id="pioresBNCC"></div> </div> <div class="card"> <h3>🏆 Habilidades com melhor desempenho</h3> <div id="melhoresBNCC"></div> </div> <div class="card"> <h3>🚨 Alunos que precisam de atenção</h3> <div id="alunosAtencaoPainel"></div> </div> <button onclick="voltarHome()"> ⬅ Voltar </button> ` + barraInferior();

  aplicarTemaSalvo();

  let selectTurmaPainel = document.getElementById("filtroTurmaPainel");

  let turmasUnicas = [
    ...new Set(historicoCompleto.map((item) => item.turma || "Sem turma")),
  ].sort();

  turmasUnicas.forEach((turma) => {
    selectTurmaPainel.innerHTML += ` <option value="${turma}"> ${turma} </option> `;
  });

  let turmaSalva = localStorage.getItem("filtroTurmaPainel") || "";

  selectTurmaPainel.value = turmaSalva;

  selectTurmaPainel.onchange = function () {
    let turmaSelecionada = this.value;

    if (turmaSelecionada === "") {
      localStorage.removeItem("filtroTurmaPainel");
      abrirPainelPedagogico();
      return;
    }

    localStorage.setItem("filtroTurmaPainel", turmaSelecionada);

    abrirPainelPedagogico();
  };

  let canvas = document.getElementById("graficoPizza");
  let ctx = canvas.getContext("2d");

  let dados = [
    { nome: "Aprovados", valor: aprovados, cor: "#22C55E" },
    { nome: "Recuperação", valor: recuperacao, cor: "#F59E0B" },
    { nome: "Abaixo de 5", valor: abaixo, cor: "#EF4444" },
  ];

  let total = dados.reduce((soma, item) => soma + item.valor, 0);

  if (total === 0) {
    ctx.fillStyle = "#6B7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Sem dados ainda", 150, 150);
  } else {
    let inicio = 0;

    dados.forEach((item) => {
      let fatia = (item.valor / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.arc(150, 150, 110, inicio, inicio + fatia);
      ctx.closePath();
      ctx.fillStyle = item.cor;
      ctx.fill();

      inicio += fatia;
    });
  }

  desenharPizzaGenerica("graficoBNCC", dadosBNCC, "legendaBNCC");

  desenharPizzaGenerica("graficoDescritor", dadosDescritor, "legendaDescritor");

  let turmasMedia = {};

  historico.forEach((item) => {
    let turma = item.turma || "Sem turma";

    let nota = obterNotaNumericaPainel(item.nota);

    if (nota === null) {
      return;
    }

    if (!turmasMedia[turma]) {
      turmasMedia[turma] = {
        soma: 0,
        quantidade: 0,
      };
    }

    turmasMedia[turma].soma += nota;
    turmasMedia[turma].quantidade++;
  });

  let htmlTurmas = "";

  Object.keys(turmasMedia).forEach((turma) => {
    let media = turmasMedia[turma].soma / turmasMedia[turma].quantidade;

    let largura = Math.min(media * 10, 100);

    htmlTurmas += ` <div style="text-align:left;margin-bottom:16px;"> <strong>${turma}</strong> <br> <div style=" background:#E5E7EB; height:24px; border-radius:999px; overflow:hidden; margin-top:6px; "> <div style=" background:#4A6CF7; height:100%; width:${largura}%; color:white; font-size:13px; line-height:24px; padding-left:8px; "> ${formatarNotaPainel(media)} </div> </div> </div> `;
  });

  document.getElementById("graficoTurmas").innerHTML =
    htmlTurmas || "Sem dados por turma.";

  let desempenhoAvaliacoes = {};
  let ordemAvaliacoes = [];

  historico.forEach((item, index) => {
    let nota = obterNotaNumericaPainel(item.nota);

    if (nota === null) {
      return;
    }

    let nomeAvaliacao =
      item.avaliacao ||
      item.nomeAvaliacao ||
      item.atividade ||
      item.tituloAvaliacao ||
      `Avaliação ${index + 1}`;

    nomeAvaliacao = String(nomeAvaliacao).trim();

    if (!desempenhoAvaliacoes[nomeAvaliacao]) {
      desempenhoAvaliacoes[nomeAvaliacao] = {
        soma: 0,
        quantidade: 0,
      };

      ordemAvaliacoes.push(nomeAvaliacao);
    }

    desempenhoAvaliacoes[nomeAvaliacao].soma += nota;
    desempenhoAvaliacoes[nomeAvaliacao].quantidade++;
  });

  let dadosEvolucao = ordemAvaliacoes.map((nome) => {
    let registro = desempenhoAvaliacoes[nome];

    return {
      nome: nome,
      media: registro.soma / registro.quantidade,
      quantidade: registro.quantidade,
    };
  });

  let htmlEvolucao = "";

  dadosEvolucao.forEach((item, index) => {
    let mediaAnterior = index > 0 ? dadosEvolucao[index - 1].media : null;

    let variacao = mediaAnterior !== null ? item.media - mediaAnterior : 0;

    let indicador = "➖";
    let textoVariacao = "Primeiro registro";

    if (mediaAnterior !== null) {
      if (variacao > 0.05) {
        indicador = "📈";

        textoVariacao = `Aumento de ${variacao.toFixed(1)} ponto(s)`;
      } else if (variacao < -0.05) {
        indicador = "📉";

        textoVariacao = `Queda de ${Math.abs(variacao).toFixed(1)} ponto(s)`;
      } else {
        indicador = "➡️";
        textoVariacao = "Desempenho estável";
      }
    }

    let largura = Math.min(Math.max(item.media * 10, 0), 100);

    htmlEvolucao += ` <div style=" text-align:left; margin-bottom:20px; "> <div style=" display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:7px; "> <strong style=" overflow-wrap:anywhere; "> ${item.nome} </strong> <strong> ${formatarNotaPainel(item.media)} </strong> </div> <div style=" background:rgba(148,163,184,0.25); height:24px; border-radius:999px; overflow:hidden; "> <div style=" background:#4A6CF7; height:100%; width:${largura}%; min-width:${item.media > 0 ? "28px" : "0"}; border-radius:999px; color:#FFFFFF; font-size:12px; font-weight:700; line-height:24px; text-align:right; padding-right:8px; box-sizing:border-box; transition:width 0.3s ease; "> ${formatarNotaPainel(item.media)} </div> </div> <div style=" font-size:13px; opacity:0.75; margin-top:6px; "> ${indicador} ${textoVariacao} • ${item.quantidade} nota(s) </div> </div> `;
  });

  document.getElementById("evolucaoDesempenhoPainel").innerHTML =
    htmlEvolucao || "Sem avaliações suficientes para mostrar a evolução.";

  let desempenhoBNCC = {};

  historico.forEach((item) => {
    let codigo = item.habilidadeBNCC || "Não informada";

    let nota = obterNotaNumericaPainel(item.nota);

    if (nota === null) {
      return;
    }

    if (!desempenhoBNCC[codigo]) {
      desempenhoBNCC[codigo] = {
        soma: 0,
        quantidade: 0,
      };
    }

    desempenhoBNCC[codigo].soma += nota;
    desempenhoBNCC[codigo].quantidade++;
  });

  let listaBNCC = Object.keys(desempenhoBNCC).map((codigo) => {
    let item = desempenhoBNCC[codigo];

    return {
      codigo: codigo,
      media: item.soma / item.quantidade,
      quantidade: item.quantidade,
    };
  });

  listaBNCC.sort((a, b) => a.media - b.media);

  let htmlPiores = "";

  listaBNCC.slice(0, 5).forEach((item) => {
    htmlPiores += ` <div class="card" style="text-align:left;"> <strong>${item.codigo}</strong> <br> 📊 Média: ${formatarNotaPainel(item.media)} <br> 📝 Avaliações: ${item.quantidade} </div> `;
  });

  document.getElementById("pioresBNCC").innerHTML =
    htmlPiores || "Sem dados de habilidades ainda.";

  let htmlMelhores = "";

  let rankingMelhores = [...listaBNCC];

  rankingMelhores.sort((a, b) => b.media - a.media);

  rankingMelhores.slice(0, 5).forEach((item) => {
    htmlMelhores += ` <div class="card" style=" text-align:left; border-left:8px solid #22C55E; "> <strong>${item.codigo}</strong> <br> 📊 Média: ${formatarNotaPainel(item.media)} <br> 📝 Avaliações: ${item.quantidade} </div> `;
  });

  document.getElementById("melhoresBNCC").innerHTML =
    htmlMelhores || "Sem dados de habilidades ainda.";

  let desempenhoAlunos = {};

  historico.forEach((item) => {
    let nome = item.nome || "Sem nome";

    let nota = obterNotaNumericaPainel(item.nota);

    if (nota === null) {
      return;
    }

    if (!desempenhoAlunos[nome]) {
      desempenhoAlunos[nome] = {
        soma: 0,
        quantidade: 0,
      };
    }

    desempenhoAlunos[nome].soma += nota;
    desempenhoAlunos[nome].quantidade++;
  });

  let rankingAlunos = Object.keys(desempenhoAlunos).map((nome) => {
    let item = desempenhoAlunos[nome];

    return {
      nome: nome,
      media: item.soma / item.quantidade,
    };
  });

  rankingAlunos.sort((a, b) => a.media - b.media);

  let htmlAtencao = "";

  rankingAlunos
    .filter(
      (aluno) => aluno.media < obterCriteriosAvaliacaoPainel().mediaAprovacao
    )
    .slice(0, 10)
    .forEach((aluno) => {
      htmlAtencao += ` <div class="card" style=" text-align:left; border-left:8px solid #EF4444; "> <strong onclick=" abrirPerfilAluno( decodeURIComponent( '${encodeURIComponent(aluno.nome)}' ) ) " style=" cursor:pointer; color:#4A6CF7; text-decoration:underline; text-underline-offset:3px; " title="Abrir perfil do aluno" > ${aluno.nome} </strong> <br> 📉 Média: ${formatarNotaPainel(aluno.media)} </div> `;
    });

  document.getElementById("alunosAtencaoPainel").innerHTML =
    htmlAtencao || "✅ Nenhum aluno em situação de atenção.";

  let insights = [];

  // Situação geral
  if (aprovados > recuperacao + abaixo) {
    insights.push("✅ A maioria dos alunos está com desempenho satisfatório.");
  } else {
    insights.push("⚠️ A maioria dos alunos necessita de reforço.");
  }

  // Habilidade com menor média
  if (listaBNCC.length) {
    insights.push(
      `📉 A habilidade "${listaBNCC[0].codigo}" apresenta o menor desempenho da turma.`
    );
  }

  // Melhor habilidade
  if (rankingMelhores.length) {
    insights.push(
      `🏆 A habilidade "${rankingMelhores[0].codigo}" é o principal ponto forte dos alunos.`
    );
  }

  // Alunos em atenção
  let alunosRisco = rankingAlunos.filter(
    (aluno) => aluno.media < obterCriteriosAvaliacaoPainel().mediaAprovacao
  ).length;

  if (alunosRisco > 0) {
    insights.push(
      `🚨 ${alunosRisco} aluno(s) precisam de acompanhamento mais próximo.`
    );
  } else {
    insights.push(
      `🎉 Nenhum aluno apresenta média abaixo de ${formatarNotaPainel( obterCriteriosAvaliacaoPainel().mediaAprovacao )}.`
    );
  }

  // Melhor turma
  let melhorTurma = "";
  let melhorMedia = 0;

  Object.keys(turmasMedia).forEach((turma) => {
    let media = turmasMedia[turma].soma / turmasMedia[turma].quantidade;

    if (media > melhorMedia) {
      melhorMedia = media;
      melhorTurma = turma;
    }
  });

  if (melhorTurma) {
    insights.push(
      `🥇 A turma "${melhorTurma}" possui a melhor média geral (${formatarNotaPainel( melhorMedia )}).`
    );
  }

  document.getElementById("insightsPedagogicos").innerHTML = insights
    .map((texto) => `<p>${texto}</p>`)
    .join("");
}

function desenharPizzaGenerica(idCanvas, dados, idLegenda) {
  let canvas = document.getElementById(idCanvas);
  let ctx = canvas.getContext("2d");

  let total = dados.reduce((soma, item) => soma + item.valor, 0);

  let cores = [
    "#4A6CF7",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];

  if (total === 0) {
    ctx.fillStyle = "#6B7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Sem dados ainda", 150, 150);

    return;
  }

  let inicio = 0;
  let legenda = "";

  dados.forEach((item, index) => {
    let fatia = (item.valor / total) * Math.PI * 2;
    let cor = cores[index % cores.length];

    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 110, inicio, inicio + fatia);
    ctx.closePath();
    ctx.fillStyle = cor;
    ctx.fill();

    inicio += fatia;

    legenda += ` <p> <span style=" display:inline-block; width:14px; height:14px; background:${cor}; border-radius:50%; margin-right:6px; "></span> ${item.nome}: ${item.valor} </p> `;
  });

  document.getElementById(idLegenda).innerHTML = legenda;
}