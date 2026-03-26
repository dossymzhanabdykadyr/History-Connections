let todayData = null;
let selectedWords = [];
let correctGroups = 0;
let guessHistory = [];
let resultsEmoji = [];
let startTime = null;
let timerInterval = null;

async function loadGame() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const today = new Date().toISOString().split('T')[0];
        // Бүгінгі күнді табамыз, болмаса тізімдегі біріншіні аламыз
        todayData = data.find(d => d.date === today) || data[0];

        document.getElementById('date-display').innerText = `Күн: ${todayData.date}`;
        
        // Ойын басталғанда сөздерді алғаш рет араластырып шығарамыз
        initialRender();
        startTimer();
    } catch (error) {
        console.error("Деректерді жүктеу қатесі:", error);
    }
}

function initialRender() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    const allWords = todayData.categories.flatMap(c => 
        c.words.map(w => ({ text: w, level: c.level }))
    ).sort(() => Math.random() - 0.5);

    allWords.forEach(word => {
        const div = document.createElement('div');
        div.className = 'word-card';
        div.innerText = word.text;
        div.onclick = () => toggleSelect(div, word);
        board.appendChild(div);
    });
}

function toggleSelect(div, word) {
    if (div.classList.contains('selected')) {
        div.classList.remove('selected');
        selectedWords = selectedWords.filter(w => w.text !== word.text);
    } else if (selectedWords.length < 4) {
        div.classList.add('selected');
        selectedWords.push(word);
    }
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
    const emojis = { 1: '🟨', 2: '🟩', 3: '🟦', 4: '🟪' };
    resultsEmoji.push(levels.map(l => emojis[l]).join(''));

    const allSame = levels.every(l => l === levels[0]);

    if (allSame) {
        const category = todayData.categories.find(c => c.level === levels[0]);
        showToast(category.title);
        
        const board = document.getElementById('game-board');
        
        // Табылған қатарды жаңадан жасау
        const solvedRow = document.createElement('div');
        solvedRow.className = `correct-row level-${levels[0]}`;
        solvedRow.innerHTML = `<strong>${category.title}</strong><span style="font-size:12px; margin-top:5px;">${category.words.join(', ')}</span>`;
        
        // Таңдалған ескі карталарды өшіру
        document.querySelectorAll('.selected').forEach(el => el.remove());
        
        // Табылған қатарды ең үстіне қосу
        board.prepend(solvedRow);
        
        selectedWords = [];
        correctGroups++;

        if (correctGroups === 4) {
            finishGame();
        }
    } else {
        const counts = {};
        levels.forEach(l => counts[l] = (counts[l] || 0) + 1);
        if (Object.values(counts).includes(3)) {
            showToast("Бір ғана сөз қате!");
        } else {
            showToast("Байланыс жоқ...");
        }
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        selectedWords = [];
    }
}

function shuffleBoard() {
    if (correctGroups < 4) {
        // 1. Табылған сөздерді жинап аламыз (оларды араластырмаймыз)
        const solvedWordsTexts = [];
        document.querySelectorAll('.correct-row span').forEach(span => {
            span.textContent.split(', ').forEach(word => solvedWordsTexts.push(word.trim()));
        });

        // 2. Тек табылмаған сөздерді тізімге аламыз
        const remainingWords = [];
        todayData.categories.forEach(cat => {
            cat.words.forEach(word => {
                if (!solvedWordsTexts.includes(word)) {
                    remainingWords.push({ text: word, level: cat.level });
                }
            });
        });

        // 3. Табылмаған сөздерді араластырамыз
        remainingWords.sort(() => Math.random() - 0.5);

        // 4. Ескі табылмаған карталарды өшіріп, жаңаларын қосамыз
        document.querySelectorAll('.word-card').forEach(card => card.remove());
        const board = document.getElementById('game-board');
        
        remainingWords.forEach(word => {
            const div = document.createElement('div');
            div.className = 'word-card';
            div.innerText = word.text;
            div.onclick = () => toggleSelect(div, word);
            board.appendChild(div);
        });

        selectedWords = [];
    }
}

function finishGame() {
    clearInterval(timerInterval);
    document.getElementById('game-stats').style.display = 'block';
    
    setTimeout(() => {
        // Ескі хабарлама блогын тазалаймыз
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = ''; 

        // Жаңа модальді элемент жасаймыз
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-content">
                <h2 style="margin: 0 0 15px 0; color: #28a745; font-size: 24px;">Құттықтаймыз! 🎉</h2>
                <div style="font-size: 40px; margin-bottom: 15px;">🏆</div>
                <p style="margin: 0; font-weight: bold; font-size: 18px;">Ойын аяқталды!</p>
                <p style="margin: 10px 0 20px 0; color: #555;">Келесі ойын түнгі 00:00-де жаңарады.</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #333; color: white; border: none; padding: 10px 25px; border-radius: 10px; cursor: pointer;">
                    Жабу
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }, 800);
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000);
        const mins = String(Math.floor(diff / 60)).padStart(2, '0');
        const secs = String(diff % 60).padStart(2, '0');
        document.getElementById('timer-display').innerText = `Уақыт: ${mins}:${secs}`;
    }, 1000);
}

function shareResult() {
    const time = document.getElementById('timer-display').innerText;
    const text = `Connections game 🌍\nДүниежүзі тарихы\nКүн: ${todayData.date}\n${time}\n\n${resultsEmoji.join('\n')}\n\nОйнау: ${window.location.href}`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast("Нәтиже көшірілді!");
    });
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Ойынды іске қосу
loadGame();
