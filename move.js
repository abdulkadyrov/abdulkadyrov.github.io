const STORAGE_KEY = "loto-game-state-v2";
const numbersRange = 90;
const maxLuckyNumbers = 15;

let numbers = [];
let calledNumbers = [];
let luckyNumbers = [];
let autoDrawInterval = null;

const numberEl = document.getElementById("number");
const calledListEl = document.getElementById("calledList");
const button = document.getElementById("drawBtn");
const autoBtn = document.getElementById("autoBtn");
const remainingEl = document.getElementById("remaining");
const intervalInput = document.getElementById("intervalInput");
const cheatPanel = document.getElementById("cheat-panel");
const cheatInput = document.getElementById("cheat-input");
const checkInputs = Array.from(document.querySelectorAll("#check-inputs input"));
const checkResultsEl = document.getElementById("check-results");

restoreGame();
registerServiceWorker();
bindPersistentInputs();

function defaultNumbers() {
  return Array.from({ length: numbersRange }, (_, i) => i + 1);
}

function initGame() {
  numbers = defaultNumbers();
  calledNumbers = [];
  luckyNumbers = [];
  clearAutoDraw();
  numberEl.innerText = "–";
  remainingEl.innerText = `Осталось: ${numbers.length}`;
  button.disabled = false;
  autoBtn.disabled = false;
  button.style.backgroundColor = "";
  autoBtn.style.backgroundColor = "";
  autoBtn.innerText = "▶ Авто-режим";
  intervalInput.value = "2";
  cheatInput.value = "";
  calledListEl.innerHTML = "";
  checkResultsEl.innerHTML = "";
  showCheatInput(false);
  checkInputs.forEach((input) => {
    input.value = "";
  });
  removeEndMessage();
  saveState();
}

function restoreGame() {
  const rawState = localStorage.getItem(STORAGE_KEY);
  if (!rawState) {
    initGame();
    return;
  }

  try {
    const state = JSON.parse(rawState);
    const savedCalled = sanitizeNumberList(state.calledNumbers);
    const savedLucky = sanitizeNumberList(state.luckyNumbers).slice(0, maxLuckyNumbers);
    const savedNumberPool = sanitizeNumberList(state.numbers);
    const derivedNumberPool = defaultNumbers().filter((n) => !savedCalled.includes(n));
    numbers = savedNumberPool.length + savedCalled.length === numbersRange ? savedNumberPool : derivedNumberPool;
    calledNumbers = savedCalled;
    luckyNumbers = savedLucky;
    numberEl.innerText = state.currentNumber ?? (calledNumbers.at(-1) ?? "–");
    remainingEl.innerText = `Осталось: ${numbers.length}`;
    intervalInput.value = String(sanitizeInterval(state.intervalSeconds));
    button.disabled = numbers.length === 0;
    autoBtn.disabled = numbers.length === 0;
    autoBtn.innerText = "▶ Авто-режим";
    autoBtn.style.backgroundColor = "";
    button.style.backgroundColor = "";
    cheatInput.value = luckyNumbers.join(", ");
    showCheatInput(Boolean(state.isCheatPanelOpen));
    renderCalledNumbers();
    restoreCheckInputs(state.checkInputs);
    renderCheckResults(sanitizeCheckResults(state.checkResults));
    if (numbers.length === 0) {
      showFinishedState();
    } else {
      removeEndMessage();
    }
  } catch (error) {
    console.error("Не удалось восстановить состояние игры:", error);
    initGame();
  }
}

function sanitizeNumberList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return [...new Set(
    list
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= numbersRange)
  )].sort((a, b) => a - b);
}

function sanitizeCheckResults(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((entry) => ({
      value: Number.parseInt(entry?.value, 10),
      found: Boolean(entry?.found)
    }))
    .filter((entry) => Number.isInteger(entry.value) && entry.value >= 1 && entry.value <= numbersRange);
}

function restoreCheckInputs(values) {
  if (!Array.isArray(values)) {
    checkInputs.forEach((input) => {
      input.value = "";
    });
    return;
  }

  checkInputs.forEach((input, index) => {
    const value = Number.parseInt(values[index], 10);
    input.value = Number.isInteger(value) && value >= 1 && value <= numbersRange ? String(value) : "";
  });
}

