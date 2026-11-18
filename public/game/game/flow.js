// FLUXO DA PARTIDA: iniciar, reiniciar, game over, livro lido e fim do jogo.
import { state, resetState } from "../core/state.js";
import { $, preloadImage } from "../core/utils.js";
import { stopBootSound, playBackgroundMusic, pauseBackgroundMusic } from "../core/audio.js";
import { closeDialogue, showDialogue } from "../ui/dialogue.js";
import { resetObjectives, closeObjectives } from "../ui/objectives.js";
import { notify } from "../ui/notifications.js";
import { showHud, hideHud, closePause, updateBattery, updateBlindfoldButton } from "../ui/hud.js";
import { updateInventory, closeInventory } from "../ui/inventory.js";
import { closeReadingModals } from "../ui/readers.js";
import { closeSafePanel } from "../ui/safe.js";
import { showFeiraReward, resetFeira } from "../ui/feira.js";
import { crtTransition } from "../ui/transitions.js";
import { loadScene, cancelSceneLoad, refreshSceneUI } from "./scene-loader.js";
import { startBoot } from "./boot.js";

// Fecha painéis, modais e diálogos e cancela carregamentos pendentes.
function interruptGameplay() {
    cancelSceneLoad();
    closeDialogue();
    closeInventory();
    closeObjectives();
    closePause();
    closeSafePanel();
    closeReadingModals();
    hideLoadingScreen();
}

function hideScreens(...ids) {
    ids.forEach(id => $(id).classList.add("hidden"));
}

// INICIAR JOGO
export function startGame() {
    interruptGameplay();
    stopBootSound();

    resetState();
    resetObjectives();
    resetFeira();
    setGameOverText();

    hideScreens("start-screen", "boot-screen", "game-over", "chapter-end", "loading-screen", "scene", "interface");
    $("game").classList.remove("blindfold-active");

    updateInventory();
    updateBattery();
    updateBlindfoldButton();
    showHud();

    playBackgroundMusic();
    loadScene("beach");
}

// REINICIAR (volta para a tela de boot)
export function restartGame() {
    interruptGameplay();
    hideHud();
    pauseBackgroundMusic();
    startBoot(startGame);
}

// GAME OVER
// Bloqueia toda a interação até o jogador reiniciar.
// message (opcional) substitui o texto padrão da tela de game over.
let defaultGameOverText = null;

function setGameOverText(message = null) {
    const text = $("game-over").querySelector("p");
    if (!text) return;
    if (defaultGameOverText === null) defaultGameOverText = text.textContent;
    text.textContent = message || defaultGameOverText;
}

export function gameOver(message = null) {
    if (state.isGameOver) return;

    interruptGameplay();
    state.isGameOver = true;

    hideHud();
    hideScreens("interface");
    pauseBackgroundMusic();

    setGameOverText(message);
    $("game-over").classList.remove("hidden");
    $("restart-button").focus();
}

// LIVRO LIDO
// Fechar o livro depois de chegar à última página libera "Explorar a cidade"
// e leva o jogador de volta ao quarto.
export function handleBookClosed(reachedEnd) {
    if (!reachedEnd || state.bookRead || state.isGameOver || state.gameFinished) return;

    state.bookRead = true;
    closeInventory();
    closeReadingModals();

    loadScene("quarto", () => {
        showDialogue(["A cidade... Preciso ver com meus próprios olhos."], () => {
            showDialogue(["Nova opção disponível: Explorar a cidade"], refreshSceneUI, "MEE SYSTEM");
        }, "MEE");
    });
}

// FIM DO JOGO
// "Explorar a cidade" (com a venda) mostra uma tela de carregamento, depois a
// construção na cidade com uma fala do MEE e, após alguns segundos nessa
// cena, a tela de jogo finalizado com a Feira de Jogos.
const LOADING_DURATION_MS = 2800;
const CONSTRUCTION_HOLD_MS = 4500;
const CONSTRUCTION_IMAGE = "assets/maps/C_Venda/construcao_com_venda.png";
const CONSTRUCTION_LINES = ["Há algo de estranho nesse lugar..."];

let loadingTimer = null;
// Invalida etapas pendentes do final quando a partida é interrompida.
let endingRun = 0;

function hideLoadingScreen() {
    endingRun++;
    clearTimeout(loadingTimer);
    loadingTimer = null;

    const screen = $("loading-screen");
    screen.classList.add("hidden");
    screen.classList.remove("is-loading");
}

export function finishGame() {
    if (state.isGameOver || state.gameFinished) return;

    interruptGameplay();
    state.gameFinished = true;
    const run = endingRun;

    hideHud();
    hideScreens("interface");

    const screen = $("loading-screen");
    screen.classList.remove("hidden");
    void screen.offsetWidth; // reinicia a animação da barra
    screen.classList.add("is-loading");

    preloadImage(CONSTRUCTION_IMAGE);
    loadingTimer = setTimeout(() => {
        if (run === endingRun) showConstruction(run);
    }, LOADING_DURATION_MS);
}

function showConstruction(run) {
    crtTransition(() => {
        if (run !== endingRun) return;

        $("loading-screen").classList.add("hidden");
        $("loading-screen").classList.remove("is-loading");

        const background = $("background");
        background.classList.remove("scene-enter");
        background.src = CONSTRUCTION_IMAGE;
        void background.offsetWidth;
        background.classList.add("scene-enter");
        $("mirror-key-overlay").classList.add("hidden");
        $("scene").classList.remove("hidden");

        showDialogue(CONSTRUCTION_LINES, () => {
            if (run !== endingRun) return;
            // Deixa o jogador olhando a construção antes da tela final
            loadingTimer = setTimeout(() => {
                if (run !== endingRun) return;
                crtTransition(() => {
                    if (run === endingRun) showChapterEnd();
                });
            }, CONSTRUCTION_HOLD_MS);
        }, "MEE");
    });
}

function showChapterEnd() {
    hideScreens("scene");
    notify("Jogo finalizado", "Obrigado por jogar!");

    $("chapter-end").classList.remove("hidden");
    showFeiraReward();
    $("chapter-end-restart").focus();
}
