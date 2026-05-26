/*
  REGOLE
  - Codice in JavaScript moderno: solo const/let, mai var.
  - DOM: usa querySelector / querySelectorAll.
  - Eventi: usa addEventListener (mai onclick inline nell'HTML).
  - Pattern: stato → render → eventi.
*/

/*
  Array di domande.
  Ogni question è un object con:
   - question: testo della domanda
   - correct_answer: la risposta corretta (string)
   - incorrect_answers: array di risposte sbagliate (string[])
*/
const QUESTIONS = [
  {
    id: "q01",
    question: "Cosa significa l'acronimo CPU?",
    correct_answer: "Central Processing Unit",
    incorrect_answers: [
      "Central Process Unit",
      "Computer Personal Unit",
      "Central Processor Unit",
    ],
  },
  {
    id: "q02",
    question:
      "In Java, quale keyword si usa per impedire che una variabile venga modificata?",
    correct_answer: "final",
    incorrect_answers: ["static", "private", "public"],
  },
  {
    id: "q03",
    question: "Il logo di Snapchat è una campana.",
    correct_answer: "Falso",
    incorrect_answers: ["Vero"],
  },
  {
    id: "q04",
    question:
      "I puntatori sono stati introdotti in C++ e non c'erano nel linguaggio C originale.",
    correct_answer: "Falso",
    incorrect_answers: ["Vero"],
  },
  {
    id: "q05",
    question:
      "Qual è il formato immagine più usato per i loghi nel database di Wikimedia?",
    correct_answer: ".svg",
    incorrect_answers: [".png", ".jpeg", ".gif"],
  },
  {
    id: "q06",
    question: "Cosa significa l'acronimo CSS?",
    correct_answer: "Cascading Style Sheets",
    incorrect_answers: [
      "Counter Strike: Source",
      "Corrective Style Sheets",
      "Computer Style Sheets",
    ],
  },
  {
    id: "q07",
    question: "Qual è il nome in codice del sistema operativo Android 7.0?",
    correct_answer: "Nougat",
    incorrect_answers: ["Ice Cream Sandwich", "Jelly Bean", "Marshmallow"],
  },
  {
    id: "q08",
    question: "Qual era il limite originale di caratteri di un Tweet?",
    correct_answer: "140",
    incorrect_answers: ["120", "160", "100"],
  },
  {
    id: "q09",
    question: "Linux è stato creato come alternativa a Windows XP.",
    correct_answer: "Falso",
    incorrect_answers: ["Vero"],
  },
  {
    id: "q10",
    question:
      "Quale linguaggio di programmazione condivide il nome con un'isola dell'Indonesia?",
    correct_answer: "Java",
    incorrect_answers: ["Python", "C", "Jakarta"],
  },
];

/* Costanti del quiz */
const TOTAL_QUESTIONS = QUESTIONS.length;
const PASS_THRESHOLD = 60; // percentuale minima per "Promosso"
const FEEDBACK_DELAY = 1500; // ms di attesa dopo risposta prima di avanzare
const TIMER_DURATION = 20; // secondi per ogni domanda

/* Stato globale */
let currentScreen = "welcome"; // "welcome" | "quiz" | "results"
let currentQuestion = 0;
let score = 0;
let timerId = null;

/* SCRIVI QUI LE TUE FUNZIONI:
   - render() che chiama renderWelcome / renderQuiz / renderResults in base a currentScreen
   - renderWelcome() per la schermata iniziale con button Inizia
   - renderQuiz() per la domanda corrente con i button risposta + counter + timer
   - renderResults() per la schermata finale con percentuale + barre + verdetto
   - startTimer() / stopTimer() per il countdown
   - handleAnswer(button, answer) per il click su una risposta
   - handleTimeUp() per il tempo scaduto
   - advance() per andare alla domanda successiva o ai risultati
*/

/* Stato globale — modificato dalla logica (timer, handlers, advance) */
let currentScreen = "welcome"; // "welcome" | "quiz" | "results"
let currentQuestion = 0;
let score = 0;
let shuffledAnswers = []; // popolato da renderQuiz, letto dagli handler
let shuffledQuestions = []; // popolato da render() alla domanda 0, letto da renderQuiz()
let timerId = null;

// ─── UTILITY ──────────────────────────────────────────────────────────────────

/* Crea un elemento DOM con classe e testo opzionale */
const make = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

/* Mescola un array (Fisher-Yates) senza mutare l'originale */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── RENDER ───────────────────────────────────────────────────────────────────

