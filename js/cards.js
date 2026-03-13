// cards.js
// Handles the card viewer:
// - loadCards()        fetch cards for the current deck
// - renderCard()       display the current card (question side)
// - flipCard()         toggle the .is-flipped CSS class
// - nextCard()         advance currentCardIndex and re-render
// - prevCard()         decrement currentCardIndex and re-render
// - openAddCardModal() open modal for new card creation
// - openEditCardModal(card) open modal pre-filled for editing
// - deleteCurrentCard() remove card from Firestore and appState

import { appState, setState } from "./state.js";
import { showView, openModal, closeModal, showSpinner, hideSpinner, toast } from "./ui.js";
import { getCards, createCard, updateCard, deleteCard } from "./firestore.js";

// ── DOM references ───────────────────────────────────────────────────────────

const deckTitleDisplay = document.getElementById("deck-title-display");
const flashcard        = document.getElementById("flashcard");
const cardQuestion     = document.getElementById("card-question");
const cardAnswer       = document.getElementById("card-answer");
const cardCounter      = document.getElementById("card-counter");
const cardsEmpty       = document.getElementById("cards-empty");
const cardScene        = flashcard.closest(".card-scene");
const cardNav          = document.querySelector("#view-cards .card-nav");
const cardActions      = document.querySelector("#view-cards .card-actions");

// ── Load & Render ────────────────────────────────────────────────────────────

/**
 * Fetch all cards for the current deck and switch to the card viewer.
 * Called by deck.js → openDeck().
 */
export async function loadCards() {
    const { currentUser, currentDeck } = appState;
    deckTitleDisplay.textContent = currentDeck.title;

    showView("view-cards");
    showSpinner();

    try {
        const cards = await getCards(currentUser.uid, currentDeck.id);
        setState({ cards, currentCardIndex: 0 });
        renderCard();
    } catch (err) {
        toast("Failed to load cards.", "error");
        console.error(err);
    } finally {
        hideSpinner();
    }
}

/**
 * Display the current card (question side) or show the empty state.
 */
function renderCard() {
    const { cards, currentCardIndex } = appState;

    // Always reset flip when rendering a new card
    flashcard.classList.remove("is-flipped");

    if (cards.length === 0) {
        cardsEmpty.classList.remove("hidden");
        cardScene.classList.add("hidden");
        cardNav.classList.add("hidden");
        cardActions.querySelector("#btn-edit-card").disabled = true;
        cardActions.querySelector("#btn-delete-card").disabled = true;
        document.getElementById("btn-start-quiz").disabled = true;
        cardCounter.textContent = "0 / 0";
        return;
    }

    cardsEmpty.classList.add("hidden");
    cardScene.classList.remove("hidden");
    cardNav.classList.remove("hidden");
    document.getElementById("btn-edit-card").disabled = false;
    document.getElementById("btn-delete-card").disabled = false;
    document.getElementById("btn-start-quiz").disabled = false;

    const card = cards[currentCardIndex];
    cardQuestion.textContent = card.question;
    cardAnswer.textContent   = card.answer;
    cardCounter.textContent  = `${currentCardIndex + 1} / ${cards.length}`;

    // Disable prev/next at boundaries
    document.getElementById("btn-prev").disabled = currentCardIndex === 0;
    document.getElementById("btn-next").disabled = currentCardIndex === cards.length - 1;
}

// ── Flip ─────────────────────────────────────────────────────────────────────

function flipCard() {
    if (appState.cards.length === 0) return;
    flashcard.classList.toggle("is-flipped");
}

// ── Navigation ───────────────────────────────────────────────────────────────

function nextCard() {
    if (appState.currentCardIndex < appState.cards.length - 1) {
        setState({ currentCardIndex: appState.currentCardIndex + 1 });
        renderCard();
    }
}

function prevCard() {
    if (appState.currentCardIndex > 0) {
        setState({ currentCardIndex: appState.currentCardIndex - 1 });
        renderCard();
    }
}

// ── Add Card ─────────────────────────────────────────────────────────────────

