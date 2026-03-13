// state.js
// Single source of truth for the entire app.
// All modules import appState and call setState() to update it.

export const appState = {
    // Auth
    currentUser: null,          // Firebase User object, or null if logged out

    // Decks
    decks: [],                  // array of { id, title, description, cardCount }
    currentDeck: null,          // the deck currently open in card viewer

    // Cards
    cards: [],                  // array of { id, question, answer, order } for currentDeck
    currentCardIndex: 0,        // index into cards[] being displayed

    // Quiz
    quizState: {
        queue: [],              // shuffled copy of cards — never mutate cards[]
        currentIndex: 0,
        correct: 0,
        incorrect: 0,
        missedCards: [],        // cards the user got wrong, for retry
    },
};

/**
 * Merge a partial update into appState.
 * For nested objects (like quizState), pass the full updated object.
 *
 * @param {Partial<typeof appState>} partial
 */
export function setState(partial) {
    Object.assign(appState, partial);
}