/*
 render()
 1. Svuota <main id="app"> con replaceChildren() — niente innerHTML
 2. Appende il nodo DOM restituito dalla render function corretta
 3. Aggancia gli event listener sul DOM appena inserito
 Nota: l'<header class="brand"> con il logo è nell'HTML statico
 e non viene toccato da render() — il JS gestisce solo <main id="app">.
*/
function render() {
  const app = document.querySelector("#app");
  app.replaceChildren(); // svuota il contenitore senza innerHTML

  if (currentScreen === "welcome") {
    app.appendChild(renderWelcome());
    document.querySelector("#btn-start").addEventListener("click", handleStart);
  } else if (currentScreen === "quiz") {
    // Mescola le domande una sola volta, all'inizio di ogni partita
    if (currentQuestion === 0) shuffledQuestions = shuffle(QUESTIONS);
    app.appendChild(renderQuiz());
    startTimer();
    document.querySelectorAll(".quiz-answer").forEach((btn) => {
      btn.addEventListener("click", () => {
        const answer = shuffledAnswers[Number(btn.dataset.index)];
        handleAnswer(btn, answer);
      });
    });
  } else if (currentScreen === "results") {
    app.appendChild(renderResults());
    document
      .querySelector("#btn-restart")
      .addEventListener("click", handleRestart);
  }
}

// ─── RENDER WELCOME ───────────────────────────────────────────────────────────

/*
 renderWelcome() → restituisce un nodo DOM (non una stringa)
 Struttura prodotta (segue il wireframe W):
 div.screen-welcome
   h2.welcome-title                      "Quiz Tech"
   div.welcome-info                      (box interno con bordo)
     p.welcome-description               testo introduttivo
     ul.welcome-list
       li                                "10 domande"
       li                                "20 secondi per risposta"
       li                                "Soglia: 60%"
   button#btn-start.btn.btn--primary     "Inizia"
*/
function renderWelcome() {
  const screen = make("div", "screen-welcome");

  const title = make("h2", "welcome-title", "Quiz Tech");

  // Box info interno
  const info = make("div", "welcome-info");
  const desc = make(
    "p",
    "welcome-description",
    "Metti alla prova le tue conoscenze di tecnologia e informatica.",
  );

  const list = make("ul", "welcome-list");
  [
    `${TOTAL_QUESTIONS} domande`,
    `${TIMER_DURATION} secondi per risposta`,
    `Soglia di superamento: ${PASS_THRESHOLD}%`,
  ].forEach((testo) => list.appendChild(make("li", "", testo)));

  info.append(desc, list);

  const btn = make("button", "btn btn--primary", "Inizia");
  btn.id = "btn-start";

  screen.append(title, info, btn);
  return screen;
}

// ─── RENDER QUIZ ──────────────────────────────────────────────────────────────

/*
 renderQuiz() → restituisce un nodo DOM
 Mescola le risposte e salva l'ordine in shuffledAnswers (letto dagli handler).
 Struttura prodotta (segue wireframe Q):
 div.screen-quiz[data-question-id]
   div.quiz-header
     span.quiz-counter              "Domanda X / Y"         ← sinistra
     div.quiz-timer-wrapper
       span.quiz-timer-icon         "⏱"
       span#quiz-timer.quiz-timer   "20"                    ← destra, aggiornato da startTimer()
   h2.quiz-question                 testo domanda
   div.quiz-answers
     button.quiz-answer[data-index] × 2–4  (full width)
       span.quiz-answer__letter     "A" / "B" / ...
       (text node)                  testo risposta
 Modificatori applicati in seguito da handleAnswer / handleTimeUp:
   .quiz-answer--correct  .quiz-answer--wrong  .quiz-timer--urgent
*/
function renderQuiz() {
  const q = shuffledQuestions[currentQuestion];
  shuffledAnswers = shuffle([q.correct_answer, ...q.incorrect_answers]);

  const letters = ["A", "B", "C", "D"];

  const screen = make("div", "screen-quiz");
  screen.dataset.questionId = q.id;

  // Header: counter (sinistra) + icona e timer (destra)
  const header = make("div", "quiz-header");
  const counter = make(
    "span",
    "quiz-counter",
    `Domanda ${currentQuestion + 1} / ${TOTAL_QUESTIONS}`,
  );
  const timerWrapper = make("div", "quiz-timer-wrapper");
  const timerIcon = make("span", "quiz-timer-icon", "⏱");
  const timer = make("span", "quiz-timer", String(TIMER_DURATION));
  timer.id = "quiz-timer";
  timerWrapper.append(timerIcon, timer);
  header.append(counter, timerWrapper);

  // Testo domanda
  const question = make("h2", "quiz-question", q.question);

  // Bottoni risposta (da 2 a 4 a seconda della domanda)
  const answersContainer = make("div", "quiz-answers");
  shuffledAnswers.forEach((answer, i) => {
    const btn = make("button", "quiz-answer");
    const letter = make("span", "quiz-answer__letter", letters[i]);
    btn.dataset.index = i;
    btn.append(letter, answer);
    answersContainer.appendChild(btn);
  });

  screen.append(header, question, answersContainer);
  return screen;
}

