import { $ } from "../core/utils.js";

const BUTTONS = {
    confirm: 0,
    back: 1,
    inventory: 3,
    objectives: 2,
    start: 9
};
const DIRECTIONS = { up: 12, down: 13, left: 14, right: 15 };
const AXIS_DEADZONE = 0.18;
const FOCUS_REPEAT_DELAY = 180;
const CURSOR_SPEED = 620;
const BLOCKING_LAYERS = [
    "dialogue",
    "pause-menu",
    "inventory",
    "objectives",
    "safe-panel",
    "document-viewer",
    "book-reader",
    "loading-screen"
];

let animationFrame = 0;
let activeGamepadIndex = null;
let previousButtons = [];
let previousDirection = "";
let nextFocusRepeatAt = 0;
let previousFrameAt = 0;
let cursorX = 0;
let cursorY = 0;
let cursorWasActive = false;

function getVisibleControls() {
    return [...document.querySelectorAll("button:not(:disabled)")].filter(button =>
        button.getClientRects().length > 0 &&
        getComputedStyle(button).visibility !== "hidden" &&
        (!button.matches(".scene-hotspot") || isScenePointingMode())
    );
}

function moveFocus(direction) {
    const buttons = getVisibleControls();
    if (!buttons.length) return;

    const currentIndex = buttons.indexOf(document.activeElement);
    const nextIndex = currentIndex < 0
        ? 0
        : (currentIndex + direction + buttons.length) % buttons.length;
    buttons[nextIndex].focus({ preventScroll: false });
}

function confirmFocusedControl() {
    const controls = getVisibleControls();
    const focused = controls.includes(document.activeElement)
        ? document.activeElement
        : controls[0];
    focused?.click();
}

function pressButton(gamepad, index) {
    const pressed = Boolean(gamepad.buttons[index]?.pressed);
    const justPressed = pressed && !previousButtons[index];
    previousButtons[index] = pressed;
    return justPressed;
}

function trigger(id) {
    const button = $(id);
    if (button && button.getClientRects().length > 0 && !button.disabled) button.click();
}

function isScenePointingMode() {
    const scene = $("scene");
    const actions = $("scene-actions");
    return !scene.classList.contains("hidden") &&
        !$("game").classList.contains("scene-loading") &&
        !BLOCKING_LAYERS.some(id => !$(id).classList.contains("hidden")) &&
        getComputedStyle(actions).visibility !== "hidden";
}

function getDirection(gamepad) {
    const left = gamepad.buttons[DIRECTIONS.left]?.pressed ? -1 : 0;
    const right = gamepad.buttons[DIRECTIONS.right]?.pressed ? 1 : 0;
    const up = gamepad.buttons[DIRECTIONS.up]?.pressed ? -1 : 0;
    const down = gamepad.buttons[DIRECTIONS.down]?.pressed ? 1 : 0;
    const axisX = Math.abs(gamepad.axes[0] ?? 0) >= AXIS_DEADZONE ? gamepad.axes[0] : 0;
    const axisY = Math.abs(gamepad.axes[1] ?? 0) >= AXIS_DEADZONE ? gamepad.axes[1] : 0;
    return {
        x: left || right || axisX,
        y: up || down || axisY
    };
}

function moveVirtualCursor(gamepad, deltaSeconds) {
    const scene = $("scene");
    const cursor = $("game-cursor");
    const bounds = scene.getBoundingClientRect();
    const direction = getDirection(gamepad);
    const magnitude = Math.hypot(direction.x, direction.y) || 1;
    const scale = CURSOR_SPEED * Math.min(deltaSeconds, 0.05) / magnitude;

    cursorX = Math.max(0, Math.min(bounds.width - 1, cursorX + direction.x * scale));
    cursorY = Math.max(0, Math.min(bounds.height - 1, cursorY + direction.y * scale));
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    const hovered = document.elementFromPoint(bounds.left + cursorX, bounds.top + cursorY);
    const target = hovered?.closest(".scene-hotspot");
    cursor.dataset.target = String(Boolean(target));
}

