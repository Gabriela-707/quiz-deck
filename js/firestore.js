// firestore.js
// All Firestore database operations for decks and cards.

import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    increment,
    query,
    orderBy,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
// Note: getDoc removed — cardCount now uses atomic increment() instead of read-then-write

import { db } from "./firebase.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function decksRef(userId) {
    return collection(db, "users", userId, "decks");
}

function deckRef(userId, deckId) {
    return doc(db, "users", userId, "decks", deckId);
}

function cardsRef(userId, deckId) {
    return collection(db, "users", userId, "decks", deckId, "cards");
}

function cardRef(userId, deckId, cardId) {
    return doc(db, "users", userId, "decks", deckId, "cards", cardId);
}

// ── Decks ─────────────────────────────────────────────────────────────────────

/**
 * Create a new deck for the user.
 * @returns {string} The new deck's Firestore ID
 */
export async function createDeck(userId, { title, description }) {
    const ref = await addDoc(decksRef(userId), {
        title,
        description,
        cardCount: 0,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

/**
 * Fetch all decks for the user, ordered by creation date (newest first).
 * @returns {Array} Array of deck objects with their Firestore IDs
 */
export async function getDecks(userId) {
    const q = query(decksRef(userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Update a deck's title and/or description.
 */
export async function updateDeck(userId, deckId, { title, description }) {
    await updateDoc(deckRef(userId, deckId), { title, description });
}

/**
 * Delete a deck and all its cards.
 * Firestore does not cascade-delete subcollections, so we delete cards first.
 */
export async function deleteDeck(userId, deckId) {
    const cardsSnapshot = await getDocs(cardsRef(userId, deckId));

    // Batch-delete all cards then the deck itself
    const batch = writeBatch(db);
    cardsSnapshot.docs.forEach(d => batch.delete(d.ref));
    batch.delete(deckRef(userId, deckId));
    await batch.commit();
}

// ── Cards ─────────────────────────────────────────────────────────────────────

/**
 * Add a new card to a deck and increment the deck's card count.
 * @returns {string} The new card's Firestore ID
 */
export async function createCard(userId, deckId, { question, answer }) {
    const ref = await addDoc(cardsRef(userId, deckId), {
        question,
        answer,
        createdAt: serverTimestamp(),
    });

    // Atomically increment card count — no read needed, safe against concurrent writes
    await updateDoc(deckRef(userId, deckId), { cardCount: increment(1) });

    return ref.id;
}

/**
 * Fetch all cards for a deck, ordered by creation date (oldest first).
 * @returns {Array} Array of card objects with their Firestore IDs
 */
export async function getCards(userId, deckId) {
    const q = query(cardsRef(userId, deckId), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Update a card's question and/or answer.
 */
export async function updateCard(userId, deckId, cardId, { question, answer }) {
    await updateDoc(cardRef(userId, deckId, cardId), { question, answer });
}

/**
 * Delete a card and decrement the deck's card count.
 */
export async function deleteCard(userId, deckId, cardId) {
    await deleteDoc(cardRef(userId, deckId, cardId));

    // Atomically decrement card count — no read needed, safe against concurrent writes
    await updateDoc(deckRef(userId, deckId), { cardCount: increment(-1) });
}
