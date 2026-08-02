/*
==========================================================
AJUDA+PROF — DIÁLOGOS MODERNOS
==========================================================

Substitui gradualmente alert(), confirm() e prompt()
por janelas com o visual do próprio aplicativo.
*/


function removerDialogoAtual(){

    const dialogo =
        document.getElementById("dialogoAjudaProf");

    if(dialogo){
        dialogo.remove();
    }

    document.body.classList.remove("dialogoAberto");

}


function fecharDialogo(){

    removerDialogoAtual();

}


function criarEstruturaDialogo({
    titulo = "",
    mensagem = "",
    icone = "info",
    conteudo = "",
    botoes = ""
} = {}){

    removerDialogoAtual();

    const tituloSeguro =
        typeof escaparHTMLComponente === "function"
        ? escaparHTMLComponente(titulo)
        : String(titulo ?? "");

    const mensagemSegura =
        typeof escaparHTMLComponente === "function"
        ? escaparHTMLComponente(mensagem)
        : String(mensagem ?? "");

    const iconeSeguro =
        typeof escaparHTMLComponente === "function"
        ? escaparHTMLComponente(icone)
        : String(icone ?? "");

    const html = `
        <div
            id="dialogoAjudaProf"
            class="dialogoOverlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogoTituloAjudaProf"
        >

            <div class="dialogoCaixa">

                <div class="dialogoCabecalho">

                    <div class="dialogoIcone material-icons-round">
                        ${iconeSeguro}
                    </div>

                    <div>

                        <h2 id="dialogoTituloAjudaProf">
                            ${tituloSeguro}
                        </h2>

                        ${
                            mensagemSegura
                            ? `<p>${mensagemSegura}</p>`
                            : ""
                        }

                    </div>

                </div>

                ${
                    conteudo
                    ? `
                        <div class="dialogoConteudo">
                            ${conteudo}
                        </div>
                    `
                    : ""
                }

                <div class="dialogoAcoes">
                    ${botoes}
                </div>

            </div>

        </div>
    `;

    document.body.insertAdjacentHTML(
        "beforeend",
        html
    );

    document.body.classList.add("dialogoAberto");

    const overlay =
        document.getElementById("dialogoAjudaProf");

    overlay.addEventListener(
        "click",
        evento => {

            if(evento.target === overlay){
                fecharDialogo();
            }

        }
    );

    document.addEventListener(
        "keydown",
        fecharDialogoComEscape,
        { once:true }
    );

    return overlay;

}


function fecharDialogoComEscape(evento){

    if(evento.key === "Escape"){
        fecharDialogo();
    }

}


function mostrarAlerta({
    titulo = "Aviso",
    mensagem = "",
    icone = "info",
    textoBotao = "Entendi",
    aoFechar = null
} = {}){

    criarEstruturaDialogo({

        titulo,
        mensagem,
        icone,

        botoes:`
            <button
                id="botaoConfirmarDialogo"
                type="button"
                class="btnAzul"
            >

                <span class="material-icons-round">
                    check
                </span>

                ${typeof escaparHTMLComponente === "function"
                    ? escaparHTMLComponente(textoBotao)
                    : textoBotao
                }

            </button>
        `

    });

    const botao =
        document.getElementById(
            "botaoConfirmarDialogo"
        );

    botao.focus();

    botao.onclick = function(){

        fecharDialogo();

        if(typeof aoFechar === "function"){
            aoFechar();
        }

    };

}


function mostrarConfirmacao({
    titulo = "Confirmar ação",
    mensagem = "",
    icone = "help",
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    classeConfirmar = "btnVermelho",
    aoConfirmar = null,
    aoCancelar = null
} = {}){

    criarEstruturaDialogo({

        titulo,
        mensagem,
        icone,

        botoes:`
            <button
                id="botaoCancelarDialogo"
                type="button"
            >

                <span class="material-icons-round">
                    close
                </span>

                ${typeof escaparHTMLComponente === "function"
                    ? escaparHTMLComponente(textoCancelar)
                    : textoCancelar
                }

            </button>

            <button
                id="botaoConfirmarDialogo"
                type="button"
                class="${classeConfirmar}"
            >

                <span class="material-icons-round">
                    check
                </span>

                ${typeof escaparHTMLComponente === "function"
                    ? escaparHTMLComponente(textoConfirmar)
                    : textoConfirmar
                }

            </button>
        `

    });

    const botaoCancelar =
        document.getElementById(
            "botaoCancelarDialogo"
        );

    const botaoConfirmar =
        document.getElementById(
            "botaoConfirmarDialogo"
        );

    botaoCancelar.focus();

    botaoCancelar.onclick = function(){

        fecharDialogo();

        if(typeof aoCancelar === "function"){
            aoCancelar();
        }

    };

    botaoConfirmar.onclick = function(){

        fecharDialogo();

        if(typeof aoConfirmar === "function"){
            aoConfirmar();
        }

    };

}