function clickHotspotAtCursor() {
    const scene = $("scene");
    const bounds = scene.getBoundingClientRect();
    const target = document.elementFromPoint(bounds.left + cursorX, bounds.top + cursorY)
        ?.closest(".scene-hotspot");
    target?.click();
}

function moveMenuFocus(gamepad, now) {
    const { x, y } = getDirection(gamepad);
    const direction = Math.abs(y) >= Math.abs(x)
        ? (y < -AXIS_DEADZONE ? "up" : y > AXIS_DEADZONE ? "down" : "")
        : (x < -AXIS_DEADZONE ? "left" : x > AXIS_DEADZONE ? "right" : "");

    if (!direction) {
        previousDirection = "";
        nextFocusRepeatAt = 0;
        return;
    }

    if (direction !== previousDirection || now >= nextFocusRepeatAt) {
        moveFocus(direction === "up" || direction === "left" ? -1 : 1);
        nextFocusRepeatAt = now + FOCUS_REPEAT_DELAY;
    }
    previousDirection = direction;
}

function updateCursorMode() {
    const scene = $("scene");
    const cursor = $("game-cursor");
    const active = activeGamepadIndex !== null && isScenePointingMode();
    scene.classList.toggle("controller-active", active);
    cursor.classList.toggle("hidden", !active);

    if (active && !cursorWasActive) {
        const bounds = scene.getBoundingClientRect();
        cursorX = bounds.width * 0.5;
        cursorY = bounds.height * 0.68;
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
    }
    cursorWasActive = active;
    return active;
}

function pollGamepad(now) {
    const gamepad = activeGamepadIndex === null
        ? null
        : navigator.getGamepads?.()[activeGamepadIndex];

    if (gamepad?.connected) {
        const deltaSeconds = previousFrameAt ? (now - previousFrameAt) / 1000 : 0;
        const pointing = updateCursorMode();

        if (pointing) moveVirtualCursor(gamepad, deltaSeconds);
        else moveMenuFocus(gamepad, now);

        if (pressButton(gamepad, BUTTONS.confirm)) {
            if (pointing) clickHotspotAtCursor();
            else confirmFocusedControl();
        }
        if (pressButton(gamepad, BUTTONS.back)) {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        }
        if (pressButton(gamepad, BUTTONS.inventory)) trigger("inventory-toggle");
        if (pressButton(gamepad, BUTTONS.objectives)) trigger("objectives-toggle");
        if (pressButton(gamepad, BUTTONS.start)) {
            if ($("pause-menu").classList.contains("hidden")) trigger("pause-button");
            else trigger("resume-button");
        }
        previousFrameAt = now;
    }

    animationFrame = requestAnimationFrame(pollGamepad);
}

function setConnected(gamepad) {
    const status = $("controller-status");
    activeGamepadIndex = gamepad?.index ?? null;
    previousButtons = [];
    previousDirection = "";
    previousFrameAt = 0;
    cursorWasActive = false;
    status.classList.toggle("hidden", !gamepad);
    status.textContent = gamepad
        ? "CONTROLE CONECTADO · DIRECIONAL mover cursor · B selecionar · A voltar · X inventário · Y objetivos · START pausa"
        : "";

    if (gamepad && !animationFrame) animationFrame = requestAnimationFrame(pollGamepad);
    if (!gamepad && animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        $("scene").classList.remove("controller-active");
        $("game-cursor").classList.add("hidden");
    }
}

export function initGamepad() {
    window.addEventListener("gamepadconnected", event => setConnected(event.gamepad));
    window.addEventListener("gamepaddisconnected", event => {
        if (event.gamepad.index === activeGamepadIndex) setConnected(null);
    });

    const connected = [...(navigator.getGamepads?.() ?? [])].find(gamepad => gamepad?.connected);
    if (connected) setConnected(connected);
}
