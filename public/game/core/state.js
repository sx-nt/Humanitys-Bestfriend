// ESTADO DO JOGO
// Objeto único compartilhado por todos os módulos. resetState() é usado
// tanto ao iniciar quanto ao reiniciar, evitando listas de reset duplicadas.
// (Os objetivos têm estado próprio em ui/objectives.js.)

// Data impressa na identidade (03.03.3030)
const SAFE_DATE_CODE = "030330";

function randomRecord() {
    return String(Math.floor(Math.random() * 21)).padStart(2, "0");
}

function createInitialState() {
    return {
        currentScene: null,

        // Venda
        hasBlindfold: false,
        blindfoldOn: false,

        // Praia
        debrisExamined: false,
        machineZoomActive: false,

        // Portões e frente da casa
        gatesReady: false,
        warnings: 0, // advertências do Agente ao voltar aos portões
        toolsExamined: false,
        hasHammer: false,
        hasNails: false,

        // Quarto
        windowsCovered: false,
        pictureExamined: false,
        safeOpen: false,
        bookCollected: false,
        keyCollected: false,
        cabinetUnlocked: false,
        documentFound: false,
        bookRead: false,

        // Cofre: número do registro dito pelo Agente (00 a 20, sorteado a
        // cada partida). Senha = registro + data da identidade (030330).
        residentRecord: randomRecord(),
        safeHintRequested: false, // jogador apertou "?" no cofre

        inventory: [],
        battery: 100,

        // Controle de fluxo
        isPaused: false,
        isGameOver: false,
        gameFinished: false, // "Explorar a cidade": carregamento e tela final
        sceneLoading: false
    };
}

export const state = createInitialState();

export function resetState() {
    Object.assign(state, createInitialState());
}

// Senha do cofre da partida atual
export function safeCode() {
    return state.residentRecord + SAFE_DATE_CODE;
}

// Campos de progresso gravados pelo "Salvar jogo"
export function getProgressSnapshot() {
    const { isPaused, isGameOver, gameFinished, sceneLoading, ...progress } = state;
    return { ...progress, inventory: [...state.inventory] };
}