function saveState() {
  const state = {
    numbers,
    calledNumbers,
    luckyNumbers,
    currentNumber: numberEl.innerText,
    intervalSeconds: sanitizeInterval(intervalInput.value),
    isCheatPanelOpen: !cheatPanel.classList.contains("hidden"),
    checkInputs: checkInputs.map((input) => input.value.trim()),
    checkResults: Array.from(checkResultsEl.children).map((node) => ({
      value: Number.parseInt(node.dataset.value, 10),
      found: node.dataset.found === "true"
    }))
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindPersistentInputs() {
  intervalInput.addEventListener("input", saveState);
  cheatInput.addEventListener("input", saveState);

  checkInputs.forEach((input) => {
    input.addEventListener("input", saveState);
  });
}

function drawNumber() {
  if (numbers.length === 0) {
    showFinishedState();
    return;
  }

  const remainingLucky = luckyNumbers.filter((n) => numbers.includes(n));
  const useLucky = remainingLucky.length > 0 && Math.random() < 0.6;
  let drawn;

  if (useLucky) {
    drawn = remainingLucky[Math.floor(Math.random() * remainingLucky.length)];
    numbers = numbers.filter((n) => n !== drawn);
  } else {
    const index = Math.floor(Math.random() * numbers.length);
    drawn = numbers.splice(index, 1)[0];
  }

  calledNumbers.push(drawn);
  calledNumbers.sort((a, b) => a - b);
  numberEl.style.animation = "none";
  void numberEl.offsetWidth;
  numberEl.style.animation = "";
  numberEl.innerText = String(drawn);
  remainingEl.innerText = `Осталось: ${numbers.length}`;
  renderCalledNumbers();
  saveState();
  speakNumber(drawn);

  if (numbers.length === 0) {
    showFinishedState();
  }
}

function renderCalledNumbers() {
  calledListEl.innerHTML = "";
  calledNumbers.forEach((n, index) => {
    const numDiv = document.createElement("div");
    numDiv.textContent = String(n);
    if (index >= calledNumbers.length - 5) {
      numDiv.style.backgroundColor = "rgba(255, 176, 32, 0.32)";
    }
    calledListEl.appendChild(numDiv);
  });
}

function speakNumber(num) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`Число ${num}`);
  utterance.lang = "ru-RU";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function checkNumbers() {
  const values = checkInputs
    .map((input) => Number.parseInt(input.value, 10))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= numbersRange);

  checkResultsEl.innerHTML = "";

  if (values.length === 0) {
    const note = document.createElement("div");
    note.className = "result-note";
    note.textContent = "Введите хотя бы одно число от 1 до 90.";
    checkResultsEl.appendChild(note);
    saveState();
    return;
  }

  const uniqueValues = [...new Set(values)];
  const results = uniqueValues.map((value) => ({
    value,
    found: calledNumbers.includes(value)
  }));

  renderCheckResults(results);

  if (uniqueValues.length !== values.length) {
    const note = document.createElement("div");
    note.className = "result-note";
    note.textContent = "Повторяющиеся числа игнорированы в проверке.";
    checkResultsEl.appendChild(note);
  }

  saveState();
}

function renderCheckResults(results) {
  checkResultsEl.innerHTML = "";

  if (results.length === 0) {
    return;
  }

  results.forEach((entry) => {
    const result = document.createElement("div");
    result.className = entry.found ? "result-ok" : "result-miss";
    result.dataset.value = String(entry.value);
    result.dataset.found = String(entry.found);
    result.textContent = `${entry.value}: ${entry.found ? "было" : "не было"}`;
    checkResultsEl.appendChild(result);
  });
}

function showCheatInput(forceState) {
  const shouldShow = typeof forceState === "boolean"
    ? forceState
    : cheatPanel.classList.contains("hidden");
  cheatPanel.classList.toggle("hidden", !shouldShow);
  cheatPanel.setAttribute("aria-hidden", String(!shouldShow));
  saveState();
}

function saveCheatNumbers() {
  const raw = cheatInput.value;
  luckyNumbers = sanitizeNumberList(raw.split(",")).slice(0, maxLuckyNumbers);
  cheatInput.value = luckyNumbers.join(", ");
  showCheatInput(false);
  saveState();

  const message = luckyNumbers.length > 0
    ? `Режим удачи активирован. Числа: ${luckyNumbers.join(", ")}`
    : "Список удачных чисел очищен.";
  alert(message);
}

function sanitizeInterval(value) {
  const seconds = Number.parseFloat(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 2;
  }

  return seconds;
}

function toggleAutoDraw() {
  if (autoDrawInterval) {
    clearAutoDraw();
    autoBtn.innerText = "▶ Авто-режим";
    autoBtn.style.backgroundColor = "";
    saveState();
    return;
  }

  if (numbers.length === 0) {
    showFinishedState();
    return;
  }

  const seconds = sanitizeInterval(intervalInput.value);
  intervalInput.value = String(seconds);
  drawNumber();

  if (numbers.length === 0) {
    return;
  }

  autoDrawInterval = window.setInterval(drawNumber, seconds * 1000);
  autoBtn.innerText = "⏸ Остановить";
  autoBtn.style.backgroundColor = "#ffb020";
  saveState();
}

function clearAutoDraw() {
  if (autoDrawInterval) {
    clearInterval(autoDrawInterval);
    autoDrawInterval = null;
  }
}

function showFinishedState() {
  clearAutoDraw();
  numberEl.innerText = calledNumbers.at(-1) ? String(calledNumbers.at(-1)) : "✔";
  button.disabled = true;
  autoBtn.disabled = true;
  autoBtn.innerText = "✔ Завершено";
  button.style.backgroundColor = "#6f7d92";
  autoBtn.style.backgroundColor = "#6f7d92";
  remainingEl.innerText = "Осталось: 0";

  if (!document.querySelector(".end-message")) {
    const msg = document.createElement("div");
    msg.className = "end-message";
    msg.textContent = "Все номера вытянуты!";
    document.querySelector(".app-shell").appendChild(msg);
  }

  saveState();
}

function removeEndMessage() {
  const msg = document.querySelector(".end-message");
  if (msg) {
    msg.remove();
  }
}

function restartGame() {
  localStorage.removeItem(STORAGE_KEY);
  initGame();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Не удалось зарегистрировать service worker:", error);
    });
  });
}
