/* ========================================================= AJUDA+PROF — AUTENTICAÇÃO E ESTADO DA NUVEM ========================================================= */

/* A autenticação controla somente a sessão do usuário. Cada módulo funcional é responsável por carregar e salvar seus próprios dados diretamente no Firestore. */

let statusSincronizacaoAjudaProf = navigator.onLine
  ? "sincronizado"
  : "offline";

let ultimaSincronizacaoAjudaProf = "";

/* Indica que a autenticação atual veio da criação de uma conta nova. Essa informação é usada apenas pelo fluxo visual de cadastro. */
let criandoContaNovaAjudaProf = false;

let uidSessaoAjudaProf = null;

function definirStatusSincronizacaoAjudaProf(status) {
  const estadosPermitidos = [
    "aguardando",
    "sincronizando",
    "sincronizado",
    "offline",
    "erro",
  ];

  statusSincronizacaoAjudaProf = estadosPermitidos.includes(status)
    ? status
    : "aguardando";

  const elementoStatus = document.getElementById("statusSincronizacao");

  const elementoIcone = document.getElementById("iconeSincronizacao");

  const elementoUltima = document.getElementById("ultimaSincronizacao");

  const textos = {
    aguardando: "Verificando conexão",
    sincronizando: "Verificando conexão...",
    sincronizado: "Nuvem disponível",
    offline: "Sem conexão",
    erro: "Erro de conexão",
  };

  const icones = {
    aguardando: "cloud_queue",
    sincronizando: "cloud_sync",
    sincronizado: "cloud_done",
    offline: "cloud_off",
    erro: "error",
  };

  if (elementoStatus) {
    elementoStatus.textContent = textos[statusSincronizacaoAjudaProf];
  }

  if (elementoIcone) {
    elementoIcone.textContent = icones[statusSincronizacaoAjudaProf];
  }

  if (elementoUltima) {
    elementoUltima.textContent = formatarUltimaSincronizacaoAjudaProf();
  }

  if (typeof atualizarStatusSincronizacaoHomeAjudaProf === "function") {
    atualizarStatusSincronizacaoHomeAjudaProf();
  }
}

function registrarSincronizacaoAjudaProf() {
  ultimaSincronizacaoAjudaProf = new Date().toISOString();

  definirStatusSincronizacaoAjudaProf(
    navigator.onLine ? "sincronizado" : "offline"
  );
}

