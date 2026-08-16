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

    let codigosEncontrados = new Set();

    let duplicados = new Set();

    let invalidos = 0;

    let lista = [];

    listaOriginal.forEach((item) => {
      if (!item || typeof item !== "object") {
        invalidos++;

        return;
      }

      let codigo = normalizarTexto(item.codigo).toUpperCase();

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
          .map((ano) => normalizarTexto(ano))
          .filter((ano) => ano !== "");
      } else if (item.ano) {
        anos = [normalizarTexto(item.ano)];
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

function abrirBNCC() {
  document.body.innerHTML =
    ` <h1>📚 Biblioteca BNCC</h1> <button onclick="abrirDescritores()"> 📊 Ver descritores </button> <br><br> <input id="buscaBNCC" placeholder="Buscar por código ou palavra. Ex: EF06MA01, números, texto" > <br><br> <select id="filtroDisciplinaBNCC"> <option value="">📘 Todas as disciplinas</option> </select> <br><br> <select id="filtroAnoBNCC"> <option value="">🎒 Todos os anos</option> </select> <br><br> <button id="buscarBNCC"> 🔍 Buscar </button> <button id="limparBNCC"> 🧹 Limpar filtros </button> <br><br> <div id="contadorBNCC" class="card"> 📚 Carregando habilidades... </div> <div id="resultadoBNCC"></div> <button onclick="abrirFavoritosBNCC()"> ⭐ Ver favoritos </button> <button onclick="voltarHome()"> ⬅ Voltar </button> ` +
    barraInferior();

  aplicarTemaSalvo();

  let disciplinas = [
    ...new Set(bancoBNCC.map((item) => item.disciplina)),
  ].sort();

  let selectDisciplina = document.getElementById("filtroDisciplinaBNCC");

  disciplinas.forEach((d) => {
    selectDisciplina.innerHTML += ` <option value="${d}"> ${d} </option> `;
  });

  let anos = [];

  bancoBNCC.forEach((item) => {
    if (item.anos) {
      item.anos.forEach((ano) => {
        if (!anos.includes(ano)) {
          anos.push(ano);
        }
      });
    }
  });

  anos.sort();

  let selectAno = document.getElementById("filtroAnoBNCC");

  anos.forEach((ano) => {
    selectAno.innerHTML += ` <option value="${ano}"> ${ano} </option> `;
  });

  function renderizarBNCC() {
    let busca = document.getElementById("buscaBNCC").value.toUpperCase().trim();

    let disciplina = document.getElementById("filtroDisciplinaBNCC").value;
    let ano = document.getElementById("filtroAnoBNCC").value;

    let resultados = bancoBNCC.filter((item) => {
      let textoCompleto = (
        (item.codigo || "") +
        " " +
        (item.disciplina || "") +
        " " +
        (item.anos ? item.anos.join(" ") : item.ano || "") +
        " " +
        (item.habilidade || item.descricao || "")
      ).toUpperCase();

      let combinaBusca = busca === "" || textoCompleto.includes(busca);

      let combinaDisciplina =
        disciplina === "" || (item.disciplina || "") === disciplina;

      let combinaAno =
        ano === "" ||
        (item.anos && item.anos.includes(ano)) ||
        item.ano === ano;

      return combinaBusca && combinaDisciplina && combinaAno;
    });

    let html = "";

    resultados.forEach((item) => {
      html += ` <div class="card" style="text-align:left;"> <h3>${ item.codigo }</h3> <div style=" display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; "> <span style=" background:#2563EB; color:white; padding:6px 10px; border-radius:999px; font-size:12px; "> 📘 ${ item.disciplina } </span> <span style=" background:#059669; color:white; padding:6px 10px; border-radius:999px; font-size:12px; "> 🎒 ${ item.anos ? item.anos.join(", ") : item.ano || "Ano não informado" } </span> </div> <p> <strong>✅ Habilidade:</strong><br> ${ item.habilidade || item.descricao || "Descrição não encontrada." } </p> <button onclick="favoritarBNCC('${ item.codigo }')"> ⭐ Favoritar </button> <button onclick="copiarHabilidadeBNCC('${ item.codigo }')"> 📋 Copiar </button> <button onclick="abrirDetalheBNCC('${ item.codigo }')"> 🔎 Ver detalhes </button> </div> `;
    });

    document.getElementById("contadorBNCC").innerHTML =
      "📚 " + resultados.length + " habilidade(s) encontrada(s).";

    document.getElementById("resultadoBNCC").innerHTML =
      html || ` <div class="card"> ❌ Nenhuma habilidade encontrada. </div> `;
  }

  document.getElementById("buscarBNCC").onclick = function () {
    renderizarBNCC();
  };

  document.getElementById("limparBNCC").onclick = function () {
    document.getElementById("buscaBNCC").value = "";
    document.getElementById("filtroDisciplinaBNCC").value = "";
    document.getElementById("filtroAnoBNCC").value = "";

    renderizarBNCC();
  };

  document.getElementById("buscaBNCC").oninput = function () {
    renderizarBNCC();
  };

  document.getElementById("filtroDisciplinaBNCC").onchange = function () {
    renderizarBNCC();
  };

  document.getElementById("filtroAnoBNCC").onchange = function () {
    renderizarBNCC();
  };

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
    item.ano +
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