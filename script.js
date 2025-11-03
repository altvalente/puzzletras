// Variáveis Globais
let puzzles = []; // Armazena todos os puzzles carregados ou adicionados
let currentPuzzleIndex = 0;
let score = 0; // Pontuação interna, não será exibida ao jogador
let timerInterval;
let timeLeft = 0;
let gameRunning = false;
let roundAnswers = []; // Para armazenar as respostas do jogador para a ronda atual
let allGameResults = []; // Para armazenar os resultados de todas as rondas jogadas (para exportação)
let newPuzzlesAdded = []; // Puzzles criados pelo utilizador para exportação

// Elementos do DOM
const currentPuzzleEl = document.getElementById('currentPuzzle');
const answerInput = document.getElementById('answerInput');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const nextPuzzleBtn = document.getElementById('nextPuzzleBtn'); 
const startGameBtn = document.getElementById('startGameBtn');
const endGameBtn = document.getElementById('endGameBtn');
const timerDisplay = document.querySelector('.timer');
// Os elementos do painel de score serão atualizados apenas no final para o export.
const puzzleCountEl = document.getElementById('puzzleCount');
const correctAnswersEl = document.getElementById('correctAnswers');
const wrongAnswersEl = document.getElementById('wrongAnswers');
// const scoreEl = document.getElementById('score'); // Removido do HTML, não é preciso referenciar aqui.
const roundTimeInput = document.getElementById('roundTime');
const modeIndividualRadio = document.getElementById('modeIndividual');
const modeGrupoRadio = document.getElementById('modeGrupo');

// Elementos de Gestão de Puzzles
const loadPuzzlesFile = document.getElementById('loadPuzzlesFile');
const loadedFileNameSpan = document.getElementById('loadedFileName');
const newPuzzleDisplayInput = document.getElementById('newPuzzleDisplay');
const newPuzzleAnswerInput = document.getElementById('newPuzzleAnswer');
const addNewPuzzleBtn = document.getElementById('addNewPuzzleBtn');
const exportResultsBtn = document.getElementById('exportResultsBtn');
const exportNewPuzzlesBtn = document.getElementById('exportNewPuzzlesBtn');

// Novo elemento para gestão
const managementArea = document.getElementById('managementArea');
const toggleManagementBtn = document.getElementById('toggleManagementBtn');

// --- Funções do Jogo ---

// Inicia uma nova ronda do jogo
function startGame() {
    if (puzzles.length === 0) {
        alert('Por favor, carregue ou adicione puzzles antes de iniciar o jogo.');
        return;
    }

    // Resetar estado da ronda
    score = 0; // A pontuação interna é reiniciada mas não exibida
    currentPuzzleIndex = 0;
    gameRunning = true;
    roundAnswers = []; // Limpa as respostas da ronda anterior
    shuffleArray(puzzles); // Embaralha os puzzles para cada nova ronda

    // Atualizar UI
    startGameBtn.classList.add('hidden');
    endGameBtn.classList.remove('hidden');
    answerInput.disabled = false;
    submitAnswerBtn.disabled = false;
    nextPuzzleBtn.disabled = false; // Permite avançar caso queiram saltar sem responder
    updateScorePanel(true); // Resetar o painel de score no início

    // Iniciar temporizador
    const roundTimeMinutes = parseInt(roundTimeInput.value);
    timeLeft = roundTimeMinutes * 60;
    updateTimerDisplay();
    clearInterval(timerInterval); // Limpa qualquer temporizador anterior
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    displayPuzzle();
}