function formatarUltimaSincronizacaoAjudaProf() {
  if (!ultimaSincronizacaoAjudaProf) {
    return navigator.onLine ? "Conexão disponível" : "Sem conexão";
  }

  const data = new Date(ultimaSincronizacaoAjudaProf);

  if (Number.isNaN(data.getTime())) {
    return "Não disponível";
  }

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obterUsuarioFirestoreAjudaProf() {
  return window.auth?.currentUser || window.usuarioAtualAjudaProf || null;
}

window.addEventListener("online", () => {
  registrarSincronizacaoAjudaProf();
});

window.addEventListener("offline", () => {
  definirStatusSincronizacaoAjudaProf("offline");
});

let observadorAuthAjudaProf = null;

function iniciarAutenticacaoAjudaProf() {
  if (!window.auth || !window.firebaseAuth) {
    mostrarCarregandoFirebase();

    window.addEventListener("firebasePronto", iniciarAutenticacaoAjudaProf, {
      once: true,
    });

    return;
  }

  if (observadorAuthAjudaProf) {
    return;
  }

  const { onAuthStateChanged } = window.firebaseAuth;

  observadorAuthAjudaProf = onAuthStateChanged(
    window.auth,

    async (usuario) => {
      const novoUid = usuario?.uid || null;

      const trocouUsuario = uidSessaoAjudaProf !== novoUid;

      if (trocouUsuario) {
        if (typeof window.encerrarEscutaTarefasFirebase === "function") {
          window.encerrarEscutaTarefasFirebase();
        }

        if (typeof window.encerrarEscutaHistoricoFirebase === "function") {
          window.encerrarEscutaHistoricoFirebase();
        }

        if (typeof window.encerrarEscutaAgendaFirebase === "function") {
          window.encerrarEscutaAgendaFirebase();
        }

        if (typeof window.encerrarEscutaTurmasFirebase === "function") {
          window.encerrarEscutaTurmasFirebase();
        }
      }

      uidSessaoAjudaProf = novoUid;
      window.usuarioAtualAjudaProf = usuario || null;

      if (usuario) {
        criandoContaNovaAjudaProf = false;

        registrarSincronizacaoAjudaProf();

        if (typeof window.iniciarEscutaTurmasFirebase === "function") {
          try {
            await window.iniciarEscutaTurmasFirebase();
          } catch (erro) {
            console.error(
              "Não foi possível iniciar a sincronização das turmas:",
              erro
            );
          }
        }

        await voltarHome();
      } else {
        definirStatusSincronizacaoAjudaProf(
          navigator.onLine ? "aguardando" : "offline"
        );

        abrirLogin();
      }
    },

    (erro) => {
      console.error("Erro ao verificar autenticação:", erro);

      abrirLogin("Não foi possível verificar sua sessão.");
    }
  );
}

function mostrarCarregandoFirebase() {
  document.body.innerHTML = `
<main class="telaLogin">

<section class="card cardLogin">

<h1>Ajuda+Prof</h1>

<p>
Conectando ao Firebase...
</p>

<div class="carregandoLogin">
⏳
</div>

</section>

</main>
`;

  aplicarTemaSalvo();
}

function abrirLogin(mensagemInicial = "") {
  document.body.innerHTML = `
<main class="telaLogin">

<section class="card cardLogin">

<div class="cabecalhoLogin">

<img
id="logoLogin"
class="logoLogin"
src=""
alt="Ajuda+Prof"
>

<h1>Ajuda+Prof</h1>

<p>
Corrija provas, organize tarefas
e ensine melhor.
</p>

</div>

<div
id="mensagemLogin"
class="mensagemLogin"
aria-live="polite"
></div>

<div class="grupoCampo">

<label for="emailLogin">
E-mail
</label>

<input
id="emailLogin"
type="email"
placeholder="professor@email.com"
autocomplete="email"
>

</div>

<div class="grupoCampo">

<label for="senhaLogin">
Senha
</label>

<div class="campoSenhaLogin">

<input
id="senhaLogin"
type="password"
placeholder="Digite sua senha"
autocomplete="current-password"
>

<button
id="mostrarSenhaLogin"
type="button"
aria-label="Mostrar senha"
>

<span class="material-icons-round">
visibility
</span>

</button>

</div>

</div>

<div class="acoesLogin">

<button
id="entrarLogin"
type="button"
class="btnAzul"
>

<span class="material-icons-round">
login
</span>

Entrar

</button>

<button
id="abrirCadastroLogin"
type="button"
>

<span class="material-icons-round">
person_add
</span>

Criar conta

</button>

</div>

<button
id="recuperarSenhaLogin"
type="button"
class="botaoLinkLogin"
>

Esqueci minha senha

</button>

</section>

</main>
`;

  aplicarTemaSalvo();

  let logo = document.getElementById("logoLogin");

  if (logo) {
    logo.src = document.body.classList.contains("darkMode")
      ? "logo1.png"
      : "logo2.png";
  }

  const campoEmail = document.getElementById("emailLogin");

  const campoSenha = document.getElementById("senhaLogin");

  const botaoEntrar = document.getElementById("entrarLogin");

  const mensagem = document.getElementById("mensagemLogin");

  if (mensagemInicial) {
    mostrarMensagemLogin(mensagemInicial, "erro");
  }

  function mostrarMensagemLogin(texto, tipo = "") {
    mensagem.textContent = texto || "";

    mensagem.className = "mensagemLogin " + (tipo || "");
  }

  function definirCarregamentoLogin(carregando) {
    botaoEntrar.disabled = carregando;

    botaoEntrar.innerHTML = carregando
      ? `
<span class="material-icons-round">
hourglass_top
</span>

Entrando...
`
      : `
<span class="material-icons-round">
login
</span>

Entrar
`;
  }

  async function entrar() {
    let email = campoEmail.value.trim().toLowerCase();

    let senha = campoSenha.value;

    if (email === "") {
      mostrarMensagemLogin("Digite seu e-mail.", "erro");

      campoEmail.focus();

      return;
    }

    if (senha === "") {
      mostrarMensagemLogin("Digite sua senha.", "erro");

      campoSenha.focus();

      return;
    }

    if (!window.auth || !window.firebaseAuth) {
      mostrarMensagemLogin(
        "O Firebase ainda não terminou de carregar.",
        "erro"
      );

      return;
    }

    definirCarregamentoLogin(true);

    mostrarMensagemLogin("Entrando...", "");

    try {
      await window.firebaseAuth.signInWithEmailAndPassword(
        window.auth,
        email,
        senha
      );

      /* O onAuthStateChanged abrirá a tela inicial automaticamente. */
    } catch (erro) {
      console.error("Erro no login:", erro);

      mostrarMensagemLogin(traduzirErroFirebase(erro), "erro");

      definirCarregamentoLogin(false);
    }
  }

  botaoEntrar.onclick = entrar;

  campoSenha.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();

      entrar();
    }
  });

  document.getElementById("mostrarSenhaLogin").onclick = function () {
    let mostrando = campoSenha.type === "text";

    campoSenha.type = mostrando ? "password" : "text";

    this.querySelector(".material-icons-round").textContent = mostrando
      ? "visibility"
      : "visibility_off";

    this.setAttribute(
      "aria-label",
      mostrando ? "Mostrar senha" : "Ocultar senha"
    );
  };

  document.getElementById("abrirCadastroLogin").onclick = abrirCadastro;

  document.getElementById("recuperarSenhaLogin").onclick =
    abrirRecuperacaoSenha;
}

