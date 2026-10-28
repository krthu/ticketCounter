const STORAGE_KEY = "ticket-app-state";

const setupSection = document.querySelector(".setup");
const drawSection = document.querySelector(".draw");
const setupForm = document.getElementById("setupForm");
const countInput = document.getElementById("numberOfTickets");
const presetButtons = document.querySelectorAll("[data-preset]");
const newRoundButton = document.getElementById("newRound");
const drawButton = document.getElementById("drawNumber");
const undoButton = document.getElementById("undo");
const winnerLabelEl = document.querySelector(".winnerLabel");
const winningNumberEl = document.querySelector(".winningNumber");
const ticketsLeftEl = document.querySelector(".ticketsLeft");
const ticketsTotalEl = document.querySelector(".ticketsTotal");
const numberDrawnList = document.querySelector(".numberDrawn");

// null = no round started; otherwise { total, pool, current, history }
// history holds earlier winners, newest first. current is the winner on screen.
let state = loadState();

setupForm.addEventListener("submit", startRound);
presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
        countInput.value = button.dataset.preset;
    });
});
newRoundButton.addEventListener("click", newRound);
drawButton.addEventListener("click", drawNumber);
undoButton.addEventListener("click", undoDraw);

render();

function startRound(event) {
    event.preventDefault();
    const numberOfTickets = Number(countInput.value);
    if (!Number.isInteger(numberOfTickets) || numberOfTickets < 1 || numberOfTickets > 10000) {
        countInput.reportValidity();
        return;
    }

    const pool = [];
    for (let ticket = 1; ticket <= numberOfTickets; ticket++) {
        pool.push(ticket);
    }
    state = { total: numberOfTickets, pool, current: null, history: [] };
    saveState();
    render();
}

function drawNumber() {
    if (!state || state.pool.length === 0) return;

    const index = Math.floor(Math.random() * state.pool.length);
    const [winningNumber] = state.pool.splice(index, 1);
    if (state.current !== null) {
        state.history.unshift(state.current);
    }
    state.current = winningNumber;
    saveState();
    render();
}

function undoDraw() {
    if (!state || state.current === null) return;

    state.pool.push(state.current);
    state.current = state.history.length ? state.history.shift() : null;
    saveState();
    render();
}

function newRound() {
    if (state && state.current !== null && !confirm("Starta en ny omgång? Den här dragningen nollställs.")) {
        return;
    }
    if (state) countInput.value = state.total;
    state = null;
    saveState();
    render();
}

function render() {
    setupSection.hidden = state !== null;
    drawSection.hidden = state === null;
    newRoundButton.hidden = state === null;
    if (!state) return;

    const waiting = state.current === null;
    const shown = waiting ? "?" : String(state.current);
    winnerLabelEl.textContent = waiting ? "Ingen lott dragen än" : "Vinnande lott";
    winningNumberEl.textContent = shown;
    winningNumberEl.classList.toggle("is-waiting", waiting);
    // Size by the largest ticket number so the font stays the same for the whole round.
    winningNumberEl.style.setProperty("--digits", String(state.total).length);
    ticketsLeftEl.textContent = state.pool.length;
    ticketsTotalEl.textContent = state.total;

    const empty = state.pool.length === 0;
    drawButton.disabled = empty;
    drawButton.textContent = empty ? "Alla dragna" : "Dra lott";
    undoButton.disabled = state.current === null;

    numberDrawnList.replaceChildren(...state.history.map((number) => {
        const li = document.createElement("li");
        li.textContent = number;
        return li;
    }));
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && saved.total > 0 && Array.isArray(saved.pool) && Array.isArray(saved.history)) {
            return saved;
        }
    } catch {
        // Storage unavailable (private mode) or corrupt — start fresh.
    }
    return null;
}

function saveState() {
    try {
        if (state) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // Storage unavailable — the app still works, it just won't survive a reload.
    }
}
