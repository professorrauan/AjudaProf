/*
==================================================
AJUDA+PROF — ARMAZENAMENTO LOCAL
==================================================

Este módulo centraliza a leitura, gravação e remoção
de dados estruturados no localStorage.
*/

/**
 * Lê e converte um valor JSON salvo no localStorage.
 *
 * @param {string} chave
 * @param {*} valorPadrao
 * @returns {*}
 */
function lerDados(chave, valorPadrao = null){

    if(
        typeof chave !== "string" ||
        chave.trim() === ""
    ){

        console.warn(
            "⚠️ lerDados recebeu uma chave inválida:",
            chave
        );

        return valorPadrao;

    }

    try{

        const conteudo =
            localStorage.getItem(chave);

        if(conteudo === null){

            return valorPadrao;

        }

        return JSON.parse(conteudo);

    }catch(erro){

        console.error(
            `❌ Erro ao ler "${chave}" do armazenamento:`,
            erro
        );

        return valorPadrao;

    }

}


/**
 * Salva um valor convertido para JSON.
 *
 * @param {string} chave
 * @param {*} dados
 * @returns {boolean}
 */
function salvarDados(chave, dados){

    if(
        typeof chave !== "string" ||
        chave.trim() === ""
    ){

        console.warn(
            "⚠️ salvarDados recebeu uma chave inválida:",
            chave
        );

        return false;

    }

    try{

        localStorage.setItem(
            chave,
            JSON.stringify(dados)
        );

        return true;

    }catch(erro){

        console.error(
            `❌ Erro ao salvar "${chave}" no armazenamento:`,
            erro
        );

        if(
            typeof mostrarToast === "function"
        ){

            mostrarToast(
                "⚠️ Não foi possível salvar os dados."
            );

        }

        return false;

    }

}


/**
 * Remove uma chave do localStorage.
 *
 * @param {string} chave
 * @returns {boolean}
 */
function removerDados(chave){

    if(
        typeof chave !== "string" ||
        chave.trim() === ""
    ){

        console.warn(
            "⚠️ removerDados recebeu uma chave inválida:",
            chave
        );

        return false;

    }

    try{

        localStorage.removeItem(chave);

        return true;

    }catch(erro){

        console.error(
            `❌ Erro ao remover "${chave}" do armazenamento:`,
            erro
        );

        return false;

    }

}


/**
 * Verifica se determinada chave existe.
 *
 * @param {string} chave
 * @returns {boolean}
 */
function existeDado(chave){

    if(
        typeof chave !== "string" ||
        chave.trim() === ""
    ){

        return false;

    }

    return localStorage.getItem(chave) !== null;

}


/*
Disponibiliza as funções para todos os módulos.
*/

window.lerDados = lerDados;
window.salvarDados = salvarDados;
window.removerDados = removerDados;
window.existeDado = existeDado;