// Termina a ronda atual do jogo
function endGame() {
    if (!gameRunning) return; // Evita terminar o jogo duas vezes

    clearInterval(timerInterval);
    gameRunning = false;

    // Calcular acertos e erros no final
    let correctCount = 0;
    let wrongCount = 0;
    let resultsSummary = '--- Resultados da Ronda ---\n\n';

    roundAnswers.forEach((ra, index) => {
        if (ra.isCorrect) {
            correctCount++;
            // Não mostra a resposta correta, apenas indica se acertou ou não
            resultsSummary += `✔️ Puzzle ${index + 1}: "${ra.puzzleDisplay}"\n   Sua resposta: "${ra.userAnswer}"\n\n`;
        } else {
            wrongCount++;
            // Não mostra a resposta correta, apenas indica que errou
            resultsSummary += `❌ Puzzle ${index + 1}: "${ra.puzzleDisplay}"\n   Sua resposta: "${ra.userAnswer}"\n\n`;
        }
    });

    // Guardar resultados da ronda para exportação
    const gameMode = modeIndividualRadio.checked ? 'Individual' : 'Grupo';
    const roundResults = {
        data: new Date().toLocaleString('pt-PT'),
        modo: gameMode,
        acertos: correctCount,
        erros: wrongCount,
        totalPuzzlesTentados: roundAnswers.length,
        pontuacaoInterna: score // Pontuação interna, para registo no CSV
    };
    allGameResults.push(roundResults); // Adiciona os resultados desta ronda aos resultados gerais

    // Atualizar painel de score com os totais finais para o histórico (não para o jogador)
    correctAnswersEl.textContent = correctCount;
    wrongAnswersEl.textContent = wrongCount;
    // scoreEl.textContent = score; // Este elemento não existe mais no HTML

    alert(`Ronda Terminada!\nTotal de Puzzles Tentados: ${roundAnswers.length}\nAcertos: ${correctCount}\nErros: ${wrongCount}\n\nPor favor, consulte os resultados para discussão. (Anote o seu score individual ou de grupo).\n\n` + resultsSummary);


    // Atualizar UI
    startGameBtn.classList.remove('hidden');
    endGameBtn.classList.add('hidden');
    answerInput.disabled = true;
    submitAnswerBtn.disabled = true;
    nextPuzzleBtn.disabled = true;
    currentPuzzleEl.textContent = 'Ronda terminada! Clique em "Iniciar Ronda" para jogar novamente.';
    answerInput.value = '';
    timerDisplay.textContent = '00:00';
    // O painel de score já foi atualizado com os resultados finais no início de endGame()
}

// Exibe o puzzle atual
function displayPuzzle() {
    if (currentPuzzleIndex < puzzles.length) {
        currentPuzzleEl.textContent = puzzles[currentPuzzleIndex].display;
        answerInput.value = '';
        puzzleCountEl.textContent = `${currentPuzzleIndex + 1}/${puzzles.length}`;
        answerInput.focus(); // Foca no campo de resposta para facilitar
    } else {
        // Se todos os puzzles foram exibidos, termina o jogo automaticamente
        endGame();
    }
}

// Submete a resposta do utilizador
function submitAnswer() {
    if (!gameRunning) return;

    const currentPuzzle = puzzles[currentPuzzleIndex];
    const userAnswer = answerInput.value.trim(); // Manter como inserido pelo utilizador
    const correctAnswer = currentPuzzle.answer.trim();
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    // Armazenar a resposta do jogador para revisão posterior
    roundAnswers.push({
        puzzleDisplay: currentPuzzle.display,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer, // Manter aqui para o CSV, mas não para o alert
        isCorrect: isCorrect
    });

    if (isCorrect) {
        score += 10; // Atualiza pontuação interna
    } else {
        score -= 5; // Atualiza pontuação interna
    }

    // Avança para o próximo puzzle ou termina o jogo
    currentPuzzleIndex++;
    if (currentPuzzleIndex < puzzles.length) {
        displayPuzzle();
    } else {
        endGame(); // Todos os puzzles respondidos
    }
}

// Passa para o próximo puzzle sem submeter resposta
function nextPuzzle() {
    if (!gameRunning) return;

    const currentPuzzle = puzzles[currentPuzzleIndex];
    // Se o utilizador salta, registamos como resposta vazia e incorreta
    roundAnswers.push({
        puzzleDisplay: currentPuzzle.display,
        userAnswer: '[Saltou]', // Indicador de que foi saltado
        correctAnswer: currentPuzzle.answer.trim(), // Manter aqui para o CSV
        isCorrect: false
    });
    // Não alteramos a pontuação por saltar.

    currentPuzzleIndex++;
    if (currentPuzzleIndex < puzzles.length) {
        displayPuzzle();
    } else {
        endGame(); // Todos os puzzles foram saltados ou respondidos
    }
}

// Atualiza o painel de pontuação (principalmente para o estado inicial e final)
function updateScorePanel(reset = false) {
    if (reset) {
        puzzleCountEl.textContent = `0/${puzzles.length}`;
        correctAnswersEl.textContent = '0';
        wrongAnswersEl.textContent = '0';
        // scoreEl.textContent = '0'; // Este elemento não existe mais no HTML
    } else {
        // Este bloco será útil no final, em endGame()
        puzzleCountEl.textContent = `${currentPuzzleIndex}/${puzzles.length}`;
        // correctAnswersEl e wrongAnswersEl serão atualizados em endGame() com os totais
    }
}

