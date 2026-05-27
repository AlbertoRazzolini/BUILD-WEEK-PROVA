// le domande del quiz
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

// quante domande ci sono, quanto tempo hai e timing gifs post risultato
const TOTAL_QUESTIONS = QUESTIONS.length;
const PASS_THRESHOLD = 60;
const TIMER_DURATION = 20;
const FEEDBACK_DELAY = 2500;
const NOTIFICATION_FADE_IN = 2000;
const NOTIFICATION_VISIBLE = 1500;
const NOTIFICATION_FADE_OUT = 1200;

// qui teniamo traccia di dove siamo nel quiz
let currentScreen = "welcome";
// "welcome" | "quiz" | "results"
let currentQuestion = 0;
let score = 0;
let shuffledAnswers = [];
let shuffledQuestions = [];
let timerId = null;

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────

// chiave per salvare la cronologia nel browser
const HISTORY_KEY = "quizHistory";

// legge, aggiunge e cancella la cronologia dal browser
const getHistory = () => JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
const pushHistory = (item) => {
  const h = getHistory();
  h.push(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
};
const clearHistory = () => localStorage.removeItem(HISTORY_KEY);

// ─── UTILITY ──────────────────────────────────────────────────────────────────

// crea una funzione make helper che costruisce un elemento HTML con classe e testo, così non dobbiamo scrivere sempre document.createElement e setAttribute ogni volta
const make = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

// mescola un array
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// ─── RENDERIZZAZIONE ───────────────────────────────────────────────────────────────────

render();

// ─── FUNZIONI DI RENDERING ───────────────────────────────────────────────────────────────────

// decide quale schermata mostrare e la disegna
function render() {
  const app = document.querySelector("#app");
  app.replaceChildren();

  if (currentScreen === "welcome") {
    app.appendChild(renderWelcome());
    document.querySelector("#btn-start").addEventListener("click", handleStart);
  } else if (currentScreen === "quiz") {
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
    const passed =
      Math.round((score / TOTAL_QUESTIONS) * 100) >= PASS_THRESHOLD;
    showResultNotification(passed);
    document
      .querySelector("#btn-restart")
      .addEventListener("click", handleRestart);
    document.querySelector("#btn-feedback").addEventListener("click", () => {
      currentScreen = "feedback";
      render();
    });
  } else if (currentScreen === "feedback") {
    app.appendChild(renderFeedback());
    document
      .querySelector("#btn-restart")
      .addEventListener("click", handleRestart);
  }
}

// ─── RENDER WELCOME ───────────────────────────────────────────────────────────

// la schermata iniziale con il titolo e le istruzioni
function renderWelcome() {
  const screen = make("div", "screen-welcome");
  const title = make("h2", "welcome-title", "Quiz Tech");

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

// costruisce la schermata con la domanda e le risposte
function renderQuiz() {
  const q = shuffledQuestions[currentQuestion];
  shuffledAnswers = shuffle([q.correct_answer, ...q.incorrect_answers]);

  const letters = ["A", "B", "C", "D"];

  const screen = make("div", "screen-quiz");
  screen.dataset.questionId = q.id;

  const header = make("div", "quiz-header");
  const counter = make(
    "span",
    "quiz-counter",
    `Domanda ${currentQuestion + 1} / ${TOTAL_QUESTIONS}`,
  );
  // timer con icona e conto alla rovescia
  const timerWrapper = make("div", "quiz-timer-wrapper");
  const timerIcon = make("span", "quiz-timer-icon", "⌛");
  const timer = make("span", "quiz-timer", String(TIMER_DURATION));
  timer.id = "quiz-timer";
  timerWrapper.append(timerIcon, timer);
  header.append(counter, timerWrapper);

  const question = make("h2", "quiz-question", q.question);

  // crea i bottoni per ogni risposta con la lettera davanti
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

// mostra il riepilogo finale con il punteggio e le risposte sbagliate
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

  const outcome = passed
    ? make("span", "verdictP", "Promosso!")
    : make("span", "verdictB", "Bocciato");

  // Grafico a torta
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

  // lista di tutte le domande con esito, presa dal localStorage
  const list = make("ul", "results-list");
  getHistory().forEach((item, i) => {
    const itemEl = make(
      "li",
      `results-item ${item.isCorrect ? "results-item--correct" : "results-item--wrong"}`,
    );

    const header = make("div", "results-item__header");
    const icon = make("span", "results-item__icon", item.isCorrect ? "✓" : "✗");
    const qText = make(
      "span",
      "results-item__question",
      `${i + 1}. ${item.question}`,
    );
    header.append(icon, qText);
    itemEl.appendChild(header);

    // se ha sbagliato, mostra la risposta giusta
    if (!item.isCorrect) {
      const hint = make("p", "results-item__hint");
      hint.append(
        "Risposta corretta: ",
        make("strong", "results-item__correct-answer", item.correctAnswer),
      );
      itemEl.appendChild(hint);
    }

    list.appendChild(itemEl);
  });

  const btnRestart = make("button", "btn btn--secondary", "Riprova");
  btnRestart.id = "btn-restart";

  const btnFeedback = make("button", "btn btn--primary", "Lascia un voto");
  btnFeedback.id = "btn-feedback";

  screen.append(
    subtitle,
    message,
    outcome,
    chartContainer,
    scoreLabel,
    list,
    btnRestart,
    btnFeedback,
  );
  return screen;
}

// ─── RENDER FEEDBACK ──────────────────────────────────────────────────────────

// schermata per lasciare un voto con le stelline (o le banane)
function renderFeedback() {
  const screen = make("div", "screen-feedback");
  const title = make("h3", "feedback-title", "Che ne pensi del quiz?");
  const subtitle = make("p", "feedback-subtitle", "Valutaci!!!");

  const starsContainer = make("div", "feedback-stars");
  const starEls = [];
  let rating = 0;

  // accende le stelle da 0 a n
  const updateStars = (n) => {
    starEls.forEach((s, idx) => {
      s.classList.toggle("feedback-star--active", idx < n);
    });
  };

  for (let i = 1; i <= 5; i++) {
    const star = make("span", "feedback-star", "🍌");
    star.dataset.value = i;
    starEls.push(star);
    starsContainer.appendChild(star);
  }

  starEls.forEach((star, idx) => {
    star.addEventListener("mouseover", () => updateStars(idx + 1));
    star.addEventListener("click", () => {
      rating = idx + 1;
      updateStars(rating);
      localStorage.setItem("quizRating", rating);
    });
  });

  // quando il mouse esce, torna alla valutazione salvata
  starsContainer.addEventListener("mouseleave", () => updateStars(rating));

  const btn = make("button", "btn btn--primary", "Ricomincia");
  btn.id = "btn-restart";

  screen.append(title, subtitle, starsContainer, btn);
  return screen;
}

// mostra il toast con la gif di promosso o bocciato, poi sparisce in dissolvenza
function showResultNotification(passed) {
  const overlay = make("div", "toast-overlay");

  const toast = make("div", "toast");
  const media = make("div", "toast__media");

  const image = document.createElement("img");
  image.className = passed
    ? "toast__image toast__image--passed"
    : "toast__image";
  image.src = passed
    ? "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExejA5dm5pc3YxMHp2dGR3aWEzaHBzc3Q2amsxeG10c2docmhkMDUwdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/55SfA4BxofRBe/giphy.gif"
    : "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeDEwMWIyYWxqeGJ6M3Vnczg0eDdqYXMyN3ozM2ZhZmJqdG84aDh6NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3tLenJm0ieE00WTHmC/giphy.gif";
  image.alt = passed ? "GIF promosso" : "GIF bocciato";
  media.appendChild(image);

  const content = make("div", "toast__content");
  content.append(
    make("strong", "toast__title", passed ? "Promosso!" : "Bocciato!"),
    make(
      "p",
      "toast__text",
      passed
        ? "Hai superato il quiz! Complimenti, questo è il risultato finale."
        : "Non hai raggiunto la soglia: riprova e impara dagli errori.",
    ),
  );
  // mettiamo tutto insieme e lo aggiungiamo al DOM
  toast.append(media, content);
  overlay.appendChild(toast);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add("toast-overlay--visible"));
  // aggiungiamo un overlay con la gif e il messaggio
  setTimeout(
    () => overlay.classList.add("toast-overlay--hide"),
    NOTIFICATION_FADE_IN + NOTIFICATION_VISIBLE,
  );

  // dopo l'animazione lo togliamo in dissolvenza proprio dal DOM
  setTimeout(
    () => overlay.remove(),
    NOTIFICATION_FADE_IN + NOTIFICATION_VISIBLE + NOTIFICATION_FADE_OUT,
  );
}

// ─── LOGICA ───────────────────────────────────────────────────────────────────

// parte il quiz da zero
function handleStart() {
  currentQuestion = 0;
  score = 0;
  clearHistory();
  currentScreen = "quiz";
  render();
}

// torna alla schermata iniziale e resetta la pagina, utile per fare un nuovo tentativo
function handleRestart() {
  currentQuestion = 0;
  score = 0;
  clearHistory();
  currentScreen = "welcome";
  render();
}

// gestisce quando l'utente clicca su una risposta
function handleAnswer(button, answer) {
  const buttons = document.querySelectorAll(".quiz-answer");
  buttons.forEach((btn) => (btn.disabled = true));

  const currentQ = shuffledQuestions[currentQuestion];
  const isCorrect = answer === currentQ.correct_answer;
  // salva la risposta data dall'utente nella cronologia, così possiamo mostrarla nei risultati alla fine
  pushHistory({
    question: currentQ.question,
    userAnswer: answer,
    correctAnswer: currentQ.correct_answer,
    isCorrect,
  });

  if (isCorrect) {
    score++;
    button.classList.add("quiz-answerTrue");
  } else {
    button.classList.add("quiz-answerFalse");
    // evidenzia comunque la risposta giusta
    buttons.forEach((btn) => {
      if (
        shuffledAnswers[Number(btn.dataset.index)] === currentQ.correct_answer
      ) {
        btn.classList.add("quiz-answerTrue");
      }
    });
  }
  // ferma il timer e passa alla domanda successiva dopo un breve intervallo per mostrare il feedback
  stopTimer();
  setTimeout(() => advance(), FEEDBACK_DELAY);
}

// il tempo è scaduto, segna la domanda come sbagliata e vai avanti
function handleTimeUp() {
  stopTimer();
  const buttons = document.querySelectorAll(".quiz-answer");
  const currentQ = shuffledQuestions[currentQuestion];

  pushHistory({
    question: currentQ.question,
    userAnswer: null,
    correctAnswer: currentQ.correct_answer,
    isCorrect: false,
  });
  // disabilita i bottoni e mostra la risposta corretta
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

// passa alla domanda successiva, o ai risultati se abbiamo finito
function advance() {
  currentQuestion++;
  currentScreen = currentQuestion >= TOTAL_QUESTIONS ? "results" : "quiz";
  render();
}

// fa partire il conto alla rovescia
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

// ferma il timer
function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}
