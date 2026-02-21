let baseColors = ["red","blue","green","yellow","purple","orange","pink","brown"];
let count = 4;
let secret = [];
let attempts = 0;
let gameOver = false;

let selectedColor = null;
let selectedCell = null;

// Показ формы выбора количества цветов
function showSetup(){
  document.getElementById("startBtn").classList.add("hidden");
  document.getElementById("setup").classList.remove("hidden");
}

// Игрок 1 создаёт секрет
function createSecret(){
  count = parseInt(document.getElementById("countInput").value);

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("secretArea").classList.remove("hidden");

  createBoard("secretBoard");
  createPalette("secretPalette", baseColors.slice(0,count));
}

// Создание доски (игрок 1 или 2)
function createBoard(id){
  let board = document.getElementById(id);
  board.innerHTML = "";

  for(let i=0;i<count;i++){
    let cell = document.createElement("div");
    cell.className = "cell";

    cell.onclick = function(){
      if(gameOver) return;

      // Вставка выбранного цвета
      if(selectedColor){
        if(!cell.style.background){
          cell.style.background = selectedColor;
          removeColorFromPalette(selectedColor);
          selectedColor = null;
          removeSelection();
        }
        return;
      }

      // Обмен между ячейками
      if(cell.style.background){
        if(selectedCell && selectedCell !== cell){
          let temp = selectedCell.style.background;
          selectedCell.style.background = cell.style.background;
          cell.style.background = temp;
          selectedCell.classList.remove("selected");
          selectedCell = null;
        } else {
          if(selectedCell) selectedCell.classList.remove("selected");
          selectedCell = cell;
          cell.classList.add("selected");
        }
      }
    };

    board.appendChild(cell);
  }
}

// Создание палитры
function createPalette(id, colors){
  let palette = document.getElementById(id);
  palette.innerHTML = "";

  colors.forEach(color=>{
    let box = document.createElement("div");
    box.className = "color";
    box.style.background = color;

    box.onclick = function(){
      if(gameOver) return;
      selectedColor = color;
      highlight(box);
    };

    palette.appendChild(box);
  });
}

// Удаление цвета из палитры после выбора
function removeColorFromPalette(color){
  let palette = document.getElementById(
    document.getElementById("gameArea").classList.contains("hidden")
      ? "secretPalette"
      : "guessPalette"
  );

  let boxes = palette.children;
  for(let box of boxes){
    if(box.style.background === color){
      palette.removeChild(box);
      break;
    }
  }
}

// Выделение выбранного цвета
function highlight(el){
  removeSelection();
  el.classList.add("selected");
}

// Удаление выделения
function removeSelection(){
  document.querySelectorAll(".color").forEach(c=>c.classList.remove("selected"));
}

// Перемешивание массива (для палитры второго игрока)
function shuffleArray(array){
  let arr = [...array];
  for(let i = arr.length - 1; i > 0; i--){
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Начало игры для игрока 2
function startGame(){
  let cells = document.getElementById("secretBoard").children;
  secret = [];

  for(let cell of cells){
    if(!cell.style.background){
      alert("Заполни все ячейки!");
      return;
    }
    secret.push(cell.style.background);
  }

  attempts = 0;
  gameOver = false;
  selectedColor = null;
  selectedCell = null;

  document.getElementById("attemptCount").innerText = 0;
  document.getElementById("result").innerText = "";

  document.getElementById("secretArea").classList.add("hidden");
  document.getElementById("gameArea").classList.remove("hidden");

  let shuffled = shuffleArray(secret);
  while(JSON.stringify(shuffled) === JSON.stringify(secret)){
    shuffled = shuffleArray(secret);
  }

  createBoard("guessBoard");
  createPalette("guessPalette", shuffled);
}

// Проверка совпадений
function check(){
  if(gameOver) return;

  let cells = document.getElementById("guessBoard").children;

  for(let cell of cells){
    if(!cell.style.background){
      alert("Заполни все ячейки!");
      return;
    }
  }

  let correct = 0;
  for(let i=0;i<count;i++){
    if(cells[i].style.background === secret[i]){
      correct++;
    }
  }

  attempts++;
  document.getElementById("attemptCount").innerText = attempts;
  document.getElementById("result").innerText = "Совпадений: " + correct;

  if(correct === count){
    gameOver = true;
    alert("Победа за " + attempts + " попыток!");
  }
}

// Кнопка «Сдаться» — показать правильные цвета
function giveUp(){
  if(gameOver) return;

  gameOver = true;

  let answerBoard = document.getElementById("answerBoard");
  answerBoard.innerHTML = "";
  answerBoard.classList.remove("hidden");
  document.getElementById("answerTitle").classList.remove("hidden");

  for(let i=0;i<secret.length;i++){
    let cell = document.createElement("div");
    cell.className = "cell";
    cell.style.background = secret[i];
    answerBoard.appendChild(cell);
  }
}

// Перезапуск игры
function restartGame(){
  location.reload();
}
