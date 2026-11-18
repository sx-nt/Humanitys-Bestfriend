// PAINEL DA SENHA DO COFRE
import { $ } from "../core/utils.js";

let getCode = () => "";
let onUnlock = null;
let onHint = null;

export function openSafePanel() {
    const input = $("safe-code");
    const feedback = $("safe-feedback");

    $("safe-panel").classList.remove("hidden");
    feedback.textContent = "";
    feedback.className = "safe-feedback";
    input.value = "";
    input.focus();
}

export function closeSafePanel() {
    $("safe-panel").classList.add("hidden");
}

function submitSafeCode() {
    const feedback = $("safe-feedback");

    if ($("safe-code").value.replace(/\D/g, "") !== getCode()) {
        feedback.textContent = "SENHA INCORRETA";
        feedback.className = "safe-feedback error";
        return;
    }

    closeSafePanel();
    onUnlock?.();
}

function handleKeydown(event) {
    if (event.key === "Enter") submitSafeCode();
    if (event.key === "Escape") closeSafePanel();
}

// Botão "?": fecha o painel e mostra a dica (game/house.js)
function requestHint() {
    closeSafePanel();
    onHint?.();
}

export function initSafePanel({ getCode: codeGetter, onUnlock: callback, onHint: hintCallback }) {
    getCode = codeGetter;
    onUnlock = callback;
    onHint = hintCallback;

    $("safe-hint").addEventListener("click", requestHint);
    $("safe-cancel").addEventListener("click", closeSafePanel);
    $("safe-submit").addEventListener("click", submitSafeCode);
    $("safe-code").addEventListener("keydown", handleKeydown);
}