function abrirCadastro() {
  document.body.innerHTML = `
<main class="telaLogin">

<section class="card cardLogin">

<h1>👤 Criar conta</h1>

<p>
Cadastre sua conta de professor.
</p>

<div
id="mensagemCadastro"
class="mensagemLogin"
aria-live="polite"
></div>

<div class="grupoCampo">

<label for="nomeCadastro">
Nome
</label>

<input
id="nomeCadastro"
type="text"
placeholder="Seu nome"
autocomplete="name"
>

</div>

<div class="grupoCampo">

<label for="emailCadastro">
E-mail
</label>

<input
id="emailCadastro"
type="email"
placeholder="professor@email.com"
autocomplete="email"
>

</div>

<div class="grupoCampo">

<label for="senhaCadastro">
Senha
</label>

<input
id="senhaCadastro"
type="password"
placeholder="Mínimo de 6 caracteres"
autocomplete="new-password"
>

</div>

<div class="grupoCampo">

<label for="confirmarSenhaCadastro">
Confirmar senha
</label>

<input
id="confirmarSenhaCadastro"
type="password"
placeholder="Digite novamente"
autocomplete="new-password"
>

</div>

<div class="acoes">

<button
id="salvarCadastro"
type="button"
class="btnVerde"
>

<span class="material-icons-round">
person_add
</span>

Criar conta

</button>

<button
id="voltarLoginCadastro"
type="button"
>

<span class="material-icons-round">
arrow_back
</span>

Voltar

</button>

</div>

</section>

</main>
`;

  aplicarTemaSalvo();

  const nome = document.getElementById("nomeCadastro");

  const email = document.getElementById("emailCadastro");

  const senha = document.getElementById("senhaCadastro");

  const confirmarSenha = document.getElementById("confirmarSenhaCadastro");

  const mensagem = document.getElementById("mensagemCadastro");

  const botaoSalvar = document.getElementById("salvarCadastro");

  function mostrarMensagem(texto, tipo = "") {
    mensagem.textContent = texto;

    mensagem.className = "mensagemLogin " + tipo;
  }

  botaoSalvar.onclick = async function () {
    let nomeInformado = nome.value.trim();

    let emailInformado = email.value.trim().toLowerCase();

    let senhaInformada = senha.value;

    if (nomeInformado === "") {
      mostrarMensagem("Digite seu nome.", "erro");

      nome.focus();

      return;
    }

    if (emailInformado === "") {
      mostrarMensagem("Digite seu e-mail.", "erro");

      email.focus();

      return;
    }

    if (senhaInformada.length < 6) {
      mostrarMensagem("A senha precisa ter pelo menos 6 caracteres.", "erro");

      senha.focus();

      return;
    }

    if (senhaInformada !== confirmarSenha.value) {
      mostrarMensagem("As senhas não coincidem.", "erro");

      confirmarSenha.focus();

      return;
    }

    botaoSalvar.disabled = true;

    botaoSalvar.textContent = "Criando conta...";

    /* A marcação precisa ocorrer antes da chamada ao Firebase, pois o onAuthStateChanged pode ser executado imediatamente após a criação. */
    criandoContaNovaAjudaProf = true;

    try {
      let credencial = await window.firebaseAuth.createUserWithEmailAndPassword(
        window.auth,
        emailInformado,
        senhaInformada
      );

      await window.firebaseAuth.updateProfile(credencial.user, {
        displayName: nomeInformado,
      });

      /* O observador de autenticação abrirá a Home automaticamente. */
    } catch (erro) {
      criandoContaNovaAjudaProf = false;

      console.error("Erro ao criar conta:", erro);

      mostrarMensagem(traduzirErroFirebase(erro), "erro");

      botaoSalvar.disabled = false;

      botaoSalvar.innerHTML = `
<span class="material-icons-round">
person_add
</span>

Criar conta
`;
    }
  };

  document.getElementById("voltarLoginCadastro").onclick = function () {
    abrirLogin();
  };
}

