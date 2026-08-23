let baseBNCC = [];
let baseDescritores = [];

let bancoBNCC = [];

async function carregarBases() {
  let resultado = {
    bnccCarregada: false,

    descritoresCarregados: false,

    erros: [],
  };

  function extrairListaBase(conteudo, possiveisChaves = []) {
    if (Array.isArray(conteudo)) {
      return conteudo;
    }

    if (!conteudo || typeof conteudo !== "object") {
      return [];
    }

    for (let chave of possiveisChaves) {
      if (Array.isArray(conteudo[chave])) {
        return conteudo[chave];
      }
    }

    return [];
  }

  function normalizarTexto(valor) {
    return String(valor ?? "").trim();
  }

  function prepararBNCC(listaOriginal) {
    if (!Array.isArray(listaOriginal)) {
      return {
        lista: [],
        duplicados: [],
        invalidos: 0,
      };
    }

    function normalizarAnoBNCC(valor) {
      const texto = String(valor ?? "")
        .trim()
        .replace(/\s+/g, " ");

      if (!texto) {
        return "";
      }

      const semAcento = texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR");

      if (
        semAcento.includes("ensino medio") ||
        semAcento === "medio"
      ) {
        return "Ensino Médio";
      }

      const numero = semAcento.match(/(?:^|\D)([1-9])(?:\D|$)/);

      if (numero) {
        return `${numero[1]}º Ano`;
      }

      return texto;
    }

    function inferirAnosPeloCodigo(codigo) {
      const match = String(codigo || "").match(/^EF(\d{2})/);

      if (!match) {
        return [];
      }

      const faixa = match[1];

      const mapa = {
        "12": [1, 2],
        "15": [1, 2, 3, 4, 5],
        "35": [3, 4, 5],
        "67": [6, 7],
        "69": [6, 7, 8, 9],
        "89": [8, 9],
      };

      if (mapa[faixa]) {
        return mapa[faixa].map((ano) => `${ano}º Ano`);
      }

      if (/^([1-9])\1$/.test(faixa)) {
        return [`${faixa[0]}º Ano`];
      }

      return [];
    }

    let codigosEncontrados = new Set();
    let duplicados = new Set();
    let invalidos = 0;
    let lista = [];

    listaOriginal.forEach((item) => {
      if (!item || typeof item !== "object") {
        invalidos++;
        return;
      }

      let codigo = normalizarTexto(item.codigo)
        .replace(/\s+/g, "")
        .toUpperCase();

      if (codigo === "") {
        invalidos++;
        return;
      }

      if (codigosEncontrados.has(codigo)) {
        duplicados.add(codigo);
        return;
      }

      codigosEncontrados.add(codigo);

      let anos = [];

      if (Array.isArray(item.anos)) {
        anos = item.anos
          .map(normalizarAnoBNCC)
          .filter(Boolean);
      } else if (item.ano) {
        anos = [normalizarAnoBNCC(item.ano)].filter(Boolean);
      }

      const anosInferidos = inferirAnosPeloCodigo(codigo);

      /*
       * Para códigos EF12, EF15, EF35, EF67, EF69 e EF89,
       * garante que o filtro represente todos os anos abrangidos
       * pelo próprio código, mesmo que a base venha com um rótulo
       * de faixa em vez de anos separados.
       */
      if (anosInferidos.length > 1) {
        anos = [
          ...new Set([
            ...anos,
            ...anosInferidos,
          ]),
        ];
      } else if (anos.length === 0 && anosInferidos.length) {
        anos = anosInferidos;
      }

      lista.push({
        ...item,
        codigo: codigo,
        disciplina: normalizarTexto(
          item.disciplina || item.componente || item.area || ""
        ),
        anos: anos,
        ano: normalizarTexto(item.ano || ""),
        habilidade: normalizarTexto(
          item.habilidade || item.descricao || item.texto || ""
        ),
        descricao: normalizarTexto(
          item.descricao || item.habilidade || item.texto || ""
        ),
      });
    });

    return {
      lista: lista,
      duplicados: [...duplicados],
      invalidos: invalidos,
    };
  }

  function prepararDescritores(listaOriginal) {
    if (!Array.isArray(listaOriginal)) {
      return {
        lista: [],

        duplicados: [],

        invalidos: 0,
      };
    }

    let codigosEncontrados = new Set();

    let duplicados = new Set();

    let invalidos = 0;

    let lista = [];

    listaOriginal.forEach((item) => {
      if (!item || typeof item !== "object") {
        invalidos++;

        return;
      }

      let codigo = normalizarTexto(
        item.codigo || item.codigoOriginal
      ).toUpperCase();

      if (codigo === "") {
        invalidos++;

        return;
      }

      if (codigosEncontrados.has(codigo)) {
        duplicados.add(codigo);

        return;
      }

      codigosEncontrados.add(codigo);

      lista.push({
        ...item,

        codigo: codigo,

        codigoOriginal: normalizarTexto(item.codigoOriginal || item.codigo),

        area: normalizarTexto(item.area || item.disciplina || ""),

        ano: normalizarTexto(item.ano || ""),

        descricao: normalizarTexto(
          item.descricao || item.habilidade || item.texto || ""
        ),
      });
    });

    return {
      lista: lista,

      duplicados: [...duplicados],

      invalidos: invalidos,
    };
  }

  /* CARREGAMENTO DA BNCC */

  try {
    let respostaBNCC = await fetch("dados/bncc.json", {
      cache: "no-store",
    });

    if (!respostaBNCC.ok) {
      throw new Error(
        `Erro HTTP ${respostaBNCC.status} ao carregar bncc.json.`
      );
    }

    let conteudoBNCC = await respostaBNCC.json();

    baseBNCC = conteudoBNCC;

    let listaBNCC = extrairListaBase(conteudoBNCC, [
      "habilidades",
      "bncc",
      "dados",
      "itens",
    ]);

    if (listaBNCC.length === 0) {
      throw new Error(
        "O bncc.json não contém uma lista de habilidades reconhecida."
      );
    }

    let preparacaoBNCC = prepararBNCC(listaBNCC);

    bancoBNCC = preparacaoBNCC.lista;

    resultado.bnccCarregada = bancoBNCC.length > 0;

    console.log(`✅ BNCC carregada: ${bancoBNCC.length} habilidade(s).`);

    if (preparacaoBNCC.duplicados.length > 0) {
      console.warn(
        "⚠️ Códigos BNCC duplicados removidos:",
        preparacaoBNCC.duplicados
      );
    }

    if (preparacaoBNCC.invalidos > 0) {
      console.warn(
        `⚠️ ${preparacaoBNCC.invalidos} registro(s) inválido(s) foram ignorados na BNCC.`
      );
    }
  } catch (erro) {
    baseBNCC = [];
    bancoBNCC = [];

    resultado.erros.push("BNCC: " + erro.message);

    console.error("❌ ao carregar a BNCC:", erro);
  }

  /* CARREGAMENTO DOS DESCRITORES É separado da BNCC para que uma base possa funcionar mesmo que a outra apresente. */

  try {
    let respostaDescritores = await fetch("dados/descritores.json", {
      cache: "no-store",
    });

    if (!respostaDescritores.ok) {
      throw new Error(
        `Erro HTTP ${respostaDescritores.status} ao carregar descritores.json.`
      );
    }

    let conteudoDescritores = await respostaDescritores.json();

    let listaDescritores = extrairListaBase(conteudoDescritores, [
      "descritores",
      "dados",
      "itens",
    ]);

    if (listaDescritores.length === 0) {
      throw new Error("O descritores.json não contém uma lista reconhecida.");
    }

    let preparacaoDescritores = prepararDescritores(listaDescritores);

    baseDescritores = preparacaoDescritores.lista;

    resultado.descritoresCarregados = baseDescritores.length > 0;

    console.log(
      `✅ Descritores carregados: ${baseDescritores.length} registro(s).`
    );

    if (preparacaoDescritores.duplicados.length > 0) {
      console.warn(
        "⚠️ Descritores duplicados removidos:",
        preparacaoDescritores.duplicados
      );
    }

    if (preparacaoDescritores.invalidos > 0) {
      console.warn(
        `⚠️ ${preparacaoDescritores.invalidos} registro(s) inválido(s) foram ignorados nos descritores.`
      );
    }
  } catch (erro) {
    baseDescritores = [];

    resultado.erros.push("Descritores: " + erro.message);

    console.error("❌ ao carregar os descritores:", erro);
  }

  window.statusBasesAjudaProf = resultado;

  window.baseBNCC = baseBNCC;
  window.baseDescritores = baseDescritores;
  window.bancoBNCC = bancoBNCC;

  return resultado;
}

