let selectedWords = [];
let correctGroups = 0;
let todayData = null;
let guessHistory = [];
let startTime, timerInterval;
let resultsEmoji = []; // Түсті квадраттарды сақтау үшін

async function loadGame() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const today = new Date().toISOString().split('T')[0];
        todayData = data.find(item => item.date === today) || data[0];
        document.getElementById('date-display').innerText = `Күн: ${todayData.date}`;
        renderBoard();
        startTimer(); // Ойын басталғанда таймер қосылады
    } catch (e) { console.error("Жүктеу қатесі:", e); }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('game-stats').style.display = 'block';
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `Уақыт: ${mins}:${secs}`;
}

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    let allWords = [];
    todayData.categories.forEach(cat => {
        cat.words.forEach(word => allWords.push({ text: word, level: cat.level }));
    });
    allWords.sort(() => Math.random() - 0.5);
    allWords.forEach(wordObj => {
        const btn = document.createElement('div');
        btn.className = 'word-card';
        btn.innerText = wordObj.text;
        btn.onclick = () => selectWord(btn, wordObj);
        board.appendChild(btn);
    });
}

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

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.innerHTML = '';
    container.appendChild(toast);
}

function checkGuess() {
    if (selectedWords.length !== 4) {
        showToast("4 сөз таңдаңыз!");
        return;
    }

    const currentGuess = selectedWords.map(w => w.text).sort().join(',');
    if (guessHistory.includes(currentGuess)) {
        showToast("Бұл жауап тексерілген!");
        return;
    }
    guessHistory.push(currentGuess);

    const levels = selectedWords.map(w => w.level);
    
    // Нәтиже үшін эмодзи қосу
    const emojis = { 1: '🟨', 2: '🟩', 3: '🟦', 4: '🟪' };
    resultsEmoji.push(levels.map(l => emojis[l]).join(''));

    const allSame = levels.every(l => l === levels[0]);

    if (allSame) {
        const category = todayData.categories.find(c => c.level === levels[0]);
        showToast(category.title);
        const board = document.getElementById('game-board');
        const solvedRow = document.createElement('div');
        solvedRow.className = `correct-row level-${levels[0]}`;
        solvedRow.innerHTML = `<strong>${category.title}</strong><span style="font-size:12px; margin-top:5px;">${category.words.join(', ')}</span>`;
        document.querySelectorAll('.selected').forEach(el => el.remove());
        board.prepend(solvedRow);
        selectedWords = [];
        correctGroups++;
        
        if (correctGroups === 4) {
            clearInterval(timerInterval); // Таймерді тоқтату
            showToast("Керемет! Нәтижені бөлісіңіз!");
        }
    } else {
        const counts = {};
        levels.forEach(l => counts[l] = (counts[l] || 0) + 1);
        if (Object.values(counts).some(count => count === 3)) {
            showToast("Бір ғана сөз қате!");
        } else {
            showToast("Байланыс жоқ...");
        }
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        selectedWords = [];
    }
}

function shareResult() {
    const time = document.getElementById('timer-display').innerText;
    const date = todayData.date;
    const emojiGrid = resultsEmoji.join('\n');
    const shareText = `Тарих Connections 🌍\nКүн: ${date}\n${time}\n\n${emojiGrid}\n\nОйнау: ${window.location.href}`;

    if (navigator.share) {
        navigator.share({ title: 'Тарих Connections', text: shareText });
    } else {
        navigator.clipboard.writeText(shareText);
        showToast("Нәтиже көшірілді! Достарыңызға жіберіңіз.");
    }
}

function shuffleBoard() {
    if (correctGroups < 4) {
        selectedWords = [];
        renderBoard();
    }
}

loadGame();