function abrirRecuperacaoSenha() {
  if (!window.auth || !window.firebaseAuth) {
    mostrarAlerta({
      titulo: "Firebase indisponível",

      mensagem:
        "O Firebase ainda não está disponível. Aguarde alguns segundos e tente novamente.",

      icone: "cloud_off",

      textoBotao: "Entendi",
    });

    return;
  }

  mostrarPrompt({
    titulo: "Recuperar senha",

    mensagem:
      "Informe o e-mail utilizado no cadastro. Enviaremos um link para criar uma nova senha.",

    label: "E-mail da conta",

    valor: "",

    placeholder: "professor@email.com",

    tipo: "email",

    icone: "lock_reset",

    textoConfirmar: "Enviar link",

    textoCancelar: "Cancelar",

    obrigatorio: true,

    aoConfirmar: async function (emailInformado) {
      const email = String(emailInformado || "")
        .trim()
        .toLowerCase();

      if (email === "") {
        mostrarAlerta({
          titulo: "E-mail obrigatório",

          mensagem: "Digite o e-mail utilizado no cadastro.",

          icone: "warning",

          textoBotao: "Entendi",

          aoFechar: function () {
            abrirRecuperacaoSenha();
          },
        });

        return;
      }

      try {
        await window.firebaseAuth.sendPasswordResetEmail(window.auth, email);

        mostrarAlerta({
          titulo: "E-mail enviado",

          mensagem:
            "Enviamos um link de recuperação para o seu e-mail. Verifique também a pasta de spam ou lixo eletrônico.",

          icone: "mark_email_read",

          textoBotao: "Entendi",
        });
      } catch (erro) {
        console.error("Erro ao recuperar senha:", erro);

        mostrarAlerta({
          titulo: "Não foi possível enviar",

          mensagem: traduzirErroFirebase(erro),

          icone: "error",

          textoBotao: "Tentar novamente",

          aoFechar: function () {
            abrirRecuperacaoSenha();
          },
        });
      }
    },
  });
}

function traduzirErroFirebase(erro) {
  let codigo = erro?.code || "";

  const mensagens = {
    "auth/invalid-email": "E-mail inválido.",

    "auth/missing-password": "Digite sua senha.",

    "auth/invalid-credential": "E-mail ou senha incorretos.",

    "auth/user-disabled": "Esta conta foi desativada.",

    "auth/email-already-in-use": "Este e-mail já está cadastrado.",

    "auth/weak-password": "A senha informada é muito fraca.",

    "auth/too-many-requests":
      "Muitas tentativas. Aguarde um pouco e tente novamente.",

    "auth/network-request-failed":
      "Não foi possível conectar ao Firebase. Verifique sua internet.",

    "auth/operation-not-allowed":
      "O login por e-mail e senha ainda não foi habilitado no Firebase.",

    "auth/user-not-found": "Não encontramos uma conta com esse e-mail.",
  };

  return mensagens[codigo] || "Não foi possível concluir a operação.";
}

