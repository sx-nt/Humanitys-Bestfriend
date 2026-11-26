// AÇÕES DE CADA CENÁRIO
// Cada cenário retorna a lista de botões [rótulo, ação] conforme o estado.
import { state } from "../core/state.js";
import { $ } from "../core/utils.js";
import { hasItem } from "../ui/inventory.js";
import { openSafePanel } from "../ui/safe.js";
import { loadScene, isInteractionBlocked } from "./scene-loader.js";
import { examineDebris, collectWood, goToGates, returnToGates, examineTools, collectTools } from "./outside.js";
import {
    examineWindow, coverWindows, collectKey, examineCabinet, examinePicture,
    removePicture, goToSafe, collectBook, exploreCity
} from "./house.js";

const go = (sceneName) => () => loadScene(sceneName);

const HOTSPOT_POSITIONS = {
    beach: {
        "Examinar destroços": [20, 62, 20, 29],
        "Coletar madeira": [20, 62, 20, 29],
        "Ir para os portões": [39, 38, 22, 56]
    },
    houseFront: {
        "Coletar ferramentas": [27, 72, 14, 24],
        "Entrar na casa": [39, 43, 25, 38],
        "Examinar ferramentas": [27, 72, 14, 24]
    },
    quarto: {
        "Examinar quadro": [27, 4, 19, 40],
        "Examinar espelho": [69, 4, 19, 40],
        "Examinar armário": [39, 43, 23, 40],
        "Explorar a cidade": [72, 51, 26, 43],
        "Voltar aos portões": [0, 40, 15, 55],
        "Examinar janelas": [71, 4, 25, 42]
    },
    quadroZoom: {
        "Remover o quadro": [20, 10, 60, 75],
        "Acessar cofre": [20, 10, 60, 75],
        "Voltar ao quarto": [0, 42, 18, 50]
    },
    cofre: {
        "Voltar": [0, 42, 18, 50],
        "Inserir senha": [25, 12, 50, 76]
    },
    cofreAberto: {
        "Pegar o livro": [30, 12, 40, 76],
        "Voltar ao quarto": [0, 42, 18, 50]
    },
    ww: {
        "Tapar as janelas": [20, 8, 60, 78],
        "Voltar ao quarto": [0, 42, 18, 50]
    },
    mirror: {
        "Coletar chave": [34, 20, 32, 58],
        "Voltar ao quarto": [0, 42, 18, 50]
    }
};

const SCENE_ACTIONS = {

    beach: (s) => [
        !s.debrisExamined && ["Examinar destroços", examineDebris],
        s.debrisExamined && !hasItem("madeira") && ["Coletar madeira", collectWood],
        s.hasBlindfold && ["Ir para os portões", goToGates]
    ],

    houseFront: (s) => [
        s.toolsExamined && (!s.hasHammer || !s.hasNails) && ["Coletar ferramentas", collectTools],
        ["Entrar na casa", go("quarto")],
        !s.toolsExamined && ["Examinar ferramentas", examineTools]
    ],

    quarto: (s) => [
        ["Examinar quadro", examinePicture],
        ["Examinar espelho", go("mirror")],
        ["Examinar armário", examineCabinet],
        ["Explorar a cidade", exploreCity],
        ["Voltar aos portões", returnToGates],
        !s.windowsCovered && ["Examinar janelas", examineWindow]
    ],

    quadroZoom: (s) => [
        !s.pictureExamined && ["Remover o quadro", removePicture],
        s.pictureExamined && ["Acessar cofre", goToSafe],
        ["Voltar ao quarto", go("quarto")]
    ],

    cofre: (s) => [
        ["Voltar", go("quadroZoom")],
        !s.safeOpen && ["Inserir senha", openSafePanel]
    ],

    cofreAberto: (s) => [
        !s.bookCollected && ["Pegar o livro", collectBook],
        ["Voltar ao quarto", go("quarto")]
    ],

    ww: (s) => [
        !s.windowsCovered && ["Tapar as janelas", coverWindows],
        ["Voltar ao quarto", go("quarto")]
    ],

    mirror: (s) => [
        !s.keyCollected && !s.blindfoldOn && ["Coletar chave", collectKey],
        ["Voltar ao quarto", go("quarto")]
    ]
};

function createActionButton(label, action, position) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scene-hotspot";
    button.setAttribute("aria-label", label);
    button.textContent = label;
    button.style.left = `${position[0]}%`;
    button.style.top = `${position[1]}%`;
    button.style.width = `${position[2]}%`;
    button.style.height = `${position[3]}%`;

    // Ignora cliques durante transição, diálogo, pausa ou game over
    button.addEventListener("click", () => {
        if (isInteractionBlocked()) return;
        action();
    });

    return button;
}

export function updateSceneActions() {
    const container = $("scene-actions");
    const getActions = SCENE_ACTIONS[state.currentScene];
    const actions = getActions ? getActions(state).filter(Boolean) : [];
    const positions = HOTSPOT_POSITIONS[state.currentScene] ?? {};

    container.replaceChildren(...actions.map(([label, action], index) => {
        const fallbackPosition = [5 + index * 15, 82, 13, 14];
        return createActionButton(label, action, positions[label] ?? fallbackPosition);
    }));
}
