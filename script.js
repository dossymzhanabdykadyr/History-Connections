let selectedWords = [];
let correctGroups = 0;
let todayData = null;

// 1. Мәліметтерді JSON-нан алу
async function loadGame() {
    const response = await fetch('data.json');
    const data = await response.json();
    
    // Бүгінгі күнді алу (YYYY-MM-DD форматында)
    const today = new Date().toISOString().split('T')[0];
    todayData = data.find(item => item.date === today) || data[0]; // Егер бүгінге жоқ болса, біріншісін алады
    
    document.getElementById('date-display').innerText = `Күн: ${todayData.date}`;
    renderBoard();
}

// 2. Ойын тақтасын құру
function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    // Барлық сөздерді бір тізімге жинап, араластыру
    let allWords = [];
    todayData.categories.forEach(cat => {
        cat.words.forEach(word => allWords.push({ text: word, level: cat.level }));
    });
    allWords.sort(() => Math.random() - 0.5);

    allWords.forEach(wordObj => {
        const btn = document.createElement('div');
        btn.classList.add('word-card');
        btn.innerText = wordObj.text;
        btn.onclick = () => selectWord(btn, wordObj);
        board.appendChild(btn);
    });
}

// 3. Сөзді таңдау логикасы
function selectWord(el, obj) {
    if (el.classList.contains('correct')) return;
    
    if (el.classList.contains('selected')) {
        el.classList.remove('selected');
        selectedWords = selectedWords.filter(w => w.text !== obj.text);
    } else if (selectedWords.length < 4) {
        el.classList.add('selected');
        selectedWords.push(obj);
    }
}

// 4. Тексеру
function checkGuess() {
    if (selectedWords.length !== 4) return;

    const levels = selectedWords.map(w => w.level);
    const allSame = levels.every(l => l === levels[0]);

    if (allSame) {
        const category = todayData.categories.find(c => c.level === levels[0]);
        alert(`Дұрыс! Категория: ${category.title}`);
        
        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
            el.classList.add('correct', `level-${levels[0]}`);
        });
        selectedWords = [];
        correctGroups++;
        if (correctGroups === 4) alert("Құттықтаймыз! Барлығын таптыңыз!");
    } else {
        alert("Қате! Қайта байқап көріңіз.");
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        selectedWords = [];
    }
}

function shuffleBoard() { renderBoard(); }

loadGame();
