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
const navEdit = document.getElementById('nav-edit');
const navQuiz = document.getElementById('nav-quiz');
const homeScreen = document.getElementById('home-screen');
const createScreen = document.getElementById('create-screen');
const editScreen = document.getElementById('edit-screen');
const quizScreen = document.getElementById('quiz-screen');
const deckList = document.getElementById('deck-list');
const createDeckFromHomeBtn = document.getElementById('create-deck-from-home');
const createDeckForm = document.getElementById('create-deck-form');
const deckNameInput = document.getElementById('deck-name');
const editDeckSelect = document.getElementById('edit-deck-select');
const editDeckInfo = document.getElementById('edit-deck-info');
const editDeckTitle = document.getElementById('edit-deck-title');
const editDeckCardCount = document.getElementById('edit-deck-card-count');
const renameDeckBtn = document.getElementById('rename-deck-btn');
const deleteDeckBtn = document.getElementById('delete-deck-btn');
const editCardList = document.getElementById('edit-card-list');
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

function renderEditDeckSelector() {
    console.log('Rendering edit deck selector');
    editDeckSelect.innerHTML = '';

    if (decks.length === 0) {
        const placeholder = document.createElement('option');
        placeholder.textContent = 'No decks available';
        placeholder.disabled = true;
        placeholder.selected = true;
        editDeckSelect.appendChild(placeholder);
        editDeckSelect.disabled = true;
        editDeckInfo.hidden = true;
        return;
    }

    decks.forEach((deck) => {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        if (deck.id === activeDeckId) option.selected = true;
        editDeckSelect.appendChild(option);
    });
    editDeckSelect.disabled = false;

    // Show deck info if a deck is selected
    if (activeDeckId) {
        renderEditDeckInfo();
    } else {
        editDeckInfo.hidden = true;
    }
}

function renderEditDeckInfo() {
    const deck = getActiveDeck();
    if (!deck) {
        editDeckInfo.hidden = true;
        return;
    }

    editDeckTitle.textContent = deck.name;
    editDeckCardCount.textContent = deck.cards.length;
    editDeckInfo.hidden = false;

    renderEditCardList();
}

function renderEditCardList() {
    const deck = getActiveDeck();
    if (!deck) return;

    editCardList.innerHTML = '';

    if (deck.cards.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'No cards in this deck yet.';
        editCardList.appendChild(emptyMsg);
        return;
    }

    deck.cards.forEach((card, index) => {
        const cardItem = document.createElement('div');
        cardItem.className = 'edit-card-item';

        const cardContent = document.createElement('div');
        cardContent.className = 'edit-card-content';

        const cardQuestion = document.createElement('div');
        cardQuestion.className = 'edit-card-question';
        cardQuestion.textContent = `Q: ${card.question}`;

        const cardAnswer = document.createElement('div');
        cardAnswer.className = 'edit-card-answer';
        cardAnswer.textContent = `A: ${card.answer}`;

        const cardActions = document.createElement('div');
        cardActions.className = 'edit-card-actions';

        const editCardBtn = document.createElement('button');
        editCardBtn.textContent = 'Edit';
        editCardBtn.className = 'btn-secondary btn-small';
        editCardBtn.addEventListener('click', () => editCard(index));

        const deleteCardBtn = document.createElement('button');
        deleteCardBtn.textContent = 'Delete';
        deleteCardBtn.className = 'btn-danger btn-small';
        deleteCardBtn.addEventListener('click', () => deleteCard(index));

        cardContent.appendChild(cardQuestion);
        cardContent.appendChild(cardAnswer);

        cardActions.appendChild(editCardBtn);
        cardActions.appendChild(deleteCardBtn);

        cardItem.appendChild(cardContent);
        cardItem.appendChild(cardActions);

        editCardList.appendChild(cardItem);
    });
}

