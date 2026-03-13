// quiz.js
// Handles quiz mode:
// - startQuiz()        shuffle cards, init quizState, show quiz view
// - renderQuizCard()   display current quiz card
// - markCorrect()      increment correct count, advance card
// - markIncorrect()    increment incorrect count, advance card
// - showResults()      display score summary screen
// - retryMissed()      re-queue only incorrectly answered cards
// - shuffle(array)     Fisher-Yates shuffle, returns new array

import { appState, setState } from "./state.js";
import { showView, toast } from "./ui.js";

// ── DOM references ───────────────────────────────────────────────────────────

const quizDeckTitle  = document.getElementById("quiz-deck-title");
const quizCounter    = document.getElementById("quiz-counter");
const quizScore      = document.getElementById("quiz-score");
const quizFlashcard  = document.getElementById("quiz-flashcard");
const quizQuestion   = document.getElementById("quiz-question");
const quizAnswer     = document.getElementById("quiz-answer");
const quizAnswerBtns = document.getElementById("quiz-answer-btns");
const quizResults    = document.getElementById("quiz-results");
const resultsSummary = document.getElementById("results-summary");

// ── Fisher-Yates Shuffle ─────────────────────────────────────────────────────

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// ── Start Quiz ───────────────────────────────────────────────────────────────

function startQuiz(cards) {
    if (!cards || cards.length === 0) {
        toast("Add some cards before starting a quiz.", "error");
        return;
    }

    const queue = shuffle(cards);

    setState({
        quizState: {
            queue,
            currentIndex: 0,
            correct: 0,
            incorrect: 0,
            missedCards: [],
        },
    });

    quizDeckTitle.textContent = appState.currentDeck.title;
    quizResults.classList.add("hidden");
    showView("view-quiz");
    renderQuizCard();
}

// ── Render Current Quiz Card ─────────────────────────────────────────────────

function renderQuizCard() {
    const { queue, currentIndex } = appState.quizState;

    // Reset flip and hide answer buttons
    quizFlashcard.classList.remove("is-flipped");
    quizAnswerBtns.classList.add("hidden");

    const card = queue[currentIndex];
    quizQuestion.textContent = card.question;
    quizAnswer.textContent   = card.answer;

    quizCounter.textContent = `Card ${currentIndex + 1} / ${queue.length}`;
    quizScore.textContent   = `Score: ${appState.quizState.correct} / ${currentIndex}`;
}

// ── Flip Quiz Card ───────────────────────────────────────────────────────────

function flipQuizCard() {
    // Only allow flip if not already flipped (answer buttons not yet shown)
    if (quizFlashcard.classList.contains("is-flipped")) return;

    quizFlashcard.classList.add("is-flipped");
    quizAnswerBtns.classList.remove("hidden");
}

// ── Mark Correct / Incorrect ─────────────────────────────────────────────────

function markCorrect() {
    // Guard against double-clicks — buttons are hidden after advancing
    if (quizAnswerBtns.classList.contains("hidden")) return;

    const qs = appState.quizState;
    setState({
        quizState: {
            ...qs,
            correct: qs.correct + 1,
            currentIndex: qs.currentIndex + 1,
        },
    });
    advanceOrFinish();
}

function markIncorrect() {
    // Guard against double-clicks — buttons are hidden after advancing
    if (quizAnswerBtns.classList.contains("hidden")) return;

    const qs = appState.quizState;
    const missedCard = qs.queue[qs.currentIndex];
    setState({
        quizState: {
            ...qs,
            incorrect: qs.incorrect + 1,
            missedCards: [...qs.missedCards, missedCard],
            currentIndex: qs.currentIndex + 1,
        },
    });
    advanceOrFinish();
}

function advanceOrFinish() {
    const { queue, currentIndex } = appState.quizState;
    if (currentIndex >= queue.length) {
        showResults();
    } else {
        renderQuizCard();
    }
}

// ── Results Screen ───────────────────────────────────────────────────────────

function showResults() {
    const { correct, incorrect, queue } = appState.quizState;
    const total = queue.length;
    const pct = Math.round((correct / total) * 100);

    resultsSummary.textContent = `You got ${correct} out of ${total} correct (${pct}%).`;

    // Hide the card and answer buttons, show results
    quizFlashcard.closest(".card-scene").classList.add("hidden");
    quizAnswerBtns.classList.add("hidden");
    document.querySelector("#view-quiz .quiz-progress").classList.add("hidden");
    quizResults.classList.remove("hidden");

    // Only show "Retry Missed" if there were missed cards
    document.getElementById("btn-retry-missed").classList.toggle("hidden", incorrect === 0);
}

// ── Retry Missed Cards ───────────────────────────────────────────────────────

function retryMissed() {
    const { missedCards } = appState.quizState;
    if (missedCards.length === 0) return;

    // Restart quiz with only the missed cards
    restoreQuizUI();
    startQuiz(missedCards);
}

// ── Restart Quiz ─────────────────────────────────────────────────────────────

function restartQuiz() {
    restoreQuizUI();
    startQuiz(appState.cards);
}

// ── Back to Deck ─────────────────────────────────────────────────────────────

function backToDeck() {
    restoreQuizUI();
    import("./cards.js").then(({ loadCards }) => loadCards());
}

// ── Exit Quiz (top-left button) ──────────────────────────────────────────────

function exitQuiz() {
    restoreQuizUI();
    import("./cards.js").then(({ loadCards }) => loadCards());
}

// Restore hidden elements so the quiz view is clean for next time
function restoreQuizUI() {
    quizFlashcard.closest(".card-scene").classList.remove("hidden");
    document.querySelector("#view-quiz .quiz-progress").classList.remove("hidden");
    quizResults.classList.add("hidden");
    quizAnswerBtns.classList.add("hidden");
}

// ── Event Listeners ──────────────────────────────────────────────────────────

// Start quiz from card viewer
document.getElementById("btn-start-quiz").addEventListener("click", () => {
    startQuiz(appState.cards);
});

// Flip quiz card on click
quizFlashcard.addEventListener("click", flipQuizCard);

// Correct / Incorrect buttons
document.getElementById("btn-correct").addEventListener("click", markCorrect);
document.getElementById("btn-incorrect").addEventListener("click", markIncorrect);

// Results screen buttons
document.getElementById("btn-retry-missed").addEventListener("click", retryMissed);
document.getElementById("btn-restart-quiz").addEventListener("click", restartQuiz);
document.getElementById("btn-back-from-quiz").addEventListener("click", backToDeck);

// Exit quiz (top-left)
document.getElementById("btn-exit-quiz").addEventListener("click", exitQuiz);