// Atualiza o display do temporizador
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// --- Funções de Gestão de Puzzles e Ficheiros ---

// Carrega puzzles de um ficheiro de texto
function loadPuzzlesFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        try {
            const loadedPuzzles = text.split('\n').map(line => {
                const parts = line.split(';'); // Assumindo formato: "display;answer"
                if (parts.length === 2) {
                    return { display: parts[0].trim(), answer: parts[1].trim() };
                }
                return null;
            }).filter(p => p !== null);

            if (loadedPuzzles.length > 0) {
                puzzles = loadedPuzzles; // Substitui os puzzles existentes
                loadedFileNameSpan.textContent = file.name;
                alert(`Foram carregados ${puzzles.length} puzzles do ficheiro "${file.name}".`);
                updateScorePanel(true); // Resetar painel com novo total de puzzles
                currentPuzzleEl.textContent = 'Puzzles carregados! Clique em "Iniciar Ronda" para começar.';
            } else {
                alert('O ficheiro não contém puzzles válidos ou está vazio. Formato esperado: "display;answer" por linha.');
            }
        } catch (error) {
            alert('Erro ao ler o ficheiro: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Adiciona um novo puzzle
function addNewPuzzle() {
    const display = newPuzzleDisplayInput.value.trim();
    const answer = newPuzzleAnswerInput.value.trim();

    if (display && answer) {
        const newPuzzle = { display, answer };
        puzzles.push(newPuzzle); // Adiciona aos puzzles ativos
        newPuzzlesAdded.push(newPuzzle); // Adiciona à lista de novos puzzles para exportação
        alert('Puzzle adicionado com sucesso! Total de puzzles: ' + puzzles.length);
        newPuzzleDisplayInput.value = '';
        newPuzzleAnswerInput.value = '';
        updateScorePanel(true); // Atualiza o total de puzzles disponíveis
    } else {
        alert('Por favor, preencha ambos os campos para o novo puzzle.');
    }
}

// Exporta os resultados do jogo para CSV
function exportResultsToCSV() {
    if (allGameResults.length === 0) {
        alert('Não há resultados de rondas para exportar.');
        return;
    }

    let csvContent = "data;modo;acertos;erros;totalPuzzlesTentados;pontuacaoInterna\n";
    allGameResults.forEach(result => {
        csvContent += `${result.data};${result.modo};${result.acertos};${result.erros};${result.totalPuzzlesTentados};${result.pontuacaoInterna}\n`;
    });

    downloadFile(csvContent, 'resultados_quebra_gelo.csv', 'text/csv');
}

// Exporta os novos puzzles adicionados para TXT
function exportNewPuzzlesToTXT() {
    if (newPuzzlesAdded.length === 0) {
        alert('Não há novos puzzles adicionados para exportar.');
        return;
    }

    let txtContent = newPuzzlesAdded.map(p => `${p.display};${p.answer}`).join('\n');
    downloadFile(txtContent, 'novos_puzzles_quebra_gelo.txt', 'text/plain');
}

// Função auxiliar para descarregar ficheiros
function downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Função auxiliar para embaralhar um array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Event Listeners ---
startGameBtn.addEventListener('click', startGame);
endGameBtn.addEventListener('click', endGame);
submitAnswerBtn.addEventListener('click', submitAnswer);
nextPuzzleBtn.addEventListener('click', nextPuzzle);
loadPuzzlesFile.addEventListener('change', loadPuzzlesFromFile);
addNewPuzzleBtn.addEventListener('click', addNewPuzzle);
exportResultsBtn.addEventListener('click', exportResultsToCSV);
exportNewPuzzlesBtn.addEventListener('click', exportNewPuzzlesToTXT);

// Event listener para o botão de alternar a área de gestão
toggleManagementBtn.addEventListener('click', () => {
    managementArea.classList.toggle('hidden');
    // Mudar o texto do botão para indicar o estado
    if (managementArea.classList.contains('hidden')) {
        toggleManagementBtn.textContent = 'Gerir Puzzles';
    } else {
        toggleManagementBtn.textContent = 'Ocultar Gestão';
    }
});


// Permitir submeter resposta com a tecla Enter
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !submitAnswerBtn.disabled) {
        e.preventDefault(); // Evita que o Enter submeta o formulário se houver um
        submitAnswer();
    }
});

// Inicialização
updateScorePanel(true); // Resetar o painel de score ao carregar a página
currentPuzzleEl.textContent = 'Carregue puzzles ou adicione novos para começar a jogar.';