async function abrirBNCC() {
  /*
   * Garante que a Biblioteca nunca seja aberta antes do término
   * do carregamento da base.
   */
  if (!Array.isArray(bancoBNCC) || bancoBNCC.length === 0) {
    try {
      await carregarBases();
    } catch (erro) {
      console.error("Falha ao preparar a Biblioteca BNCC:", erro);
    }
  }

  document.body.innerHTML =
    ` <h1>📚 Biblioteca BNCC</h1> <button onclick="abrirDescritores()"> 📊 Ver descritores </button> <br><br> <input id="buscaBNCC" placeholder="Buscar por código ou palavra. Ex: EF06MA01, números, texto" > <br><br> <select id="filtroDisciplinaBNCC"> <option value="">📘 Todas as disciplinas</option> </select> <br><br> <select id="filtroAnoBNCC"> <option value="">🎒 Todos os anos</option> </select> <br><br> <button id="buscarBNCC"> 🔍 Buscar </button> <button id="limparBNCC"> 🧹 Limpar filtros </button> <br><br> <div id="contadorBNCC" class="card"> 📚 Carregando habilidades... </div> <div id="resultadoBNCC"></div> <button onclick="abrirFavoritosBNCC()"> ⭐ Ver favoritos </button> <button onclick="voltarHome()"> ⬅ Voltar </button> ` +
    barraInferior();

  aplicarTemaSalvo();

  function normalizarBuscaBNCC(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleUpperCase("pt-BR")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizarCodigoBuscaBNCC(valor) {
    return normalizarBuscaBNCC(valor)
      .replace(/[^A-Z0-9]/g, "");
  }

  function normalizarAnoFiltroBNCC(valor) {
    const texto = normalizarBuscaBNCC(valor);

    if (texto.includes("ENSINO MEDIO")) {
      return "EM";
    }

    const numero = texto.match(/(?:^|\D)([1-9])(?:\D|$)/);

    return numero ? numero[1] : texto;
  }

  const disciplinas = [
    ...new Set(
      bancoBNCC
        .map((item) => String(item.disciplina || "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );

  const selectDisciplina =
    document.getElementById("filtroDisciplinaBNCC");

  disciplinas.forEach((disciplina) => {
    const option = document.createElement("option");
    option.value = disciplina;
    option.textContent = disciplina;
    selectDisciplina.appendChild(option);
  });

  const ordemAnos = [
    "1º Ano",
    "2º Ano",
    "3º Ano",
    "4º Ano",
    "5º Ano",
    "6º Ano",
    "7º Ano",
    "8º Ano",
    "9º Ano",
    "Ensino Médio",
    "Bebês (0 a 1 ano e 6 meses)",
    "Crianças bem pequenas (1 ano e 7 meses a 3 anos e 11 meses)",
    "Crianças pequenas (4 anos a 5 anos e 11 meses)",
  ];

  const anosEncontrados = new Set();

  bancoBNCC.forEach((item) => {
    const anosItem = Array.isArray(item.anos)
      ? item.anos
      : item.ano
      ? [item.ano]
      : [];

    anosItem.forEach((ano) => {
      if (String(ano || "").trim()) {
        anosEncontrados.add(String(ano).trim());
      }
    });
  });

  const anos = [...anosEncontrados].sort((a, b) => {
    const ia = ordemAnos.indexOf(a);
    const ib = ordemAnos.indexOf(b);

    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;

    return a.localeCompare(b, "pt-BR", {
      sensitivity: "base",
      numeric: true,
    });
  });

  const selectAno = document.getElementById("filtroAnoBNCC");

  anos.forEach((ano) => {
    const option = document.createElement("option");
    option.value = ano;
    option.textContent = ano;
    selectAno.appendChild(option);
  });

  function itemPertenceAoAnoBNCC(item, anoSelecionado) {
    if (!anoSelecionado) {
      return true;
    }

    const chaveFiltro =
      normalizarAnoFiltroBNCC(anoSelecionado);

    const anosItem = Array.isArray(item.anos)
      ? item.anos
      : item.ano
      ? [item.ano]
      : [];

    return anosItem.some(
      (anoItem) =>
        normalizarAnoFiltroBNCC(anoItem) === chaveFiltro
    );
  }

  function renderizarBNCC() {
    const valorBusca =
      document.getElementById("buscaBNCC").value;

    const busca = normalizarBuscaBNCC(valorBusca);
    const codigoBusca =
      normalizarCodigoBuscaBNCC(valorBusca);

    const disciplina =
      document.getElementById("filtroDisciplinaBNCC").value;

    const ano =
      document.getElementById("filtroAnoBNCC").value;

    /*
     * Se o usuário digitou um código completo, a prioridade é
     * localizar aquele código. Isso evita que um filtro antigo
     * faça parecer que a habilidade "não existe".
     */
    const codigoExato = bancoBNCC.find(
      (item) =>
        normalizarCodigoBuscaBNCC(item.codigo) === codigoBusca &&
        /^[A-Z]{2}\d{2}/.test(codigoBusca)
    );

    let resultados = bancoBNCC.filter((item) => {
      const codigoItem =
        normalizarCodigoBuscaBNCC(item.codigo);

      const textoCompleto = normalizarBuscaBNCC(
        [
          item.codigo || "",
          item.disciplina || "",
          Array.isArray(item.anos)
            ? item.anos.join(" ")
            : item.ano || "",
          item.habilidade || item.descricao || "",
          item.unidadeTematica || "",
          item.objetoConhecimento || "",
        ].join(" ")
      );

      const termosBusca = busca
        .split(/\s+/)
        .filter(Boolean);

      const combinaBusca =
        busca === "" ||
        termosBusca.every(
          (termo) =>
            textoCompleto.includes(termo) ||
            codigoItem.includes(
              normalizarCodigoBuscaBNCC(termo)
            )
        );

      const combinaDisciplina =
        disciplina === "" ||
        normalizarBuscaBNCC(item.disciplina) ===
          normalizarBuscaBNCC(disciplina);

      const combinaAno =
        itemPertenceAoAnoBNCC(item, ano);

      return (
        combinaBusca &&
        combinaDisciplina &&
        combinaAno
      );
    });

    if (
      codigoExato &&
      !resultados.some(
        (item) => item.codigo === codigoExato.codigo
      )
    ) {
      resultados = [codigoExato];

      const contador =
        document.getElementById("contadorBNCC");

      contador.innerHTML =
        "🔎 Código encontrado. Os filtros de disciplina/ano foram ignorados para esta busca exata.";
    } else {
      document.getElementById("contadorBNCC").innerHTML =
        "📚 " +
        resultados.length +
        " habilidade(s) encontrada(s).";
    }

    let html = "";

    resultados.forEach((item) => {
      html += ` <div class="card" style="text-align:left;"> <h3>${ item.codigo }</h3> <div style=" display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; "> <span style=" background:#2563EB; color:white; padding:6px 10px; border-radius:999px; font-size:12px; "> 📘 ${ item.disciplina } </span> <span style=" background:#059669; color:white; padding:6px 10px; border-radius:999px; font-size:12px; "> 🎒 ${ Array.isArray(item.anos) && item.anos.length ? item.anos.join(", ") : item.ano || "Ano não informado" } </span> </div> <p> <strong>✅ Habilidade:</strong><br> ${ item.habilidade || item.descricao || "Descrição não encontrada." } </p> <button onclick="favoritarBNCC('${ item.codigo }')"> ⭐ Favoritar </button> <button onclick="copiarHabilidadeBNCC('${ item.codigo }')"> 📋 Copiar </button> <button onclick="abrirDetalheBNCC('${ item.codigo }')"> 🔎 Ver detalhes </button> </div> `;
    });

    document.getElementById("resultadoBNCC").innerHTML =
      html ||
      ` <div class="card"> ❌ Nenhuma habilidade encontrada com os filtros atuais. </div> `;
  }

  document.getElementById("buscarBNCC").onclick =
    renderizarBNCC;

  document.getElementById("limparBNCC").onclick = function () {
    document.getElementById("buscaBNCC").value = "";
    document.getElementById("filtroDisciplinaBNCC").value = "";
    document.getElementById("filtroAnoBNCC").value = "";
    renderizarBNCC();
  };

  document.getElementById("buscaBNCC").oninput =
    renderizarBNCC;

  document.getElementById("filtroDisciplinaBNCC").onchange =
    renderizarBNCC;

  document.getElementById("filtroAnoBNCC").onchange =
    renderizarBNCC;

  renderizarBNCC();
}

function copiarHabilidadeBNCC(codigo) {
  let item = bancoBNCC.find((h) => h.codigo === codigo);

  if (!item) {
    alert("Habilidade não encontrada.");
    return;
  }

  let texto =
    item.codigo +
    " - " +
    item.disciplina +
    " - " +
    (Array.isArray(item.anos) && item.anos.length
      ? item.anos.join(", ")
      : item.ano || "Ano não informado") +
    "\n\n" +
    item.habilidade;

  navigator.clipboard.writeText(texto);

  alert("📋 Habilidade copiada.");
}

let cacheFavoritosBNCC = null;
let uidFavoritosBNCC = null;
let filaFavoritosBNCC = Promise.resolve();

function normalizarFavoritosBNCC(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }

  return [
    ...new Set(
      lista
        .map((item) =>
          String(item || "")
            .trim()
            .toUpperCase()
        )
        .filter(Boolean)
    ),
  ];
}

async function obterUsuarioFavoritosBNCC() {
  /* O favorito pode ser acionado logo após a Home abrir. Aguarda Firebase e autenticação antes de tentar gravar no Firestore. */
  if (
    !window.auth ||
    !window.firebaseAuth ||
    !window.db ||
    !window.firebaseFirestore
  ) {
    await new Promise((resolve) => {
      let encerrado = false;

      const concluir = () => {
        if (encerrado) return;
        encerrado = true;
        clearTimeout(timer);
        window.removeEventListener("firebasePronto", concluir);
        resolve();
      };

      const timer = setTimeout(concluir, 5000);

      window.addEventListener("firebasePronto", concluir, { once: true });
    });
  }

  const usuarioImediato =
    window.auth?.currentUser ||
    (window.usuarioAtualAjudaProf?.uid ? window.usuarioAtualAjudaProf : null);

  if (usuarioImediato?.uid) {
    return usuarioImediato;
  }

  if (
    !window.auth ||
    typeof window.firebaseAuth?.onAuthStateChanged !== "function"
  ) {
    return null;
  }

  return await new Promise((resolve) => {
    let finalizado = false;
    let cancelar = null;

    const encerrar = (usuario) => {
      if (finalizado) return;
      finalizado = true;
      clearTimeout(timer);

      try {
        if (typeof cancelar === "function") {
          cancelar();
        }
      } catch (erro) {}

      resolve(usuario?.uid ? usuario : null);
    };

    const timer = setTimeout(
      () => encerrar(window.auth?.currentUser || null),
      5000
    );

    cancelar = window.firebaseAuth.onAuthStateChanged(
      window.auth,
      (usuario) => encerrar(usuario),
      (erro) => {
        console.error("Erro ao restaurar sessão para favoritos BNCC:", erro);
        encerrar(null);
      }
    );
  });
}

async function carregarFavoritosBNCC(forcar = false) {
  const usuario = await obterUsuarioFavoritosBNCC();

  if (
    !usuario ||
    !window.db ||
    !window.firebaseFirestore?.doc ||
    !window.firebaseFirestore?.getDoc
  ) {
    console.warn("Favoritos BNCC: Firebase ou usuário ainda não disponível.");

    return Array.isArray(cacheFavoritosBNCC) ? [...cacheFavoritosBNCC] : [];
  }

  if (
    !forcar &&
    uidFavoritosBNCC === usuario.uid &&
    Array.isArray(cacheFavoritosBNCC)
  ) {
    return [...cacheFavoritosBNCC];
  }

  const { doc, getDoc, setDoc, serverTimestamp } = window.firebaseFirestore;

  const referencia = doc(
    window.db,
    "usuarios",
    usuario.uid,
    "dados",
    "bnccFavoritos"
  );

  try {
    const snapshot = await getDoc(referencia);

    let favoritos = [];

    if (snapshot.exists()) {
      const dados = snapshot.data() || {};

      favoritos = normalizarFavoritosBNCC(
        Array.isArray(dados.itens)
          ? dados.itens
          : Array.isArray(dados.valor)
          ? dados.valor
          : []
      );
    }

    /* Migração única: versões antigas gravavam somente no localStorage. Se ainda houver favoritos antigos e a nuvem estiver vazia, eles são enviados ao Firestore e a chave local é removida. */
    if (favoritos.length === 0) {
      try {
        const legado = normalizarFavoritosBNCC(
          JSON.parse(localStorage.getItem("bnccFavoritos") || "[]")
        );

        if (legado.length > 0) {
          favoritos = legado;

          await setDoc(
            referencia,
            {
              itens: favoritos,
              atualizadoEm: serverTimestamp(),
            },
            { merge: true }
          );

          localStorage.removeItem("bnccFavoritos");
        }
      } catch (erroMigracao) {
        console.warn(
          "Não foi possível migrar favoritos BNCC antigos:",
          erroMigracao
        );
      }
    }

    uidFavoritosBNCC = usuario.uid;
    cacheFavoritosBNCC = favoritos;

    return [...favoritos];
  } catch (erro) {
    console.error("Erro ao carregar favoritos BNCC do Firestore:", erro);

    if (typeof mostrarToast === "function") {
      mostrarToast("⚠️ Não foi possível carregar os favoritos BNCC.");
    }

    return Array.isArray(cacheFavoritosBNCC) ? [...cacheFavoritosBNCC] : [];
  }
}

async function salvarFavoritosBNCC(lista) {
  const favoritos = normalizarFavoritosBNCC(lista);

  const usuario = await obterUsuarioFavoritosBNCC();

  if (
    !usuario ||
    !window.db ||
    !window.firebaseFirestore?.doc ||
    !window.firebaseFirestore?.setDoc
  ) {
    throw new Error(
      "Usuário ou Firebase não disponível para salvar os favoritos."
    );
  }

  const { doc, setDoc, serverTimestamp } = window.firebaseFirestore;

  const referencia = doc(
    window.db,
    "usuarios",
    usuario.uid,
    "dados",
    "bnccFavoritos"
  );

  /* Serializa gravações para impedir que dois cliques rápidos façam uma atualização mais antiga sobrescrever a mais nova. */
  filaFavoritosBNCC = filaFavoritosBNCC
    .catch(() => {})
    .then(() =>
      setDoc(
        referencia,
        {
          itens: favoritos,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      )
    );

  await filaFavoritosBNCC;

  uidFavoritosBNCC = usuario.uid;
  cacheFavoritosBNCC = favoritos;

  return [...favoritos];
}

async function favoritarBNCC(codigo) {
  codigo = String(codigo || "")
    .trim()
    .toUpperCase();

  if (!codigo) {
    return;
  }

  try {
    const favoritos = await carregarFavoritosBNCC();

    if (favoritos.includes(codigo)) {
      if (typeof mostrarToast === "function") {
        mostrarToast("⭐ Essa habilidade já está nos favoritos.");
      } else {
        alert("⭐ Essa habilidade já está salva.");
      }

      return;
    }

    favoritos.push(codigo);

    await salvarFavoritosBNCC(favoritos);

    if (typeof mostrarToast === "function") {
      mostrarToast("⭐ Habilidade salva nos favoritos.");
    } else {
      alert("⭐ Habilidade salva nos favoritos.");
    }
  } catch (erro) {
    console.error("Erro ao favoritar habilidade BNCC:", erro);

    if (typeof mostrarToast === "function") {
      mostrarToast("❌ Não foi possível salvar o favorito.");
    } else {
      alert("❌ Não foi possível salvar o favorito.");
    }
  }
}

function abrirDetalheBNCC(codigo) {
  let item = bancoBNCC.find((h) => h.codigo === codigo);

  if (!item) {
    alert("Habilidade não encontrada.");
    return;
  }

  document.body.innerHTML =
    ` <h1>🔎 Detalhes BNCC</h1> <div class="card" style="text-align:left;"> <h2>${ item.codigo }</h2> <p> <strong>📘 Disciplina:</strong><br> ${ item.disciplina || "Não informada" } </p> <p> <strong>🎒 Ano(s):</strong><br> ${ item.anos ? item.anos.join(", ") : item.ano || "Ano não informado" } </p> <p> <strong>✅ Habilidade:</strong><br> ${ item.habilidade || item.descricao || "Descrição não encontrada." } </p> <button onclick="favoritarBNCC('${ item.codigo }')"> ⭐ Favoritar </button> <button onclick="copiarHabilidadeBNCC('${ item.codigo }')"> 📋 Copiar </button> </div> <button onclick="abrirBNCC()"> ⬅ Voltar para BNCC </button> ` +
    barraInferior();

  aplicarTemaSalvo();
}

function abrirDescritores() {
  document.body.innerHTML =
    ` <h1>Descritores</h1> <input id="buscaDescritor" placeholder="Buscar: MAT9, LP5, D1, porcentagem..." > <br><br> <div id="resultadoDescritores"></div> <button onclick="abrirBNCC()"> Voltar para BNCC </button> ` +
    barraInferior();

  aplicarTemaSalvo();

  let descritores = baseDescritores || [];

  function renderizarDescritores() {
    let busca = document
      .getElementById("buscaDescritor")
      .value.toUpperCase()
      .trim();

    let resultados = descritores.filter((item) => {
      let texto = (
        (item.codigo || "") +
        " " +
        (item.codigoOriginal || "") +
        " " +
        (item.area || "") +
        " " +
        (item.ano || "") +
        " " +
        (item.descricao || "")
      ).toUpperCase();

      return busca === "" || texto.includes(busca);
    });

    let html = "";

    resultados.forEach((item) => {
      html += ` <div class="card" style="text-align:left;"> <h3>${ item.codigo }</h3> <p><strong>Área:</strong> ${ item.area || "Não informada" }</p> <p><strong>Ano:</strong> ${ item.ano || "Não informado" }</p> <p><strong>Descritor:</strong><br>${ item.descricao || "Descrição não encontrada." }</p> </div> `;
    });

    document.getElementById("resultadoDescritores").innerHTML =
      html || "<div class='card'>Nenhum descritor encontrado.</div>";
  }

  document.getElementById("buscaDescritor").oninput = function () {
    renderizarDescritores();
  };

  renderizarDescritores();
}

async function abrirFavoritosBNCC() {
  document.body.innerHTML =
    ` <h1>⭐ Favoritos BNCC</h1> <input id="buscaFavoritosBNCC" placeholder="🔍 Buscar favorito por código, disciplina ou habilidade..." > <br><br> <button onclick="limparFavoritosBNCC()"> 🧹 Limpar Favoritos </button> <br><br> <div id="listaFavoritosBNCC"> <div class="card">☁️ Carregando favoritos...</div> </div> <button onclick="voltarHome()"> ⬅ Voltar </button> ` +
    barraInferior();

  aplicarTemaSalvo();

  let favoritos = await carregarFavoritosBNCC(true);

  let html = "";

  favoritos.forEach((codigo) => {
    let item = bancoBNCC.find((h) => h.codigo === codigo);

    if (item) {
      html += ` <div class="card" style="text-align:left;"> <h3>⭐ ${ item.codigo }</h3> <div style=" display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; "> <span style=" background:#2563EB; color:white; padding:6px 10px; border-radius:999px; font-size:12px; "> 📘 ${ item.disciplina || "Disciplina não informada" } </span> <span style=" background:#059669; color:white; padding:6px 10px; border-radius:999px; font-size:12px; "> 🎒 ${ item.anos ? item.anos.join(", ") : item.ano || "Ano não informado" } </span> </div> <p> <strong>✅ Habilidade:</strong><br> ${ item.habilidade || item.descricao || "Descrição não encontrada." } </p> <button onclick="copiarHabilidadeBNCC('${ item.codigo }')"> 📋 Copiar </button> <button onclick="abrirDetalheBNCC('${ item.codigo }')"> 🔎 Ver detalhes </button> <button onclick="removerFavoritoBNCC('${ item.codigo }')"> 🗑 Remover </button> </div> `;
    } else {
      html += ` <div class="card"> ⚠ ${codigo} não foi encontrado no banco BNCC. </div> `;
    }
  });

  const lista = document.getElementById("listaFavoritosBNCC");

  if (!lista) {
    return;
  }

  lista.innerHTML = html || "<div class='card'>Nenhum favorito salvo.</div>";

  const buscaFavoritos = document.getElementById("buscaFavoritosBNCC");

  if (buscaFavoritos) {
    buscaFavoritos.oninput = function () {
      let busca = this.value.toUpperCase().trim();

      let cards = document.querySelectorAll("#listaFavoritosBNCC .card");

      cards.forEach((card) => {
        let texto = card.innerText.toUpperCase();

        card.style.display = texto.includes(busca) ? "block" : "none";
      });
    };
  }
}

async function removerFavoritoBNCC(codigo) {
  try {
    let favoritos = await carregarFavoritosBNCC();

    favoritos = favoritos.filter(
      (item) =>
        item !==
        String(codigo || "")
          .trim()
          .toUpperCase()
    );

    await salvarFavoritosBNCC(favoritos);

    await abrirFavoritosBNCC();
  } catch (erro) {
    console.error("Erro ao remover favorito BNCC:", erro);

    if (typeof mostrarToast === "function") {
      mostrarToast("❌ Não foi possível remover o favorito.");
    }
  }
}

async function limparFavoritosBNCC() {
  let confirmar = confirm("Deseja remover todas as habilidades favoritas?");

  if (!confirmar) return;

  try {
    await salvarFavoritosBNCC([]);

    if (typeof mostrarToast === "function") {
      mostrarToast("🧹 Favoritos removidos.");
    }

    await abrirFavoritosBNCC();
  } catch (erro) {
    console.error("Erro ao limpar favoritos BNCC:", erro);

    if (typeof mostrarToast === "function") {
      mostrarToast("❌ Não foi possível limpar os favoritos.");
    } else {
      alert("❌ Não foi possível limpar os favoritos.");
    }
  }
}