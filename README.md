# Quiz Deck

A web-based flashcard application for creating, organizing, and studying custom card decks — with quiz mode, user profiles, and cloud storage.

## Project Description

Quiz Deck lets users build flashcards organized into decks. Each card has a question and an answer that can be revealed with a flip animation. Users can study cards one by one, test themselves in quiz mode (marking cards as correct or missed), and track their score. All data is tied to a user account and stored in the cloud.

## Technologies Used

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, CSS variables, flexbox/grid) |
| Logic | Vanilla JavaScript (ES Modules) |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore (NoSQL) |
| Hosting | GitHub / Vercel |


## Architecture Overview

### Frontend
The app is a single-page application built with plain HTML, CSS, and JavaScript — no frameworks.

The JavaScript is split into these sections:

- `app.js` — entry point, auth-state
- `auth.js` — login and register logic
- `deck.js` — deck list view
- `cards.js` — card viewer with flip animation
- `quiz.js` — quiz mode with scoring
- `profile.js` — display name, avatar upload, dark mode toggle
- `firestore.js` — all database read/write operations
- `firebase.js` — Firebase initialization
- `ui.js` — shared utilities
- `state.js` — global state

### Backend
Firebase handles everything server-side:

- **Firebase Authentication** manages user sessions
- **Cloud Firestore** stores all user data
- **localStorage** ensures consistency with the user's theme preference (light/dark) client-side across sessions


## Database Structure

```
users/
  {userId}/
    avatar        (string, base64-encoded image)

    decks/
      {deckId}/
        title       (string)
        description (string)
        cardCount   (number, atomically incremented/decremented)
        createdAt   (timestamp)

        cards/
          {cardId}/
            question  (string)
            answer    (string)
            createdAt (timestamp)
```


## Setup Instructions

The app is deployed and accessible at: https://quizdeck.netlify.app

### Run Locally

1. **Clone the repo**
   git clone https://github.com/Gabriela-707/quiz-deck.git

2. **Open in a browser**
   Open `index.html` directly in a browser

3. **Firebase**
   The project is connected to a live Firebase project. To use your own Firebase backend, replace the config object with your own project's credentials and update the rules in the Firebase console.

### Deploy to Netlify

1. Push code to GitHub
2. Log in to Netlify
3. Connect your GitHub repo and select the `quiz-deck` repository
5. Click "Deploy"


## Known Bugs / Limitations

- **No offline support** — the app requires an internet connection to read/write Firestore data
- **Avatar storage** — avatars are stored as base64 strings in Firestore rather than Firebase Storage, which is not ideal
- **No password reset** — there is no "Forgot Password" feature
- **Single device quiz state** — quiz progress resets on page refresh
- **No deck sharing** — decks are private to the user. There is no sharing feature


## What I Learned

Looking back after completing this project, Ive learned more about how improtant it is to properly word your prompts to the AI. There were moments where I feel as though I could have been clearer and more precise about what I wanted to be implemented. Another thing was noticing how important it was to check and ensure that the code was bug free and had no issues after each feature implementation.
