// script.js

const STORAGE_KEY = 'quizDeckState';
let decks = [];
let activeDeckId = null;
let currentIndex = 0;
let activeTagFilter = '';
let currentScreen = 'home';

// DOM elements
const navHome = document.getElementById('nav-home');
const navCreate = document.getElementById('nav-create');
const navQuiz = document.getElementById('nav-quiz');
const homeScreen = document.getElementById('home-screen');
const createScreen = document.getElementById('create-screen');
const quizScreen = document.getElementById('quiz-screen');
const deckList = document.getElementById('deck-list');
const createDeckFromHomeBtn = document.getElementById('create-deck-from-home');
const createDeckForm = document.getElementById('create-deck-form');
const deckNameInput = document.getElementById('deck-name');
const quizDeckSelect = document.getElementById('quiz-deck-select');
const quizTagFilterSelect = document.getElementById('quiz-tag-filter');
const quizFlashcardEl = document.getElementById('quiz-flashcard');
const quizFlashcardFrontText = document.getElementById('quiz-flashcard-front-text');
const quizFlashcardBackText = document.getElementById('quiz-flashcard-back-text');
const quizFlashcardTags = document.getElementById('quiz-flashcard-tags');
const quizPrevBtn = document.getElementById('quiz-prev-btn');
const quizNextBtn = document.getElementById('quiz-next-btn');
const quizPanel = document.getElementById('quiz-panel');
const quizAnswerInput = document.getElementById('quiz-answer');
const quizCheckBtn = document.getElementById('quiz-check');
const quizFeedback = document.getElementById('quiz-feedback');
const quizProgress = document.getElementById('quiz-progress');
const newCardForm = document.getElementById('new-card-form');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const tagsInput = document.getElementById('tags');
const deleteBtn = document.getElementById('delete-btn');

function getActiveDeck() {
    return decks.find((deck) => deck.id === activeDeckId) || null;
}

function getActiveCards() {
    const deck = getActiveDeck();
    return deck?.cards ?? [];
}

function getVisibleCards() {
    const cards = getActiveCards();
    if (!activeTagFilter) return cards;
    return cards.filter((card) => (
        Array.isArray(card.tags) && card.tags.includes(activeTagFilter)
    ));
}

function getDeckTags() {
    const cards = getActiveCards();
    const tagSet = new Set();
    cards.forEach((card) => {
        if (Array.isArray(card.tags)) {
            card.tags.forEach((tag) => tagSet.add(tag));
        }
    });
    return Array.from(tagSet).sort();
}

function renderDeckSelector() {
    quizDeckSelect.innerHTML = '';

    if (decks.length === 0) {
        const placeholder = document.createElement('option');
        placeholder.textContent = 'No decks';
        placeholder.disabled = true;
        placeholder.selected = true;
        quizDeckSelect.appendChild(placeholder);
        quizDeckSelect.disabled = true;
        renderTagFilterOptions();
        return;
    }

    decks.forEach((deck) => {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        if (deck.id === activeDeckId) option.selected = true;
        quizDeckSelect.appendChild(option);
    });
    quizDeckSelect.disabled = false;

    renderTagFilterOptions();
}

function renderTagFilterOptions() {
    quizTagFilterSelect.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All';
    quizTagFilterSelect.appendChild(allOption);

    getDeckTags().forEach((tag) => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        quizTagFilterSelect.appendChild(option);
    });

    quizTagFilterSelect.value = activeTagFilter;
}

function setActiveDeck(deckId) {
    activeDeckId = deckId;
    currentIndex = 0;
    activeTagFilter = '';
    renderDeckSelector();
    renderCurrentCard();
    saveState();
}

function setActiveTagFilter(tag) {
    activeTagFilter = tag;
    currentIndex = 0;
    renderCurrentCard();
    saveState();
}

function createDeck(name) {
    const id = String(Date.now());
    decks.push({ id, name, cards: [] });
    setActiveDeck(id);
}

function renderDeckList() {
    deckList.innerHTML = '';

    if (decks.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'No decks yet. Create your first deck!';
        deckList.appendChild(emptyMsg);
        return;
    }

    decks.forEach((deck) => {
        const deckItem = document.createElement('div');
        deckItem.className = 'deck-item';

        const deckTitle = document.createElement('h3');
        deckTitle.textContent = deck.name;

        const deckStats = document.createElement('div');
        deckStats.className = 'deck-stats';
        deckStats.textContent = `${deck.cards.length} cards`;

        const selectBtn = document.createElement('button');
        selectBtn.textContent = 'Select';
        selectBtn.addEventListener('click', () => {
            setActiveDeck(deck.id);
            switchScreen('quiz');
        });

        deckItem.appendChild(deckTitle);
        deckItem.appendChild(deckStats);
        deckItem.appendChild(selectBtn);

        deckList.appendChild(deckItem);
    });
}

function renderCurrentCard() {
    // reset flip state
    quizFlashcardEl.classList.remove('flipped');

    const cards = getVisibleCards();

    if (cards.length === 0) {
        quizFlashcardFrontText.textContent = 'No cards yet';
        quizFlashcardBackText.textContent = '';
        quizFlashcardTags.textContent = '';
    } else {
        const card = cards[currentIndex];
        quizFlashcardFrontText.textContent = card.question;
        quizFlashcardBackText.textContent = card.answer;
        const tags = Array.isArray(card.tags) ? card.tags : [];
        quizFlashcardTags.textContent = tags.length ? `Tags: ${tags.join(', ')}` : '';
    }

    quizProgress.textContent = `${cards.length ? currentIndex + 1 : 0} / ${cards.length}`;
}

