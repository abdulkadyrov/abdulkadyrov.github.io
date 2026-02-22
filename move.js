let numbers, calledNumbers, luckyNumbers, autoDrawInterval;
const numberEl = document.getElementById("number");
const calledListEl = document.getElementById("calledList");
const button = document.getElementById("drawBtn");
const autoBtn = document.getElementById("autoBtn");
const remainingEl = document.getElementById("remaining");

initGame();

function initGame() {
  numbers = Array.from({length: 90}, (_, i) => i + 1);
  calledNumbers = [];
  luckyNumbers = [];
  clearInterval(autoDrawInterval);
  autoDrawInterval = null;
  numberEl.innerText = '–';
  remainingEl.innerText = `Осталось: ${numbers.length}`;
  button.disabled = false;
  autoBtn.disabled = false;
  button.style.backgroundColor = "#00c853";
  autoBtn.style.backgroundColor = "#00c853";
  autoBtn.innerText = "▶ Авто-режим";
  calledListEl.innerHTML = '';
  document.getElementById('check-results').innerHTML = '';
  const msg = document.querySelector(".end-message");
  if(msg) msg.remove();
}

function drawNumber() {
  if(numbers.length === 0) {
    numberEl.innerText = "✔";
    button.disabled = true;
    autoBtn.disabled = true;
    button.style.backgroundColor = "#777";
    autoBtn.style.backgroundColor = "#777";
    const msg = document.createElement('div');
    msg.className = "end-message";
    msg.innerText = "Все номера вытянуты!";
    document.body.appendChild(msg);
    if(autoDrawInterval) clearInterval(autoDrawInterval);
    return;
  }

  let drawn;
  const useLucky = Math.random() < 0.6;
  const remainingLucky = luckyNumbers.filter(n => numbers.includes(n));

  if(useLucky && remainingLucky.length>0) {
    drawn = remainingLucky[Math.floor(Math.random()*remainingLucky.length)];
    numbers = numbers.filter(n=>n!==drawn);
  } else {
    const index = Math.floor(Math.random()*numbers.length);
    drawn = numbers.splice(index,1)[0];
  }

  calledNumbers.push(drawn);
  calledNumbers.sort((a,b)=>a-b);

  numberEl.style.animation = "none";
  void numberEl.offsetWidth;
  numberEl.style.animation = null;
  numberEl.innerText = drawn;

  calledListEl.innerHTML = '';
  calledNumbers.forEach((n,i)=>{
    const numDiv = document.createElement('div');
    numDiv.textContent = n;
    if(i>=calledNumbers.length-5) numDiv.style.backgroundColor="rgba(255,255,0,0.5)";
    calledListEl.appendChild(numDiv);
  });

  remainingEl.innerText = `Осталось: ${numbers.length}`;

  speakNumber(drawn);
}

function speakNumber(num) {
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = `Число ${num}`;
  utterance.lang = 'ru-RU';
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

function checkNumbers() {
  const inputs = document.querySelectorAll('#check-inputs input');
  const resultsEl = document.getElementById('check-results');
  resultsEl.innerHTML = '';

  inputs.forEach(input=>{
    const value = parseInt(input.value);
    if(isNaN(value)) return;

    const result = document.createElement('div');
    result.innerHTML = `${value}: ${calledNumbers.includes(value) ? '✅ Был' : '❌ Не был'}`;
    resultsEl.appendChild(result);
  });
}

function showCheatInput() {
  document.getElementById('cheat-panel').style.display='block';
}

function saveCheatNumbers() {
  const raw = document.getElementById('cheat-input').value;
  const uniqueValues = [...new Set(
    raw.split(',').map(n=>parseInt(n.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=90)
  )];
  luckyNumbers = uniqueValues.slice(0,15);
  alert(`Режим удачи активирован!\nВыбранные числа: ${luckyNumbers.join(', ')}`);
  document.getElementById('cheat-panel').style.display='none';
}

function toggleAutoDraw() {
  if(autoDrawInterval) {
    clearInterval(autoDrawInterval);
    autoDrawInterval=null;
    autoBtn.innerText="▶ Авто-режим";
    autoBtn.style.backgroundColor="#00c853";
  } else {
    let seconds = parseFloat(document.getElementById("intervalInput").value);
    if(isNaN(seconds) || seconds<=0) seconds=2;
    drawNumber();
    autoDrawInterval=setInterval(drawNumber, seconds*1000);
    autoBtn.innerText="⏸ Остановить";
    autoBtn.style.backgroundColor="#ff9800";
  }
}

function restartGame() {
  initGame();
}