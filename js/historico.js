/* ========================================================= AJUDA+PROF — HISTÓRICO INTELIGENTE Firestore como fonte principal + compatibilidade local ========================================================= */

let historicoAtualAjudaProf = [];
let buscaHistoricoAtual = "";
let filtroTurmaHistoricoAtual = "";

let cancelarEscutaHistoricoFirebase = null;
let uidEscutaHistoricoFirebase = null;
let cancelarEventosTelaHistorico = null;

function encerrarEscutaHistoricoFirebase() {
  if (typeof cancelarEscutaHistoricoFirebase === "function") {
    try {
      cancelarEscutaHistoricoFirebase();
    } catch (erro) {
      console.warn("Não foi possível encerrar a escuta do Histórico:", erro);
    }
  }

  cancelarEscutaHistoricoFirebase = null;
  uidEscutaHistoricoFirebase = null;

  if (typeof cancelarEventosTelaHistorico === "function") {
    cancelarEventosTelaHistorico();
  }

  cancelarEventosTelaHistorico = null;
}

window.encerrarEscutaHistoricoFirebase = encerrarEscutaHistoricoFirebase;

function escaparHTMLHistorico(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarHistorico(valor) {
  return String(valor ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function notaNumericaHistorico(registro) {
  const candidatos = [
    registro?.notaFinal,
    registro?.notaNumero,
    registro?.nota,
  ];

  for (const valor of candidatos) {
    if (valor === null || valor === undefined || valor === "") continue;

    const texto = String(valor).trim().replace(",", ".");

    const numero = parseFloat(
      texto.includes("/") ? texto.split("/")[0] : texto
    );

    if (Number.isFinite(numero)) return numero;
  }

  return null;
}

function formatarNotaHistorico(valor) {
  if (typeof formatarNotaPedagogica === "function") {
    return formatarNotaPedagogica(valor);
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero.toFixed(1).replace(".", ",") : "—";
}

function classificarNotaHistorico(valor) {
  if (typeof classificarMediaPedagogica === "function") {
    return classificarMediaPedagogica(valor);
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return {
      codigo: "sem-media",
      texto: "Sem média",
      cor: "var(--primaria)",
    };
  }

  if (numero >= 8) {
    return {
      codigo: "destaque",
      texto: "Destaque",
      cor: "var(--info, var(--primaria))",
    };
  }

  if (numero >= 6) {
    return {
      codigo: "aprovado",
      texto: "Aprovado",
      cor: "var(--sucesso)",
    };
  }

  if (numero >= 4) {
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

function dataOrdenacaoHistorico(registro) {
  if (registro?.criadoEm && typeof registro.criadoEm.toDate === "function") {
    return registro.criadoEm.toDate().getTime();
  }

  if (registro?.criadoEmISO) {
    const tempo = new Date(registro.criadoEmISO).getTime();
    if (!Number.isNaN(tempo)) return tempo;
  }

  const partes = String(registro?.data || "").split("/");

  if (partes.length === 3) {
    const [dia, mes, ano] = partes;
    const tempo = new Date(
      `${ano}-${mes}-${dia}T${registro?.hora || "00:00:00"}`
    ).getTime();

    if (!Number.isNaN(tempo)) return tempo;
  }

  return 0;
}

function idHistorico(registro, indice = 0) {
  if (registro?.id) return String(registro.id);

  return [
    normalizarHistorico(registro?.nome),
    normalizarHistorico(registro?.turma),
    normalizarHistorico(registro?.data),
    normalizarHistorico(registro?.hora),
    normalizarHistorico(registro?.nota),
    indice,
  ].join("|");
}

function obterChaveHistoricoLocalUsuario() {
  const usuario =
    window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

  if (!usuario?.uid) {
    return null;
  }

  return `ajudaprof_historico_local_${usuario.uid}`;
}

function lerHistoricoLocal() {
  const chave = obterChaveHistoricoLocalUsuario();

  if (!chave) {
    return [];
  }

  try {
    const dados = JSON.parse(localStorage.getItem(chave));

    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error("Erro ao ler histórico local do usuário:", erro);

    return [];
  }
}

function salvarHistoricoLocal(dados) {
  const chave = obterChaveHistoricoLocalUsuario();

  if (!chave) {
    return false;
  }

  try {
    localStorage.setItem(
      chave,
      JSON.stringify(Array.isArray(dados) ? dados : [])
    );

    return true;
  } catch (erro) {
    console.error("Erro ao salvar histórico local do usuário:", erro);

    return false;
  }
}

async function carregarHistoricoNuvem() {
  const usuario =
    window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

  if (!usuario) return [];

  if (
    !window.db ||
    !window.firebaseFirestore?.collection ||
    !window.firebaseFirestore?.getDocs
  ) {
    throw new Error("Leitura de coleções do Firestore indisponível.");
  }

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
      origemDados: "nuvem",
      possuiRegistroNuvem: true,
    });
  });

  return registros;
}

function converterSnapshotHistorico(snapshot) {
  const registros = [];

  snapshot.forEach((documento) => {
    registros.push({
      id: documento.id,
      ...documento.data(),
      origemDados: "nuvem",
      possuiRegistroNuvem: true,
    });
  });

  return registros;
}

function iniciarEscutaHistoricoFirebase() {
  const usuario =
    window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

  if (
    !usuario ||
    !window.db ||
    !window.firebaseFirestore?.collection ||
    !window.firebaseFirestore?.onSnapshot
  ) {
    return;
  }

  if (
    cancelarEscutaHistoricoFirebase &&
    uidEscutaHistoricoFirebase === usuario.uid
  ) {
    return;
  }

  encerrarEscutaHistoricoFirebase();

  const uidDaEscuta = usuario.uid;

  uidEscutaHistoricoFirebase = uidDaEscuta;

  const referencia = window.firebaseFirestore.collection(
    window.db,
    "usuarios",
    uidDaEscuta,
    "historico"
  );

  cancelarEscutaHistoricoFirebase = window.firebaseFirestore.onSnapshot(
    referencia,

    (snapshot) => {
      const usuarioAtual =
        window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

      if (
        !usuarioAtual ||
        usuarioAtual.uid !== uidDaEscuta ||
        uidEscutaHistoricoFirebase !== uidDaEscuta
      ) {
        return;
      }

      const nuvem = converterSnapshotHistorico(snapshot);

      const local = lerHistoricoLocal();

      historicoAtualAjudaProf = mesclarHistorico(nuvem, local);

      if (document.getElementById("listaHistorico")) {
        reconstruirOpcoesTurmasHistorico();
        renderizarHistorico();
      }

      window.dispatchEvent(
        new CustomEvent("historicoAtualizadoAjudaProf", {
          detail: {
            uid: uidDaEscuta,
            historico: [...historicoAtualAjudaProf],
            origem: snapshot.metadata?.fromCache ? "cache" : "tempo-real",
          },
        })
      );
    },

    (erro) => {
      const usuarioAtual =
        window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

      if (!usuarioAtual || usuarioAtual.uid !== uidDaEscuta) {
        return;
      }

      console.error("Erro na sincronização em tempo real do Histórico:", erro);

      if (typeof mostrarToast === "function") {
        mostrarToast(
          "❌ Não foi possível acompanhar o Histórico em tempo real."
        );
      }
    }
  );
}

function mesclarHistorico(nuvem, local) {
  const mapa = new Map();

  local.forEach((registro, indice) => {
    const id = idHistorico(registro, indice);

    mapa.set(id, {
      ...registro,
      id: registro.id || id,
      origemDados: "local",
      possuiRegistroNuvem: false,
    });
  });

  nuvem.forEach((registro, indice) => {
    const id = idHistorico(registro, indice);
    const copiaLocal = mapa.get(id);

    mapa.set(id, {
      ...(copiaLocal || {}),
      ...registro,
      id: registro.id || id,
      imagem:
        copiaLocal?.imagem || registro.imagem || registro.imagemURL || null,
      origemDados: "nuvem",
      possuiRegistroNuvem: true,
    });
  });

  return [...mapa.values()].sort(
    (a, b) => dataOrdenacaoHistorico(b) - dataOrdenacaoHistorico(a)
  );
}

async function carregarHistoricoCompleto() {
  const local = lerHistoricoLocal();
  let nuvem = [];

  try {
    nuvem = await carregarHistoricoNuvem();
  } catch (erro) {
    console.error("Erro ao carregar histórico da nuvem:", erro);

    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Nuvem indisponível. Exibindo registros deste aparelho.");
    }
  }

  return mesclarHistorico(nuvem, local);
}

function registrosFiltradosHistorico() {
  return historicoAtualAjudaProf.filter((registro) => {
    const combinaNome = normalizarHistorico(registro.nome).includes(
      buscaHistoricoAtual
    );

    const turma = registro.turma || "Sem turma";

    const combinaTurma =
      !filtroTurmaHistoricoAtual || turma === filtroTurmaHistoricoAtual;

    return combinaNome && combinaTurma;
  });
}

function htmlListaHistorico(registros) {
  if (!registros.length) {
    return ` <div class="card"> Nenhum registro encontrado. </div> `;
  }

  return registros
    .map((registro) => {
      const indice = historicoAtualAjudaProf.indexOf(registro);
      const nota = notaNumericaHistorico(registro);
      const situacao = classificarNotaHistorico(nota);

      return ` <button type="button" class="card textoEsquerda" onclick="verDetalhes(${indice})" style=" width:100%; border-left:8px solid ${ situacao.cor }; margin-bottom:14px; cursor:pointer; " > <div style=" display:flex; justify-content:space-between; gap:12px; "> <strong> 👨‍🎓 ${escaparHTMLHistorico( registro.nome || "Sem nome" )} </strong> <strong> ${ nota === null ? escaparHTMLHistorico(registro.nota || "—") : formatarNotaHistorico(nota) } </strong> </div> <div style="margin-top:8px;opacity:.78;"> 🏫 ${escaparHTMLHistorico( registro.turma || "Sem turma" )} <br> 📅 ${escaparHTMLHistorico( registro.data || "Data não informada" )} ${ registro.hora ? ` • ${escaparHTMLHistorico(registro.hora)}` : "" } <br> ⚠ Revisões: ${Number(registro.revisoes || 0)} <br> ${ registro.possuiRegistroNuvem ? "☁️ Nuvem" : "📱 Somente neste aparelho" } </div> </button> `;
    })
    .join("");
}

function htmlEstatisticasHistorico(registros) {
  if (!filtroTurmaHistoricoAtual) return "";

  const notas = registros.map(notaNumericaHistorico).filter(Number.isFinite);

  const media = notas.length
    ? notas.reduce((a, b) => a + b, 0) / notas.length
    : null;

  const maior = notas.length ? Math.max(...notas) : null;
  const menor = notas.length ? Math.min(...notas) : null;

  let aprovados = 0;
  let recuperacao = 0;
  let criticos = 0;
  let destaques = 0;

  notas.forEach((nota) => {
    const codigo = classificarNotaHistorico(nota).codigo;

    if (codigo === "destaque") {
      destaques++;
      aprovados++;
    } else if (codigo === "aprovado") {
      aprovados++;
    } else if (codigo === "recuperacao") {
      recuperacao++;
    } else if (codigo === "critico") {
      criticos++;
    }
  });

  return ` <div class="card textoEsquerda"> <h3> 📚 ${escaparHTMLHistorico( filtroTurmaHistoricoAtual )} </h3> <p>👨‍🎓 Correções: ${registros.length}</p> <p>📈 Média: ${ media === null ? "—" : formatarNotaHistorico(media) }</p> <p>⭐ Destaques: ${destaques}</p> <p>✅ Aprovados: ${aprovados}</p> <p>⚠ Em recuperação: ${recuperacao}</p> <p>🚨 Situação crítica: ${criticos}</p> <p>🏆 Maior nota: ${ maior === null ? "—" : formatarNotaHistorico(maior) }</p> <p>📉 Menor nota: ${ menor === null ? "—" : formatarNotaHistorico(menor) }</p> </div> `;
}

function reconstruirOpcoesTurmasHistorico() {
  const filtro = document.getElementById("filtroTurma");

  if (!filtro) {
    return;
  }

  const valorAtual = filtro.value || filtroTurmaHistoricoAtual;

  const turmas = [
    ...new Set(
      historicoAtualAjudaProf.map((registro) => registro.turma || "Sem turma")
    ),
  ].sort((a, b) =>
    a.localeCompare(b, "pt-BR", {
      sensitivity: "base",
    })
  );

  filtro.innerHTML =
    ` <option value=""> 📚 Todas as turmas </option> ` +
    turmas
      .map(
        (turma) => ` <option value="${escaparHTMLHistorico(turma)}" > ${escaparHTMLHistorico(turma)} </option> `
      )
      .join("");

  if ([...filtro.options].some((opcao) => opcao.value === valorAtual)) {
    filtro.value = valorAtual;
  } else {
    filtro.value = "";
    filtroTurmaHistoricoAtual = "";
  }
}

function renderizarHistorico() {
  const registros = registrosFiltradosHistorico();

  const lista = document.getElementById("listaHistorico");
  const estatisticas = document.getElementById("estatisticasTurmaHistorico");

  if (lista) lista.innerHTML = htmlListaHistorico(registros);

  if (estatisticas) {
    estatisticas.innerHTML = htmlEstatisticasHistorico(registros);
  }
}

async function abrirHistorico() {
  encerrarEscutaHistoricoFirebase();
  if (typeof carregarConfiguracoesPedagogicas === "function") {
    try {
      await carregarConfiguracoesPedagogicas();
    } catch (erro) {
      console.warn("Critérios pedagógicos não carregados no Histórico:", erro);
    }
  }

  document.body.innerHTML =
    ` <h1>👨‍🎓 Histórico</h1> <div class="card"> <span class="material-icons-round"> cloud_sync </span> Carregando histórico... </div> ` +
    barraInferior("historico");

  aplicarTemaSalvo();

  historicoAtualAjudaProf = await carregarHistoricoCompleto();

  document.body.innerHTML =
    ` <h1>👨‍🎓 Histórico</h1> <div class="card"> <input id="buscaHistorico" placeholder="🔍 Buscar aluno..." > <select id="filtroTurma"> <option value="">📚 Todas as turmas</option> </select> </div> <div id="estatisticasTurmaHistorico"></div> <div id="listaHistorico"></div> <div class="acoes"> <button onclick="exportarPDF()">📄 Exportar PDF</button> <button onclick="abrirHistorico()">🔄 Atualizar</button> <button onclick="voltarHome()">⬅ Voltar</button> </div> ` +
    barraInferior("historico");

  const busca = document.getElementById("buscaHistorico");

  const filtro = document.getElementById("filtroTurma");

  const controladorEventosHistorico = new AbortController();

  cancelarEventosTelaHistorico = function () {
    controladorEventosHistorico.abort();
  };

  busca.value = buscaHistoricoAtual;

  reconstruirOpcoesTurmasHistorico();

  filtro.value = filtroTurmaHistoricoAtual;

  busca.addEventListener(
    "input",
    () => {
      buscaHistoricoAtual = normalizarHistorico(busca.value);

      renderizarHistorico();
    },
    {
      signal: controladorEventosHistorico.signal,
    }
  );

  filtro.addEventListener(
    "change",
    () => {
      filtroTurmaHistoricoAtual = filtro.value;

      renderizarHistorico();
    },
    {
      signal: controladorEventosHistorico.signal,
    }
  );

  renderizarHistorico();

  iniciarEscutaHistoricoFirebase();

  aplicarTemaSalvo();
}

function verDetalhes(index) {
  const registro = historicoAtualAjudaProf[index];

  if (!registro) {
    if (typeof mostrarToast === "function") {
      mostrarToast("Registro não encontrado.");
    }

    return;
  }

  const nota = notaNumericaHistorico(registro);
  const situacao = classificarNotaHistorico(nota);
  const imagem = registro.imagem || registro.imagemURL || null;

  document.body.innerHTML =
    ` <div class="cabecalho"> <img src="./logo.png" style=" width:90px; display:block; margin:auto; margin-bottom:10px; box-shadow:none; " > <h1 style="color:white;margin:0;"> 👨‍🎓 Boletim do Aluno </h1> <p>Resultado detalhado da correção</p> </div> <div class="card textoEsquerda" style="border-left:8px solid ${ situacao.cor };" > <h2>${escaparHTMLHistorico( registro.nome || "Sem nome" )}</h2> <p>🏫 Turma: ${escaparHTMLHistorico( registro.turma || "Sem turma" )}</p> <p>📊 Nota: ${ nota === null ? escaparHTMLHistorico(registro.nota || "—") : formatarNotaHistorico(nota) }</p> <p>📌 Situação: ${escaparHTMLHistorico( situacao.texto )}</p> <p>📈 Percentual: ${escaparHTMLHistorico( registro.percentual || "Não informado" )}</p> <p>📅 Data: ${escaparHTMLHistorico(registro.data || "—")} ${ registro.hora ? `• ${escaparHTMLHistorico(registro.hora)}` : "" }</p> <p>⚠ Revisões: ${Number( registro.revisoes || 0 )}</p> <p>📚 Habilidade BNCC: ${escaparHTMLHistorico( registro.habilidadeBNCC || "Não informada" )}</p> <p>📊 Descritor: ${escaparHTMLHistorico( registro.descritor || "Não informado" )}</p> <p>${ registro.possuiRegistroNuvem ? "☁️ Dados salvos na nuvem" : "📱 Registro disponível somente neste aparelho" }</p> </div> <div class="card"> <h2>🖼 Prova Corrigida</h2> ${ imagem ? ` <img src="${escaparHTMLHistorico( imagem )}" style=" width:100%; max-width:320px; border-radius:20px; border:3px solid var(--borda); " > ` : "<p>Imagem não disponível neste aparelho.</p>" } </div> <div class="card textoEsquerda"> <h2>📝 Gabarito</h2> ${escaparHTMLHistorico( registro.gabarito || "Não salvo" )} </div> <div class="card textoEsquerda"> <h2>✅ Respostas Marcadas</h2> ${escaparHTMLHistorico( registro.respostas || "Não salvo" )} </div> <div class="card textoEsquerda"> <h2>🔍 Análise das Questões</h2> ${ registro.detalhes || "Detalhes não salvos" } </div> <button class="btnAzul" onclick="editarRegistroHistorico(${index})" > ✏️ Editar / Vincular avaliação </button> <button class="btnVermelho" onclick="excluirRegistro(${index})" > 🗑 Excluir Registro </button> <button onclick="abrirHistorico()"> ⬅ Voltar ao Histórico </button> ` +
    barraInferior("historico");

  aplicarTemaSalvo();
}

async function excluirRegistro(index) {
  const registro = historicoAtualAjudaProf[index];

  if (!registro) return;

  if (
    !confirm("Deseja excluir este registro? Essa ação não poderá ser desfeita.")
  ) {
    return;
  }

  try {
    const usuario =
      window.auth?.currentUser || window.usuarioAtualAjudaProf || null;

    if (registro.possuiRegistroNuvem && registro.id) {
      if (!usuario || !window.db || !window.firebaseFirestore) {
        throw new Error("Firestore indisponível.");
      }

      await window.firebaseFirestore.deleteDoc(
        window.firebaseFirestore.doc(
          window.db,
          "usuarios",
          usuario.uid,
          "historico",
          registro.id
        )
      );
    }

    const local = lerHistoricoLocal();

    const atualizado = local.filter((item, indice) => {
      return idHistorico(item, indice) !== String(registro.id);
    });

    salvarHistoricoLocal(atualizado);

    historicoAtualAjudaProf.splice(index, 1);

    if (typeof mostrarToast === "function") {
      mostrarToast("🗑 Registro excluído.");
    }

    await abrirHistorico();
  } catch (erro) {
    console.error("Erro ao excluir registro:", erro);

    if (typeof mostrarToast === "function") {
      mostrarToast("❌ Não foi possível excluir o registro.");
    }
  }
}

function exportarPDF() {
  const registros = registrosFiltradosHistorico();

  const notas = registros.map(notaNumericaHistorico).filter(Number.isFinite);

  const media = notas.length
    ? notas.reduce((a, b) => a + b, 0) / notas.length
    : null;

  const maior = notas.length ? Math.max(...notas) : null;
  const menor = notas.length ? Math.min(...notas) : null;

  const ranking = [...registros].sort((a, b) => {
    return (
      (notaNumericaHistorico(b) ?? -Infinity) -
      (notaNumericaHistorico(a) ?? -Infinity)
    );
  });

  const linhas = ranking
    .map((registro, index) => {
      const nota = notaNumericaHistorico(registro);

      return ` <tr> <td>${index + 1}º</td> <td>${escaparHTMLHistorico( registro.nome || "Sem nome" )}</td> <td>${escaparHTMLHistorico( registro.turma || "Sem turma" )}</td> <td>${ nota === null ? escaparHTMLHistorico(registro.nota || "—") : formatarNotaHistorico(nota) }</td> <td>${escaparHTMLHistorico( registro.percentual || "" )}</td> <td>${Number( registro.revisoes || 0 )}</td> <td>${escaparHTMLHistorico(registro.data || "—")}</td> </tr> `;
    })
    .join("");

  document.body.innerHTML = ` <div style=" background:white; color:#1F2937; padding:24px; font-family:Arial,sans-serif; "> <h1 style="color:#4A6CF7;"> Relatório Ajuda+Prof </h1> <h2> ${ filtroTurmaHistoricoAtual ? "Turma: " + escaparHTMLHistorico(filtroTurmaHistoricoAtual) : "Todas as turmas" } </h2> <p>Correções: ${registros.length}</p> <p>Média: ${ media === null ? "—" : formatarNotaHistorico(media) }</p> <p>Maior nota: ${ maior === null ? "—" : formatarNotaHistorico(maior) }</p> <p>Menor nota: ${ menor === null ? "—" : formatarNotaHistorico(menor) }</p> <table width="100%" cellpadding="8" style="border-collapse:collapse;" > <tr style="background:#4A6CF7;color:white;"> <th>Posição</th> <th>Aluno</th> <th>Turma</th> <th>Nota</th> <th>%</th> <th>Revisões</th> <th>Data</th> </tr> ${ linhas || ` <tr> <td colspan="7" style="text-align:center;"> Nenhum registro encontrado. </td> </tr> ` } </table> <br> <button onclick="window.print()"> 🖨 Imprimir / Salvar PDF </button> <button onclick="abrirHistorico()"> ⬅ Voltar ao Histórico </button> </div> `;
}


/* =========================================================
   HISTÓRICO — EDITAR / VINCULAR A UMA AVALIAÇÃO
   ========================================================= */

function normalizarVinculoHistorico(valor) {
  return String(valor ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function obterNotaEditavelHistorico(registro) {
  const candidatos = [
    registro?.notaFinal,
    registro?.notaNumero,
    registro?.nota
  ];

  for (const valor of candidatos) {
    if (valor === null || valor === undefined || valor === "") continue;

    const texto = String(valor)
      .trim()
      .replace(",", ".");

    const numero = parseFloat(
      texto.includes("/") ? texto.split("/")[0] : texto
    );

    if (Number.isFinite(numero)) return numero;
  }

  return "";
}

function chaveAvaliacaoVinculoHistorico(avaliacao, indice) {
  return avaliacao?.id
    ? "id:" + String(avaliacao.id)
    : "idx:" + String(indice);
}

function localizarAvaliacaoVinculoHistorico(turma, chave) {
  const avaliacoes = Array.isArray(turma?.avaliacoes)
    ? turma.avaliacoes
    : [];

  if (!chave) return null;

  if (String(chave).startsWith("id:")) {
    const id = String(chave).slice(3);

    const indice = avaliacoes.findIndex(
      (avaliacao) =>
        String(avaliacao?.id || "") === id
    );

    return indice >= 0
      ? { avaliacao: avaliacoes[indice], indice }
      : null;
  }

  if (String(chave).startsWith("idx:")) {
    const indice = Number(String(chave).slice(4));

    return Number.isInteger(indice) && avaliacoes[indice]
      ? { avaliacao: avaliacoes[indice], indice }
      : null;
  }

  return null;
}

async function editarRegistroHistorico(index) {
  index = Number(index);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= historicoAtualAjudaProf.length
  ) {
    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Registro não encontrado.");
    }
    return;
  }

  const registro = historicoAtualAjudaProf[index];

  let turmas = [];

  try {
    if (typeof carregarTurmasModuloFirebase === "function") {
      const atualizadas = await carregarTurmasModuloFirebase();

      if (Array.isArray(atualizadas)) {
        turmas = atualizadas;
      }
    }
  } catch (erro) {
    console.warn(
      "Não foi possível atualizar as turmas antes de editar o Histórico:",
      erro
    );
  }

  if (!turmas.length && typeof obterTurmasSalvas === "function") {
    const cache = obterTurmasSalvas();

    if (Array.isArray(cache)) {
      turmas = cache;
    }
  }

  if (!turmas.length) {
    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Nenhuma turma cadastrada foi encontrada.");
    }
    return;
  }

  const nomeTurmaRegistro = String(registro?.turma || "");

  const turmaInicial =
    turmas.find(
      (turma) =>
        normalizarVinculoHistorico(turma?.nome) ===
        normalizarVinculoHistorico(nomeTurmaRegistro)
    ) || turmas[0];

  const opcoesTurmas = turmas
    .map((turma) => {
      const nome = String(turma?.nome || "Turma sem nome");

      return `
        <option
          value="${escaparHTMLHistorico(nome)}"
          ${
            turma?.nome === turmaInicial?.nome
              ? "selected"
              : ""
          }
        >
          ${escaparHTMLHistorico(nome)}
        </option>
      `;
    })
    .join("");

  const notaAtual = obterNotaEditavelHistorico(registro);

  document.body.innerHTML = `
    <div class="cabecalhoTela">
      <div>
        <h1>✏️ Editar registro</h1>
        <p>
          Vincule uma correção antiga a uma avaliação cadastrada.
        </p>
      </div>
    </div>

    <main class="secaoApp">
      <section class="card textoEsquerda">
        <h2>👨‍🎓 ${escaparHTMLHistorico(registro?.nome || "Aluno")}</h2>

        <div class="grupoCampo">
          <label for="historicoEditarTurma">
            Turma
          </label>

          <select id="historicoEditarTurma">
            ${opcoesTurmas}
          </select>
        </div>

        <div class="grupoCampo">
          <label for="historicoEditarAvaliacao">
            Avaliação
          </label>

          <select id="historicoEditarAvaliacao">
            <option value="">Selecione a avaliação</option>
          </select>

          <small
            id="historicoEditarAjuda"
            style="display:block;margin-top:7px;opacity:.76;"
          >
            Selecione a avaliação correspondente à prova corrigida.
          </small>
        </div>

        <div class="grupoCampo">
          <label for="historicoEditarNota">
            Nota
          </label>

          <input
            id="historicoEditarNota"
            type="number"
            min="0"
            step="0.1"
            inputmode="decimal"
            value="${escaparHTMLHistorico(notaAtual)}"
          >
        </div>

        <div
          id="historicoEditarAviso"
          style="margin:12px 0;"
        ></div>

        <div class="acoes">
          <button
            type="button"
            class="btnAzul"
            id="historicoSalvarEdicao"
          >
            <span class="material-icons-round">save</span>
            Salvar e lançar nota
          </button>

          <button
            type="button"
            onclick="verDetalhes(${index})"
          >
            <span class="material-icons-round">arrow_back</span>
            Cancelar
          </button>
        </div>
      </section>
    </main>
  ` +
  (
    typeof barraInferior === "function"
      ? barraInferior()
      : ""
  );

  if (typeof aplicarTemaSalvo === "function") {
    aplicarTemaSalvo();
  }

  const campoTurma =
    document.getElementById("historicoEditarTurma");

  const campoAvaliacao =
    document.getElementById("historicoEditarAvaliacao");

  const campoNota =
    document.getElementById("historicoEditarNota");

  const aviso =
    document.getElementById("historicoEditarAviso");

  const ajuda =
    document.getElementById("historicoEditarAjuda");

  function turmaSelecionadaAtual() {
    return turmas.find(
      (turma) =>
        normalizarVinculoHistorico(turma?.nome) ===
        normalizarVinculoHistorico(campoTurma.value)
    ) || null;
  }

  function atualizarAvisoNotaExistente() {
    aviso.innerHTML = "";

    const turma = turmaSelecionadaAtual();

    const encontrada =
      localizarAvaliacaoVinculoHistorico(
        turma,
        campoAvaliacao.value
      );

    if (!encontrada?.avaliacao) return;

    const notas =
      encontrada.avaliacao.notas &&
      typeof encontrada.avaliacao.notas === "object"
        ? encontrada.avaliacao.notas
        : {};

    const nomeExistente = Object.keys(notas).find(
      (nome) =>
        normalizarVinculoHistorico(nome) ===
        normalizarVinculoHistorico(registro?.nome)
    );

    if (nomeExistente) {
      aviso.innerHTML = `
        <div
          style="
            padding:12px;
            border-radius:12px;
            background:rgba(245,158,11,.12);
          "
        >
          ⚠️ Já existe nota para este aluno nesta avaliação:
          <strong>
            ${escaparHTMLHistorico(notas[nomeExistente])}
          </strong>.
          Ao salvar, ela será substituída pela nota deste registro.
        </div>
      `;
    }
  }

  function preencherAvaliacoes() {
    const turma = turmaSelecionadaAtual();

    const avaliacoes = Array.isArray(turma?.avaliacoes)
      ? turma.avaliacoes
      : [];

    campoAvaliacao.innerHTML =
      '<option value="">Selecione a avaliação</option>';

    avaliacoes.forEach((avaliacao, indice) => {
      const option = document.createElement("option");

      option.value =
        chaveAvaliacaoVinculoHistorico(
          avaliacao,
          indice
        );

      const valor = Number(avaliacao?.valor);

      option.textContent = [
        avaliacao?.nome || "Avaliação sem nome",
        avaliacao?.bimestre || "",
        Number.isFinite(valor)
          ? "Valor " +
            valor.toLocaleString("pt-BR", {
              maximumFractionDigits: 2
            })
          : ""
      ]
        .filter(Boolean)
        .join(" • ");

      campoAvaliacao.appendChild(option);
    });

    let chaveInicial = "";

    if (registro?.avaliacaoId) {
      chaveInicial =
        "id:" + String(registro.avaliacaoId);
    } else if (
      registro?.avaliacaoNome ||
      registro?.avaliacaoBimestre
    ) {
      const indiceCompat = avaliacoes.findIndex(
        (avaliacao) =>
          normalizarVinculoHistorico(avaliacao?.nome) ===
            normalizarVinculoHistorico(registro?.avaliacaoNome) &&
          normalizarVinculoHistorico(avaliacao?.bimestre) ===
            normalizarVinculoHistorico(registro?.avaliacaoBimestre)
      );

      if (indiceCompat >= 0) {
        chaveInicial =
          chaveAvaliacaoVinculoHistorico(
            avaliacoes[indiceCompat],
            indiceCompat
          );
      }
    }

    if (
      chaveInicial &&
      [...campoAvaliacao.options].some(
        (option) => option.value === chaveInicial
      )
    ) {
      campoAvaliacao.value = chaveInicial;
    } else if (avaliacoes.length === 1) {
      campoAvaliacao.value =
        chaveAvaliacaoVinculoHistorico(
          avaliacoes[0],
          0
        );
    }

    ajuda.textContent =
      avaliacoes.length
        ? "Escolha a avaliação em que esta nota deve aparecer."
        : "Esta turma ainda não possui avaliações cadastradas.";

    atualizarAvisoNotaExistente();
  }

  campoTurma.addEventListener(
    "change",
    preencherAvaliacoes
  );

  campoAvaliacao.addEventListener(
    "change",
    atualizarAvisoNotaExistente
  );

  preencherAvaliacoes();

  document
    .getElementById("historicoSalvarEdicao")
    .addEventListener("click", async () => {
      const turma = turmaSelecionadaAtual();

      const encontrada =
        localizarAvaliacaoVinculoHistorico(
          turma,
          campoAvaliacao.value
        );

      const nota = Number(campoNota.value);

      if (!turma) {
        if (typeof mostrarToast === "function") {
          mostrarToast("⚠️ Selecione uma turma.");
        }
        return;
      }

      if (!encontrada?.avaliacao) {
        if (typeof mostrarToast === "function") {
          mostrarToast("⚠️ Selecione uma avaliação.");
        }
        campoAvaliacao.focus();
        return;
      }

      const valorAvaliacao =
        Number(encontrada.avaliacao.valor);

      if (
        !Number.isFinite(nota) ||
        nota < 0 ||
        (
          Number.isFinite(valorAvaliacao) &&
          valorAvaliacao > 0 &&
          nota > valorAvaliacao
        )
      ) {
        if (typeof mostrarToast === "function") {
          mostrarToast(
            "⚠️ Informe uma nota válida para esta avaliação."
          );
        }
        campoNota.focus();
        return;
      }

      const botao =
        document.getElementById("historicoSalvarEdicao");

      botao.disabled = true;
      botao.innerHTML =
        '<span class="material-icons-round">cloud_upload</span> Salvando...';

      try {
        const usuario =
          window.auth?.currentUser ||
          window.usuarioAtualAjudaProf ||
          null;

        if (
          !usuario?.uid ||
          !window.db ||
          !window.firebaseFirestore?.doc ||
          !window.firebaseFirestore?.getDoc ||
          !window.firebaseFirestore?.setDoc
        ) {
          throw new Error(
            "Firebase não está disponível."
          );
        }

        const {
          doc,
          getDoc,
          setDoc,
          serverTimestamp
        } = window.firebaseFirestore;

        /*
         * Atualiza a fonte oficial do Livro de Notas e do Boletim:
         * usuarios/{uid}/dados/turmas -> avaliacao.notas[aluno]
         */
        const refTurmas = doc(
          window.db,
          "usuarios",
          usuario.uid,
          "dados",
          "turmas"
        );

        const snapshotTurmas = await getDoc(refTurmas);

        if (!snapshotTurmas.exists()) {
          throw new Error(
            "Documento de turmas não encontrado."
          );
        }

        const dadosTurmas =
          snapshotTurmas.data() || {};

        const listaNuvem =
          Array.isArray(dadosTurmas.itens)
            ? JSON.parse(
                JSON.stringify(dadosTurmas.itens)
              )
            : [];

        const indiceTurma = listaNuvem.findIndex(
          (item) =>
            normalizarVinculoHistorico(item?.nome) ===
            normalizarVinculoHistorico(turma.nome)
        );

        if (indiceTurma < 0) {
          throw new Error("Turma não encontrada.");
        }

        const turmaNuvem = listaNuvem[indiceTurma];

        if (!Array.isArray(turmaNuvem.avaliacoes)) {
          turmaNuvem.avaliacoes = [];
        }

        let indiceAvaliacao = -1;

        if (encontrada.avaliacao?.id) {
          indiceAvaliacao =
            turmaNuvem.avaliacoes.findIndex(
              (avaliacao) =>
                String(avaliacao?.id || "") ===
                String(encontrada.avaliacao.id)
            );
        }

        if (indiceAvaliacao < 0) {
          indiceAvaliacao =
            turmaNuvem.avaliacoes.findIndex(
              (avaliacao) =>
                normalizarVinculoHistorico(avaliacao?.nome) ===
                  normalizarVinculoHistorico(
                    encontrada.avaliacao?.nome
                  ) &&
                normalizarVinculoHistorico(avaliacao?.bimestre) ===
                  normalizarVinculoHistorico(
                    encontrada.avaliacao?.bimestre
                  )
            );
        }

        if (indiceAvaliacao < 0) {
          throw new Error(
            "Avaliação não encontrada."
          );
        }

        const avaliacaoNuvem =
          turmaNuvem.avaliacoes[indiceAvaliacao];

        if (
          !avaliacaoNuvem.notas ||
          typeof avaliacaoNuvem.notas !== "object" ||
          Array.isArray(avaliacaoNuvem.notas)
        ) {
          avaliacaoNuvem.notas = {};
        }

        const nomeAlunoExistente =
          Object.keys(avaliacaoNuvem.notas).find(
            (nome) =>
              normalizarVinculoHistorico(nome) ===
              normalizarVinculoHistorico(registro?.nome)
          );

        const chaveAluno =
          nomeAlunoExistente ||
          String(registro?.nome || "Aluno");

        avaliacaoNuvem.notas[chaveAluno] =
          Number(nota.toFixed(2));

        turmaNuvem.avaliacoes[indiceAvaliacao] =
          avaliacaoNuvem;

        listaNuvem[indiceTurma] =
          turmaNuvem;

        await setDoc(
          refTurmas,
          {
            itens: listaNuvem,
            atualizadoEm: serverTimestamp()
          },
          { merge: true }
        );

        /*
         * Atualiza o próprio registro do Histórico, para que ele fique
         * definitivamente vinculado à avaliação escolhida.
         */
        const atualizacaoHistorico = {
          turma: turma.nome,
          nota: Number(nota.toFixed(2)),
          notaFinal: Number(nota.toFixed(2)),
          valorProva:
            Number.isFinite(valorAvaliacao)
              ? valorAvaliacao
              : registro?.valorProva || null,
          avaliacaoId:
            avaliacaoNuvem.id || null,
          avaliacaoNome:
            avaliacaoNuvem.nome || "",
          avaliacaoBimestre:
            avaliacaoNuvem.bimestre || "",
          avaliacaoTipo:
            avaliacaoNuvem.tipo || "prova",
          notaLancadaNaAvaliacao: true,
          atualizadoEm: serverTimestamp()
        };

        if (registro?.id) {
          const refHistorico = doc(
            window.db,
            "usuarios",
            usuario.uid,
            "historico",
            String(registro.id)
          );

          await setDoc(
            refHistorico,
            atualizacaoHistorico,
            { merge: true }
          );
        }

        /*
         * Mantém o cache local da imagem coerente com a edição.
         */
        const chaveLocal =
          `ajudaprof_historico_local_${usuario.uid}`;

        try {
          const local = JSON.parse(
            localStorage.getItem(chaveLocal) || "[]"
          );

          if (Array.isArray(local)) {
            const indiceLocal = local.findIndex(
              (item) =>
                String(item?.id || "") ===
                String(registro?.id || "")
            );

            if (indiceLocal >= 0) {
              local[indiceLocal] = {
                ...local[indiceLocal],
                ...atualizacaoHistorico
              };

              localStorage.setItem(
                chaveLocal,
                JSON.stringify(local)
              );
            }
          }
        } catch (erroLocal) {
          console.warn(
            "Não foi possível atualizar o cache local do Histórico:",
            erroLocal
          );
        }

        try {
          if (
            typeof carregarTurmasModuloFirebase === "function"
          ) {
            await carregarTurmasModuloFirebase();
          }
        } catch (erroCache) {
          console.warn(
            "Nota salva, mas o cache de turmas será atualizado depois:",
            erroCache
          );
        }

        if (typeof mostrarToast === "function") {
          mostrarToast(
            "✅ Registro vinculado e nota lançada na avaliação."
          );
        }

        await abrirHistorico();
      } catch (erro) {
        console.error(
          "Erro ao editar/vincular registro do Histórico:",
          erro
        );

        if (typeof mostrarToast === "function") {
          mostrarToast(
            "❌ Não foi possível salvar a vinculação."
          );
        } else {
          alert(
            "Não foi possível salvar: " +
            (erro?.message || "")
          );
        }

        botao.disabled = false;
        botao.innerHTML =
          '<span class="material-icons-round">save</span> Salvar e lançar nota';
      }
    });
}

window.editarRegistroHistorico =
  editarRegistroHistorico;