function sairDaConta() {
  if (!window.auth || !window.firebaseAuth) {
    mostrarAlerta({
      titulo: "Firebase indisponível",

      mensagem:
        "Não foi possível acessar o serviço de autenticação neste momento.",

      icone: "cloud_off",

      textoBotao: "Entendi",
    });

    return;
  }

  mostrarConfirmacao({
    titulo: "Sair da conta",

    mensagem: "Deseja realmente sair da sua conta do Ajuda+Prof?",

    icone: "logout",

    textoConfirmar: "Sair",

    textoCancelar: "Cancelar",

    classeConfirmar: "btnVermelho",

    aoConfirmar: async function () {
      try {
        definirStatusSincronizacaoAjudaProf("aguardando");

        if (typeof window.encerrarEscutaTarefasFirebase === "function") {
          window.encerrarEscutaTarefasFirebase();
        }

        if (typeof window.encerrarEscutaHistoricoFirebase === "function") {
          window.encerrarEscutaHistoricoFirebase();
        }

        if (typeof window.encerrarEscutaAgendaFirebase === "function") {
          window.encerrarEscutaAgendaFirebase();
        }

        if (typeof window.encerrarEscutaTurmasFirebase === "function") {
          window.encerrarEscutaTurmasFirebase();
        }

        await window.firebaseAuth.signOut(window.auth);

        /* O onAuthStateChanged abrirá automaticamente a tela de login. */
      } catch (erro) {
        console.error("Erro ao sair:", erro);

        mostrarAlerta({
          titulo: "Não foi possível sair",

          mensagem:
            "Ocorreu um erro ao encerrar a sessão. Verifique sua conexão e tente novamente.",

          icone: "error",

          textoBotao: "Entendi",
        });
      }
    },
  });
}

function abrirSplash() {
  if (window.intervaloSplashAjudaProf) {
    clearInterval(window.intervaloSplashAjudaProf);

    window.intervaloSplashAjudaProf = null;
  }

  if (window.timeoutSplashAjudaProf) {
    clearTimeout(window.timeoutSplashAjudaProf);

    window.timeoutSplashAjudaProf = null;
  }

  document.body.style.transition = "opacity .5s ease";

  document.body.style.opacity = "1";

  document.body.innerHTML = `
<div class="splashTela">

<div class="glowSplash"></div>

<img
id="logoSplash"
class="logoSplash"
src=""
alt="Ajuda+Prof"
>

<div class="barraSplash">

<div id="barraLoad"></div>

<div id="textoLoad">
Carregando... 0%
</div>

</div>

<div id="statusSplash">
Carregando...
</div>

</div>
`;

  aplicarTemaSalvo();

  let logoSplash = document.getElementById("logoSplash");

  if (logoSplash) {
    logoSplash.src = document.body.classList.contains("darkMode")
      ? "logo1.png"
      : "logo2.png";

    logoSplash.onerror = function () {
      console.warn("⚠️ A imagem da logo da splash não foi encontrada.");

      logoSplash.style.display = "none";
    };
  }

  let progresso = 0;

  function obterElementosSplash() {
    return {
      barra: document.getElementById("barraLoad"),

      texto: document.getElementById("textoLoad"),

      status: document.getElementById("statusSplash"),

      logo: document.querySelector(".logoSplash"),

      glow: document.querySelector(".glowSplash"),
    };
  }

  window.intervaloSplashAjudaProf = setInterval(() => {
    let elementos = obterElementosSplash();

    if (!elementos.barra || !elementos.texto || !elementos.status) {
      clearInterval(window.intervaloSplashAjudaProf);

      window.intervaloSplashAjudaProf = null;

      return;
    }

    progresso = Math.min(progresso + 5, 100);

    elementos.barra.style.width = progresso + "%";

    elementos.texto.textContent = "Carregando... " + progresso + "%";

    if (progresso >= 70) {
      elementos.status.textContent = "Preparando o aplicativo...";
    }

    if (progresso < 100) {
      return;
    }

    clearInterval(window.intervaloSplashAjudaProf);

    window.intervaloSplashAjudaProf = null;

    elementos.status.textContent = "Entrando no Ajuda+Prof...";

    if (elementos.logo) {
      elementos.logo.classList.add("zoomFinal");
    }

    if (elementos.glow) {
      elementos.glow.classList.add("glowFinal");
    }

    window.timeoutSplashAjudaProf = setTimeout(() => {
      document.body.style.opacity = "0";

      window.timeoutSplashAjudaProf = setTimeout(() => {
        iniciarAutenticacaoAjudaProf();

        document.body.style.opacity = "1";

        window.timeoutSplashAjudaProf = null;
      }, 500);
    }, 600);
  }, 100);
}