function openAddCardModal() {
    openModal({
        title: "Add Card",
        fields: [
            { id: "modal-card-question", label: "Question", type: "textarea", placeholder: "Front of the card" },
            { id: "modal-card-answer",   label: "Answer",   type: "textarea", placeholder: "Back of the card" },
        ],
        submitLabel: "Add Card",
        onSubmit: async ({ "modal-card-question": question, "modal-card-answer": answer }) => {
            if (!question || !answer) return;
            document.getElementById("modal-submit").disabled = true;
            showSpinner();
            try {
                const { currentUser, currentDeck } = appState;
                const id = await createCard(currentUser.uid, currentDeck.id, { question, answer });
                closeModal();

                // Optimistically add to state
                const newCard = { id, question, answer };
                const updatedCards = [...appState.cards, newCard];
                // Point to the newly added card
                setState({ cards: updatedCards, currentCardIndex: updatedCards.length - 1 });
                renderCard();
                toast("Card added!");
            } catch (err) {
                toast("Failed to add card.", "error");
                console.error(err);
            } finally {
                document.getElementById("modal-submit").disabled = false;
                hideSpinner();
            }
        },
    });
}

// ── Edit Card ────────────────────────────────────────────────────────────────

function openEditCardModal() {
    const card = appState.cards[appState.currentCardIndex];
    if (!card) return;

    openModal({
        title: "Edit Card",
        fields: [
            { id: "modal-card-question", label: "Question", type: "textarea", placeholder: "Front of the card", value: card.question },
            { id: "modal-card-answer",   label: "Answer",   type: "textarea", placeholder: "Back of the card",  value: card.answer },
        ],
        submitLabel: "Save Changes",
        onSubmit: async ({ "modal-card-question": question, "modal-card-answer": answer }) => {
            if (!question || !answer) return;
            document.getElementById("modal-submit").disabled = true;
            showSpinner();
            try {
                const { currentUser, currentDeck } = appState;
                await updateCard(currentUser.uid, currentDeck.id, card.id, { question, answer });
                closeModal();

                // Optimistically update in state
                const updatedCards = appState.cards.map(c =>
                    c.id === card.id ? { ...c, question, answer } : c
                );
                setState({ cards: updatedCards });
                renderCard();
                toast("Card updated!");
            } catch (err) {
                toast("Failed to update card.", "error");
                console.error(err);
            } finally {
                document.getElementById("modal-submit").disabled = false;
                hideSpinner();
            }
        },
    });
}

// ── Delete Card ──────────────────────────────────────────────────────────────

function deleteCurrentCard() {
    const card = appState.cards[appState.currentCardIndex];
    if (!card) return;
    if (!confirm("Delete this card? This cannot be undone.")) return;

    showSpinner();
    const { currentUser, currentDeck } = appState;
    deleteCard(currentUser.uid, currentDeck.id, card.id)
        .then(() => {
            const updatedCards = appState.cards.filter(c => c.id !== card.id);
            // Adjust index so it doesn't go out of bounds
            let newIndex = appState.currentCardIndex;
            if (newIndex >= updatedCards.length) {
                newIndex = Math.max(0, updatedCards.length - 1);
            }
            setState({ cards: updatedCards, currentCardIndex: newIndex });
            renderCard();
            toast("Card deleted.");
        })
        .catch(err => {
            toast("Failed to delete card.", "error");
            console.error(err);
        })
        .finally(hideSpinner);
}

// ── Back to Decks ────────────────────────────────────────────────────────────

function backToDecks() {
    showView("view-decks");
    // Reload decks to reflect updated card counts
    import("./deck.js").then(({ loadDecks }) => loadDecks());
}

// ── Event Listeners ──────────────────────────────────────────────────────────

flashcard.addEventListener("click", flipCard);
document.getElementById("btn-prev").addEventListener("click", prevCard);
document.getElementById("btn-next").addEventListener("click", nextCard);
document.getElementById("btn-add-card").addEventListener("click", openAddCardModal);
document.getElementById("btn-edit-card").addEventListener("click", openEditCardModal);
document.getElementById("btn-delete-card").addEventListener("click", deleteCurrentCard);
document.getElementById("btn-back-to-decks").addEventListener("click", backToDecks);
