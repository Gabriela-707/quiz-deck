// auth.js
// All Firebase Authentication logic.

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

import { auth } from "./firebase.js";

// ── Panel toggle ──────────────────────────────────────────────────────────────

const panelLogin    = document.getElementById("panel-login");
const panelRegister = document.getElementById("panel-register");

document.getElementById("link-to-register").addEventListener("click", (e) => {
    e.preventDefault();
    panelLogin.classList.add("hidden");
    panelRegister.classList.remove("hidden");
    clearErrors();
});

document.getElementById("link-to-login").addEventListener("click", (e) => {
    e.preventDefault();
    panelRegister.classList.add("hidden");
    panelLogin.classList.remove("hidden");
    clearErrors();
});

// ── Error helpers ─────────────────────────────────────────────────────────────

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.remove("hidden");
}

function clearErrors() {
    document.getElementById("auth-error").classList.add("hidden");
    document.getElementById("register-error").classList.add("hidden");
}

// Converts Firebase error codes into friendly messages
function friendlyError(code) {
    switch (code) {
        case "auth/invalid-email":          return "Please enter a valid email address.";
        case "auth/user-not-found":         return "No account found with that email.";
        case "auth/wrong-password":         return "Incorrect password. Try again.";
        case "auth/email-already-in-use":   return "An account with this email already exists.";
        case "auth/weak-password":          return "Password must be at least 6 characters.";
        case "auth/popup-closed-by-user":   return "Sign-in popup was closed. Please try again.";
        case "auth/invalid-credential":     return "Invalid email or password.";
        default:                            return "Something went wrong. Please try again.";
    }
}

// ── Email / Password login ────────────────────────────────────────────────────

document.getElementById("btn-login").addEventListener("click", async () => {
    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    clearErrors();

    if (!email || !password) {
        showError("auth-error", "Please enter your email and password.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged in app.js handles routing on success
    } catch (err) {
        showError("auth-error", friendlyError(err.code));
    }
});

// ── Email / Password register ─────────────────────────────────────────────────

document.getElementById("btn-register").addEventListener("click", async () => {
    const email    = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    clearErrors();

    if (!email || !password) {
        showError("register-error", "Please enter an email and password.");
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged in app.js handles routing on success
    } catch (err) {
        showError("register-error", friendlyError(err.code));
    }
});

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout() {
    await signOut(auth);
    // onAuthStateChanged in app.js will fire and route back to view-auth
}

