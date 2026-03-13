// deck.js
// Handles the deck list view: loading, rendering, creating, editing, and deleting decks.

import { appState, setState } from "./state.js";
import { openModal, closeModal, showSpinner, hideSpinner, toast } from "./ui.js";
import { getDecks, createDeck, updateDeck, deleteDeck } from "./firestore.js";

const deckList   = document.getElementById("deck-list");
const deckEmpty  = document.getElementById("deck-empty");
const deckSearch = document.getElementById("deck-search");

// ── Load & Render ─────────────────────────────────────────────────────────────

/**
 * Fetch all decks from Firestore and render them.
 * Called by app.js after login and after any deck mutation.
 */
export async function loadDecks() {
    const userId = appState.currentUser.uid;
    deckSearch.value = "";
    showSpinner();
    try {
        const decks = await getDecks(userId);
        setState({ decks });
        renderDecks(decks);
    } catch (err) {
        toast("Failed to load decks.", "error");
        console.error(err);
    } finally {
        hideSpinner();
    }
}

// ── Search / Filter ───────────────────────────────────────────────────────────

deckSearch.addEventListener("input", () => {
    const term = deckSearch.value.toLowerCase();
    if (!term) {
        renderDecks(appState.decks);
        return;
    }
    const filtered = appState.decks.filter(d =>
        d.title.toLowerCase().includes(term) ||
        (d.description || "").toLowerCase().includes(term)
    );
    renderDecks(filtered);
});

function renderDecks(decks) {
    deckList.innerHTML = "";

    if (decks.length === 0) {
        deckEmpty.classList.remove("hidden");
        return;
    }
    deckEmpty.classList.add("hidden");

    decks.forEach(deck => {
        const card = document.createElement("div");
        card.className = "deck-card";
        card.innerHTML = `
            <h3>${escapeHtml(deck.title)}</h3>
            <p>${escapeHtml(deck.description || "")}</p>
            <span class="deck-card-meta">${deck.cardCount || 0} card${deck.cardCount === 1 ? "" : "s"}</span>
            <div class="deck-card-actions">
                <button class="btn btn-primary btn-open">Open</button>
                <button class="btn btn-secondary btn-edit">Edit</button>
                <button class="btn btn-danger btn-delete">Delete</button>
            </div>
        `;

        card.querySelector(".btn-open").addEventListener("click",   () => openDeck(deck));
        card.querySelector(".btn-edit").addEventListener("click",   () => editDeck(deck));
        card.querySelector(".btn-delete").addEventListener("click", () => confirmDeleteDeck(deck));

        deckList.appendChild(card);
    });
}

// Prevent XSS when rendering user-supplied text into innerHTML
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ── Open deck ─────────────────────────────────────────────────────────────────

function openDeck(deck) {
    setState({ currentDeck: deck, cards: [], currentCardIndex: 0 });
    // cards.js will handle loading cards; import it lazily to avoid circular deps
    import("./cards.js").then(({ loadCards }) => loadCards());
}

// ── Create deck ───────────────────────────────────────────────────────────────

document.getElementById("btn-new-deck").addEventListener("click", () => {
    openModal({
        title: "New Deck",
        fields: [
            { id: "deck-title",       label: "Title",       type: "text",     placeholder: "e.g. Biology Chapter 3" },
            { id: "deck-description", label: "Description", type: "textarea", placeholder: "What is this deck about?", required: false },
        ],
        submitLabel: "Create Deck",
        onSubmit: async ({ "deck-title": title, "deck-description": description }) => {
            if (!title) return;
            document.getElementById("modal-submit").disabled = true;
            showSpinner();
            try {
                const userId = appState.currentUser.uid;
                const id = await createDeck(userId, { title, description });
                closeModal();
                // Optimistically add to state and re-render
                const newDeck = { id, title, description, cardCount: 0 };
                setState({ decks: [newDeck, ...appState.decks] });
                renderDecks(appState.decks);
                toast("Deck created!");
            } catch (err) {
                toast("Failed to create deck.", "error");
                console.error(err);
            } finally {
                document.getElementById("modal-submit").disabled = false;
                hideSpinner();
            }
        },
    });
});

// ── Edit deck ─────────────────────────────────────────────────────────────────

function editDeck(deck) {
    openModal({
        title: "Edit Deck",
        fields: [
            { id: "deck-title",       label: "Title",       type: "text",     placeholder: "Deck title", value: deck.title },
            { id: "deck-description", label: "Description", type: "textarea", placeholder: "Description", value: deck.description || "", required: false },
        ],
        submitLabel: "Save Changes",
        onSubmit: async ({ "deck-title": title, "deck-description": description }) => {
            if (!title) return;
            document.getElementById("modal-submit").disabled = true;
            showSpinner();
            try {
                const userId = appState.currentUser.uid;
                await updateDeck(userId, deck.id, { title, description });
                closeModal();
                // Update in state and re-render
                const updated = appState.decks.map(d =>
                    d.id === deck.id ? { ...d, title, description } : d
                );
                setState({ decks: updated });
                renderDecks(appState.decks);
                toast("Deck updated!");
            } catch (err) {
                toast("Failed to update deck.", "error");
                console.error(err);
            } finally {
                document.getElementById("modal-submit").disabled = false;
                hideSpinner();
            }
        },
    });
}

// ── Delete deck ───────────────────────────────────────────────────────────────

function confirmDeleteDeck(deck) {
    if (!confirm(`Delete "${deck.title}"? This will also delete all its cards and cannot be undone.`)) return;

    showSpinner();
    deleteDeck(appState.currentUser.uid, deck.id)
        .then(() => {
            const updated = appState.decks.filter(d => d.id !== deck.id);
            setState({ decks: updated });
            renderDecks(appState.decks);
            toast("Deck deleted.");
        })
        .catch(err => {
            toast("Failed to delete deck.", "error");
            console.error(err);
        })
        .finally(hideSpinner);
}