function editCard(cardIndex) {
    const deck = getActiveDeck();
    if (!deck || !deck.cards[cardIndex]) return;

    const card = deck.cards[cardIndex];
    const newQuestion = prompt('Edit question:', card.question);
    if (newQuestion === null) return;

    const newAnswer = prompt('Edit answer:', card.answer);
    if (newAnswer === null) return;

    const newTags = prompt('Edit tags (comma-separated):', Array.isArray(card.tags) ? card.tags.join(', ') : '');

    card.question = newQuestion.trim();
    card.answer = newAnswer.trim();
    card.tags = newTags ? newTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    saveState();
    renderEditCardList();
    renderDeckList(); // Update home screen
}

function deleteCard(cardIndex) {
    const deck = getActiveDeck();
    if (!deck || !confirm('Are you sure you want to delete this card?')) return;

    deck.cards.splice(cardIndex, 1);
    saveState();
    renderEditCardList();
    renderEditDeckInfo();
    renderDeckList(); // Update home screen
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

        const deckInfo = document.createElement('div');
        deckInfo.className = 'deck-info';

        const deckTitle = document.createElement('h3');
        deckTitle.textContent = deck.name;

        const deckStats = document.createElement('div');
        deckStats.className = 'deck-stats';
        deckStats.textContent = `${deck.cards.length} cards`;

        const deckButtons = document.createElement('div');
        deckButtons.className = 'deck-buttons';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn-secondary';
        editBtn.addEventListener('click', () => {
            console.log('Edit button clicked for deck:', deck.id);
            setActiveDeck(deck.id);
            switchScreen('edit');
        });

        const quizBtn = document.createElement('button');
        quizBtn.textContent = 'Quiz';
        quizBtn.className = 'btn-primary';
        quizBtn.addEventListener('click', () => {
            setActiveDeck(deck.id);
            switchScreen('quiz');
        });

        deckInfo.appendChild(deckTitle);
        deckInfo.appendChild(deckStats);

        deckButtons.appendChild(editBtn);
        deckButtons.appendChild(quizBtn);

        deckItem.appendChild(deckInfo);
        deckItem.appendChild(deckButtons);

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
    console.log('Switching to screen:', screen);
    currentScreen = screen;

    // Update nav buttons
    navHome.classList.toggle('active', screen === 'home');
    navCreate.classList.toggle('active', screen === 'create');
    navEdit.classList.toggle('active', screen === 'edit');
    navQuiz.classList.toggle('active', screen === 'quiz');

    // Show/hide screens
    homeScreen.classList.toggle('hidden', screen !== 'home');
    createScreen.classList.toggle('hidden', screen !== 'create');
    editScreen.classList.toggle('hidden', screen !== 'edit');
    quizScreen.classList.toggle('hidden', screen !== 'quiz');

    if (screen === 'home') {
        renderDeckList();
    } else if (screen === 'edit') {
        renderEditDeckSelector();
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
navEdit.addEventListener('click', () => switchScreen('edit'));
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

editDeckSelect.addEventListener('change', (e) => {
    setActiveDeck(e.target.value);
    renderEditDeckInfo();
});

renameDeckBtn.addEventListener('click', () => {
    const deck = getActiveDeck();
    if (!deck) return;

    const newName = prompt('Enter new deck name:', deck.name);
    if (!newName || newName.trim() === '') return;

    deck.name = newName.trim();
    saveState();
    renderEditDeckSelector();
    renderEditDeckInfo();
    renderDeckList(); // Update home screen
});

deleteDeckBtn.addEventListener('click', () => {
    const deck = getActiveDeck();
    if (!deck) return;

    if (!confirm(`Are you sure you want to delete the deck "${deck.name}" and all its ${deck.cards.length} cards?`)) return;

    const deckIndex = decks.findIndex(d => d.id === deck.id);
    if (deckIndex !== -1) {
        decks.splice(deckIndex, 1);
    }

    activeDeckId = decks.length > 0 ? decks[0].id : null;
    saveState();
    renderEditDeckSelector();
    renderDeckList(); // Update home screen
    switchScreen('home'); // Go back to home screen
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