// ─── RENDER RESULTS ───────────────────────────────────────────────────────────

/*
 renderResults() → restituisce un nodo DOM
 Struttura prodotta (segue wireframe END):
 div.screen-results
   h3.results-subtitle          "Risultati"
   p.results-message            messaggio in base al punteggio
   h1.results-score-box         "70%"   ← box centrato con il voto grande
   p.results-score-label        "7 / 10 risposte corrette"
   div.results-stat             (riga: span + barra + span)
     span.results-stat__label   "Corrette"
     div.results-stat__bar
       div.results-stat__fill   ← style.width + style.background
     span.results-stat__value   "7"
   div.results-stat             (stessa struttura per le sbagliate)
   button#btn-restart.btn.btn--primary   "Riprova"
*/
function renderResults() {
  const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);
  const passed = percentage >= PASS_THRESHOLD;

  const screen = make("div", "screen-results");
  const subtitle = make("h3", "results-subtitle", "Risultati");
  const message = make(
    "p",
    "results-message",
    passed
      ? "Ottimo lavoro! Hai superato il quiz."
      : "Continua ad allenarti, ci sei quasi!",
  );

  // Grafico a torta (donut)
  const chartContainer = make("div", "chart-container");
  const chartCircle = make("div", "chart-circle");
  chartCircle.style.setProperty("--pct", `${percentage}%`);
  const chartLabel = make("div", "chart-label", `${percentage}%`);
  chartContainer.append(chartCircle, chartLabel);

  const scoreLabel = make(
    "p",
    "results-score-label",
    `${score} / ${TOTAL_QUESTIONS} risposte corrette`,
  );

  const btn = make("button", "btn btn--primary", "Riprova");
  btn.id = "btn-restart";

  screen.append(subtitle, message, chartContainer, scoreLabel, btn);
  return screen;
}

// ─── LOGICA ───────────────────────────────────────────────────────────────────

function handleStart() {
  currentQuestion = 0;
  score = 0;
  currentScreen = "quiz";
  render();
}

function handleRestart() {
  currentQuestion = 0;
  score = 0;
  currentScreen = "welcome";
  render();
}

function handleAnswer(button, answer) {
  // Disabilita tutti i bottoni risposta
  const buttons = document.querySelectorAll(".quiz-answer");
  buttons.forEach((btn) => (btn.disabled = true));

  // FIX: usa shuffledQuestions, non QUESTIONS, perché le domande sono mescolate
  const currentQ = shuffledQuestions[currentQuestion];

  if (answer === currentQ.correct_answer) {
    score++;
    button.classList.add("quiz-answerTrue");
  } else {
    button.classList.add("quiz-answerFalse");
    // FIX: confronta tramite shuffledAnswers[data-index], non textContent
    // (textContent include anche la lettera A/B/C/D dello span)
    buttons.forEach((btn) => {
      if (
        shuffledAnswers[Number(btn.dataset.index)] === currentQ.correct_answer
      ) {
        btn.classList.add("quiz-answerTrue");
      }
    });
  }

  stopTimer();

  setTimeout(() => {
    advance();
  }, FEEDBACK_DELAY);
}

function handleTimeUp() {
  stopTimer();
  const buttons = document.querySelectorAll(".quiz-answer");
  const currentQ = shuffledQuestions[currentQuestion];
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (
      shuffledAnswers[Number(btn.dataset.index)] === currentQ.correct_answer
    ) {
      btn.classList.add("quiz-answerTrue");
    }
  });
  setTimeout(() => advance(), FEEDBACK_DELAY);
}

function advance() {
  currentQuestion++;

  if (currentQuestion >= TOTAL_QUESTIONS) {
    currentScreen = "results";
  } else {
    currentScreen = "quiz";
  }

  render();
}

function startTimer() {
  let timeLeft = TIMER_DURATION;

  timerId = setInterval(() => {
    timeLeft--;
    const timerEl = document.querySelector("#quiz-timer");
    if (timerEl) {
      timerEl.textContent = timeLeft;
      if (timeLeft <= 5) timerEl.classList.add("quiz-timer--urgent");
    }
    if (timeLeft <= 0) handleTimeUp();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

// ─── AVVIO ────────────────────────────────────────────────────────────────────

render();