function mostrarPrompt({
    titulo = "Digite uma informação",
    mensagem = "",
    label = "Valor",
    valor = "",
    placeholder = "",
    tipo = "text",
    icone = "edit",
    textoConfirmar = "Salvar",
    textoCancelar = "Cancelar",
    obrigatorio = false,
    aoConfirmar = null,
    aoCancelar = null
} = {}){

    const labelSeguro =
        typeof escaparHTMLComponente === "function"
        ? escaparHTMLComponente(label)
        : String(label ?? "");

    const valorSeguro =
        typeof escaparHTMLComponente === "function"
        ? escaparHTMLComponente(valor)
        : String(valor ?? "");

    const placeholderSeguro =
        typeof escaparHTMLComponente === "function"
        ? escaparHTMLComponente(placeholder)
        : String(placeholder ?? "");

    const tiposPermitidos = [
        "text",
        "number",
        "date",
        "time",
        "email"
    ];

    const tipoSeguro =
        tiposPermitidos.includes(tipo)
        ? tipo
        : "text";

    criarEstruturaDialogo({

        titulo,
        mensagem,
        icone,

        conteudo:`
            <div class="grupoCampo">

                <label for="campoPromptAjudaProf">
                    ${labelSeguro}
                </label>

                <input
                    id="campoPromptAjudaProf"
                    type="${tipoSeguro}"
                    value="${valorSeguro}"
                    placeholder="${placeholderSeguro}"
                    ${obrigatorio ? "required" : ""}
                    autocomplete="off"
                >

                <small
                    id="erroPromptAjudaProf"
                    class="dialogoErro"
                    hidden
                ></small>

            </div>
        `,

        botoes:`
            <button
                id="botaoCancelarDialogo"
                type="button"
            >

                <span class="material-icons-round">
                    close
                </span>

                ${
                    typeof escaparHTMLComponente === "function"
                    ? escaparHTMLComponente(textoCancelar)
                    : textoCancelar
                }

            </button>

            <button
                id="botaoConfirmarDialogo"
                type="button"
                class="btnAzul"
            >

                <span class="material-icons-round">
                    save
                </span>

                ${
                    typeof escaparHTMLComponente === "function"
                    ? escaparHTMLComponente(textoConfirmar)
                    : textoConfirmar
                }

            </button>
        `

    });

    const campo =
        document.getElementById(
            "campoPromptAjudaProf"
        );

    const erro =
        document.getElementById(
            "erroPromptAjudaProf"
        );

    const botaoCancelar =
        document.getElementById(
            "botaoCancelarDialogo"
        );

    const botaoConfirmar =
        document.getElementById(
            "botaoConfirmarDialogo"
        );

    setTimeout(()=>{
        campo.focus();
        campo.select();
    },0);

    function confirmarPrompt(){

        const resposta =
            tipoSeguro === "number"
            ? campo.value
            : campo.value.trim();

        if(
            obrigatorio &&
            resposta === ""
        ){

            erro.textContent =
                "Preencha este campo.";

            erro.hidden = false;

            campo.focus();

            return;

        }

        fecharDialogo();

        if(typeof aoConfirmar === "function"){
            aoConfirmar(resposta);
        }

    }

    botaoCancelar.onclick = function(){

        fecharDialogo();

        if(typeof aoCancelar === "function"){
            aoCancelar();
        }

    };

    botaoConfirmar.onclick =
        confirmarPrompt;

    campo.addEventListener(
        "keydown",
        evento => {

            if(evento.key === "Enter"){

                evento.preventDefault();

                confirmarPrompt();

            }

        }
    );

}


window.removerDialogoAtual =
removerDialogoAtual;

window.fecharDialogo =
fecharDialogo;

window.mostrarAlerta =
mostrarAlerta;

window.mostrarConfirmacao =
mostrarConfirmacao;

window.mostrarPrompt =
mostrarPrompt;