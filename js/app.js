// app.js
// Entry point. Sets up auth-state-based routing.

// Apply saved theme immediately to prevent flash of light mode
if (localStorage.getItem("theme") === "dark") {
    document.body.dataset.theme = "dark";
}

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { auth }       from "./firebase.js";
import { setState }   from "./state.js";
import { showView }   from "./ui.js";
import "./auth.js";                          // registers all auth button listeners
import { loadDecks }    from "./deck.js";    // registers deck button listeners
import { loadProfile, updateHeaderAvatar, loadAvatarFromFirestore } from "./profile.js"; // registers profile button listeners
import "./quiz.js";                          // registers quiz button listeners

// ─────────────────────────────────────────────────────────────────────────────
// Auth state listener — the core router
// Fires automatically on page load and whenever the user logs in or out.
// ─────────────────────────────────────────────────────────────────────────────

onAuthStateChanged(auth, (user) => {
    setState({ currentUser: user });

    if (user) {
        const nameEl = document.getElementById("user-display-name");
        if (nameEl) nameEl.textContent = user.displayName || user.email;

        // Load avatar from Firestore and show in header
        loadAvatarFromFirestore(user.uid).then(avatar => updateHeaderAvatar(avatar));
        showView("view-decks");
        loadDecks();
    } else {
        showView("view-auth");
    }
});

// Profile — click avatar to open profile view
document.getElementById("header-avatar").addEventListener("click", () => {
    showView("view-profile");
    loadProfile();
});
