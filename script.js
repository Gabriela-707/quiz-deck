// script.js

const STORAGE_KEY = 'quizDeckState';
let decks = [];
let activeDeckId = null;
let currentIndex = 0;
let activeTagFilter = '';
let quizMode = false;

// DOM elements
const form = document.getElementById('new-card-form');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const tagsInput = document.getElementById('tags');
const deckSelect = document.getElementById('deck-select');
const newDeckBtn = document.getElementById('new-deck-btn');
const tagFilterSelect = document.getElementById('tag-filter');
const quizModeBtn = document.getElementById('quiz-mode-btn');
const quizPanel = document.getElementById('quiz-panel');
const quizAnswerInput = document.getElementById('quiz-answer');
const quizCheckBtn = document.getElementById('quiz-check');
const quizFeedback = document.getElementById('quiz-feedback');
const quizProgress = document.getElementById('quiz-progress');
const flashcardEl = document.getElementById('flashcard');
const flashcardFront = document.getElementById('flashcard-front');
const flashcardBack = document.getElementById('flashcard-back');
const flashcardFrontText = document.getElementById('flashcard-front-text');
const flashcardBackText = document.getElementById('flashcard-back-text');
const flashcardTags = document.getElementById('flashcard-tags');
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

function renderTagFilterOptions() {
    tagFilterSelect.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All';
    tagFilterSelect.appendChild(allOption);

    getDeckTags().forEach((tag) => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilterSelect.appendChild(option);
    });

    tagFilterSelect.value = activeTagFilter;
}

function setActiveTagFilter(tag) {
    activeTagFilter = tag;
    currentIndex = 0;
    renderCurrentCard();
    saveState();
}

function renderDeckSelector() {
    deckSelect.innerHTML = '';

    if (decks.length === 0) {
        const placeholder = document.createElement('option');
        placeholder.textContent = 'No decks';
        placeholder.disabled = true;
        placeholder.selected = true;
        deckSelect.appendChild(placeholder);
        deckSelect.disabled = true;
        renderTagFilterOptions();
        return;
    }

    decks.forEach((deck) => {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        if (deck.id === activeDeckId) option.selected = true;
        deckSelect.appendChild(option);
    });
    deckSelect.disabled = false;

    renderTagFilterOptions();
}

function setActiveDeck(deckId) {
    activeDeckId = deckId;
    currentIndex = 0;
    activeTagFilter = '';
    renderDeckSelector();
    renderCurrentCard();
    saveState();
}

function setQuizMode(on) {
    quizMode = Boolean(on);
    quizModeBtn.textContent = quizMode ? 'Exit Quiz' : 'Start Quiz';

    if (quizMode) {
        currentIndex = 0;
        activeTagFilter = '';
    }

    renderCurrentCard();
}

function createDeck(name) {
    const id = String(Date.now());
    decks.push({ id, name, cards: [] });
    setActiveDeck(id);
}

// load any saved cards and index on startup
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

// render the card at currentIndex (or placeholder if none)
function renderCurrentCard() {
    // reset flip state
    flashcardEl.classList.remove('flipped');

    renderTagFilterOptions();
    const cards = getVisibleCards();

    if (quizMode) {
        quizPanel.hidden = false;
        quizAnswerInput.value = '';
        quizFeedback.textContent = '';
        quizProgress.textContent = `${cards.length ? currentIndex + 1 : 0} / ${cards.length}`;
    } else {
        quizPanel.hidden = true;
    }

    if (cards.length === 0) {
        flashcardFrontText.textContent = 'No cards yet';
        flashcardBackText.textContent = '';
        flashcardTags.textContent = '';
    } else {
        const card = cards[currentIndex];
        flashcardFrontText.textContent = card.question;
        flashcardBackText.textContent = card.answer;
        const tags = Array.isArray(card.tags) ? card.tags : [];
        flashcardTags.textContent = tags.length ? `Tags: ${tags.join(', ')}` : '';
    }
}

// form submit handling
form.addEventListener('submit', (e) => {
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

    form.reset();
    tagsInput.value = '';
});

// flip action when clicking the card
flashcardEl.addEventListener('click', () => {
    if (quizMode) return;
    const cards = getActiveCards();
    if (cards.length === 0) return;
    flashcardEl.classList.toggle('flipped');
});

// navigation controls
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

function showCardAt(index) {
    const cards = getActiveCards();
    if (cards.length === 0) return;
    // clamp index to valid range
    if (index < 0) {
        index = cards.length - 1; // wrap around to end
    } else if (index >= cards.length) {
        index = 0; // wrap around to start
    }
    currentIndex = index;
    renderCurrentCard();
    saveState();
}

prevBtn.addEventListener('click', () => {
    showCardAt(currentIndex - 1);
});
nextBtn.addEventListener('click', () => {
    showCardAt(currentIndex + 1);
});

deckSelect.addEventListener('change', (e) => {
    setActiveDeck(e.target.value);
});

tagFilterSelect.addEventListener('change', (e) => {
    setActiveTagFilter(e.target.value);
});

newDeckBtn.addEventListener('click', () => {
    const name = window.prompt('Enter a name for the new deck:', 'New Deck');
    if (!name) return;
    createDeck(name.trim() || 'Untitled');
});

quizModeBtn.addEventListener('click', () => {
    setQuizMode(!quizMode);
});

quizCheckBtn.addEventListener('click', () => {
    if (!quizMode) return;

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
});

// initialize
loadState();

if (decks.length === 0) {
    createDeck('Default');
} else if (!activeDeckId) {
    setActiveDeck(decks[0].id);
} else {
    renderDeckSelector();
    renderCurrentCard();
}
