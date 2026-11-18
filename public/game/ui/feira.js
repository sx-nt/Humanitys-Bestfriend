// FEIRA DE JOGOS: resgate de tijolinhos na tela de fim do capítulo.
// O botão oficial do Google faz o login e credita os tijolinhos; o link
// "Resgatar tijolinhos na Feira de Jogos" abre o site da Feira em outra aba.
// Carrega o Google Identity Services (GSI) só quando precisa, sem bloquear o
// início do jogo, e envia o crédito para a API da Feira com fetch.
import { $ } from "../core/utils.js";
import { feiraConfig } from "../data/feira-config.js";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const GSI_TIMEOUT_MS = 10000;

const MESSAGES = Object.freeze({
    loading: "Conectando à Feira de Jogos...",
    ready: "",
    sending: "Enviando crédito...",
    success: value => `${value} tijolinhos creditados na sua conta! Veja na Feira de Jogos.`,
    error: "Erro ao adicionar crédito :( Tente entrar novamente.",
    loginError: "Não foi possível entrar com o Google. Tente novamente.",
    offline: "Não foi possível conectar ao Google. Verifique sua conexão e tente novamente."
});

let gsiPromise = null;
let gsiInitialized = false;
let retryBound = false;

// Estado por partida (zerado em resetFeira).
let credited = false;
let sending = false;
let runId = 0;

function gsi() {
    return window.google?.accounts?.id;
}

// Carrega o script do GSI uma única vez. Em caso de falha, permite nova tentativa.
function loadGsi() {
    if (gsi()) return Promise.resolve(gsi());
    if (gsiPromise) return gsiPromise;

    gsiPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const timer = setTimeout(() => fail(new Error("tempo esgotado ao carregar o GSI")), GSI_TIMEOUT_MS);

        function fail(error) {
            clearTimeout(timer);
            script.onload = script.onerror = null;
            script.remove();
            gsiPromise = null;
            reject(error);
        }

        script.src = GSI_SRC;
        script.async = true;
        script.onload = () => {
            clearTimeout(timer);
            if (gsi()) resolve(gsi());
            else fail(new Error("GSI indisponível após o carregamento"));
        };
        script.onerror = () => fail(new Error("falha ao carregar o GSI"));
        document.head.appendChild(script);
    });

    return gsiPromise;
}

function setStatus(message, kind = "") {
    const status = $("feira-status");
    status.textContent = message;
    status.dataset.kind = kind;
}

function showGoogleButton(visible) {
    $("feira-google-button").classList.toggle("hidden", !visible);
}

async function sendCredit(credential) {
    const response = await fetch(feiraConfig.apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credential}`
        },
        body: JSON.stringify({
            product: feiraConfig.productId,
            value: feiraConfig.creditValue
        })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// Callback do GSI: recebe o token (JWT) do Google e credita na Feira.
async function handleCredential(res) {
    if (credited || sending) return;

    if (!res || res.error || !res.credential) {
        console.warn("Feira de Jogos: login do Google falhou", res?.error);
        setStatus(MESSAGES.loginError, "error");
        return;
    }

    const run = runId;
    sending = true;
    setStatus(MESSAGES.sending);

    try {
        await sendCredit(res.credential);
        if (run !== runId) return;
        credited = true;
        showGoogleButton(false);
        $("feira-hint").classList.add("hidden");
        setStatus(MESSAGES.success(feiraConfig.creditValue), "success");
    } catch (error) {
        console.warn("Feira de Jogos: erro ao adicionar crédito", error);
        if (run !== runId) return;
        setStatus(MESSAGES.error, "error");
    } finally {
        if (run === runId) sending = false;
    }
}

function initGsi(id) {
    if (gsiInitialized) return;
    id.initialize({
        client_id: feiraConfig.clientId,
        callback: handleCredential,
        ux_mode: "popup",
        use_fedcm_for_prompt: true,
        cancel_on_tap_outside: false
    });
    gsiInitialized = true;
}

// Abre o One Tap. Se o navegador não exibir (bloqueio, cooldown, iframe),
// o botão oficial do Google continua disponível na tela.
function prompt(id) {
    try {
        id.prompt();
    } catch (error) {
        console.warn("Feira de Jogos: One Tap indisponível", error);
    }
}

async function connect() {
    const run = runId;
    $("feira-retry").classList.add("hidden");
    setStatus(MESSAGES.loading);

    let id;
    try {
        id = await loadGsi();
    } catch (error) {
        console.warn("Feira de Jogos:", error.message);
        if (run !== runId) return;
        setStatus(MESSAGES.offline, "error");
        $("feira-retry").classList.remove("hidden");
        return;
    }

    if (run !== runId || credited) return;

    try {
        initGsi(id);

        // Botão oficial do Google como alternativa ao One Tap.
        const container = $("feira-google-button");
        showGoogleButton(true);
        if (!container.hasChildNodes()) {
            id.renderButton(container, {
                theme: "filled_black",
                size: "large",
                text: "signin_with",
                locale: "pt-BR"
            });
        }
        setStatus(MESSAGES.ready);

        prompt(id);
    } catch (error) {
        console.warn("Feira de Jogos: erro no GSI", error);
        setStatus(MESSAGES.loginError, "error");
    }
}

// Chamada no fim do capítulo.
export function showFeiraReward() {
    const section = $("feira-reward");
    if (!feiraConfig.enabled || !section) return;

    if (!retryBound) {
        $("feira-retry").addEventListener("click", () => {
            if (!credited && !sending) connect();
        });
        retryBound = true;
    }

    $("feira-amount").textContent = feiraConfig.creditValue;
    $("feira-link").href = feiraConfig.siteUrl;

    section.classList.remove("hidden");
    if (!credited && !sending) connect();
}

// Chamada ao (re)iniciar a partida: libera um novo resgate.
export function resetFeira() {
    runId++;
    credited = false;
    sending = false;

    const section = $("feira-reward");
    if (!section) return;

    section.classList.add("hidden");
    setStatus("");
    showGoogleButton(false);
    $("feira-hint").classList.remove("hidden");
    $("feira-retry").classList.add("hidden");
    try {
        gsi()?.cancel?.();
    } catch {
        // One Tap já fechado
    }
}