function switchScreen(screen) {
    currentScreen = screen;

    // Update nav buttons
    navHome.classList.toggle('active', screen === 'home');
    navCreate.classList.toggle('active', screen === 'create');
    navQuiz.classList.toggle('active', screen === 'quiz');

    // Show/hide screens
    homeScreen.classList.toggle('hidden', screen !== 'home');
    createScreen.classList.toggle('hidden', screen !== 'create');
    quizScreen.classList.toggle('hidden', screen !== 'quiz');

    if (screen === 'home') {
        renderDeckList();
    } else if (screen === 'quiz') {
        renderDeckSelector();
        renderCurrentCard();
    }
}

function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return;
    }

    try {
        const state = JSON.parse(stored);

        // support legacy single-deck format (cards list)
        if (Array.isArray(state.cards)) {
            decks = [{
                id: 'default',
                name: 'Default',
                cards: state.cards,
            }];
            activeDeckId = 'default';
            currentIndex = typeof state.currentIndex === 'number' ? state.currentIndex : 0;
            activeTagFilter = '';
        } else if (Array.isArray(state.decks)) {
            decks = state.decks;
            activeDeckId = state.activeDeckId ?? (decks[0] && decks[0].id) ?? null;
            currentIndex = typeof state.currentIndex === 'number' ? state.currentIndex : 0;
            activeTagFilter = typeof state.activeTagFilter === 'string' ? state.activeTagFilter : '';
        }
    } catch (e) {
        console.error('failed to parse state from storage', e);
        decks = [];
        activeDeckId = null;
        currentIndex = 0;
        activeTagFilter = '';
    }

    // clamp index to valid range for the active deck
    const cards = getActiveCards();
    if (cards.length === 0) {
        currentIndex = 0;
    } else if (currentIndex < 0 || currentIndex >= cards.length) {
        currentIndex = 0;
    }
}

function saveState() {
    const state = {
        decks,
        activeDeckId,
        currentIndex,
        activeTagFilter,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Event listeners
navHome.addEventListener('click', () => switchScreen('home'));
navCreate.addEventListener('click', () => switchScreen('create'));
navQuiz.addEventListener('click', () => switchScreen('quiz'));

createDeckFromHomeBtn.addEventListener('click', () => switchScreen('create'));

createDeckForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = deckNameInput.value.trim();
    if (!name) return;
    createDeck(name);
    createDeckForm.reset();
    switchScreen('home');
});

quizDeckSelect.addEventListener('change', (e) => {
    setActiveDeck(e.target.value);
});

quizTagFilterSelect.addEventListener('change', (e) => {
    setActiveTagFilter(e.target.value);
});

quizFlashcardEl.addEventListener('click', () => {
    quizFlashcardEl.classList.toggle('flipped');
});

quizPrevBtn.addEventListener('click', () => {
    const cards = getVisibleCards();
    if (cards.length === 0) return;
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = cards.length - 1;
    }
    renderCurrentCard();
    saveState();
});

quizNextBtn.addEventListener('click', () => {
    const cards = getVisibleCards();
    if (cards.length === 0) return;
    if (currentIndex < cards.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    renderCurrentCard();
    saveState();
});

quizCheckBtn.addEventListener('click', () => {
    const cards = getVisibleCards();
    if (cards.length === 0) return;

    const card = cards[currentIndex];
    const userAnswer = quizAnswerInput.value.trim().toLowerCase();
    const correctAnswer = (card.answer || '').trim().toLowerCase();

    if (!userAnswer) {
        quizFeedback.textContent = 'Please enter an answer.';
        return;
    }

    if (userAnswer === correctAnswer) {
        quizFeedback.textContent = 'Correct! ✅';
    } else {
        quizFeedback.textContent = `Incorrect. Correct answer: ${card.answer}`;
    }
});

newCardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    const tagsValue = tagsInput.value.trim();
    if (!question || !answer) return;

    const tags = tagsValue
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    const newCard = {
        id: Date.now(),
        question,
        answer,
        tags,
    };

    const deck = getActiveDeck();
    if (!deck) return;

    deck.cards.push(newCard);
    currentIndex = deck.cards.length - 1;
    saveState();
    renderCurrentCard();
    renderDeckList(); // Update deck stats on home screen

    newCardForm.reset();
    tagsInput.value = '';
});

// delete current card
deleteBtn.addEventListener('click', () => {
    const deck = getActiveDeck();
    if (!deck || deck.cards.length === 0) return;

    deck.cards.splice(currentIndex, 1);

    if (deck.cards.length === 0) {
        currentIndex = 0;
    } else if (currentIndex >= deck.cards.length) {
        currentIndex = deck.cards.length - 1;
    }

    saveState();
    renderCurrentCard();
    renderDeckList(); // Update deck stats on home screen
});

// Initialize
loadState();

if (decks.length === 0) {
    createDeck('Default');
} else if (!activeDeckId) {
    setActiveDeck(decks[0].id);
}

switchScreen('home');
