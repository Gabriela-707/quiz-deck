// profile.js
// User profile view — edit display name and upload avatar image.
// Avatar is resized to 128×128 via canvas, converted to base64, and stored in Firestore.

import { updateProfile } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { showView, showSpinner, hideSpinner, toast } from "./ui.js";
import { logout }        from "./auth.js";

// ── DOM refs ─────────────────────────────────────────────────────────────────

const avatarPreview   = () => document.getElementById("profile-avatar-preview");
const nameInput       = () => document.getElementById("profile-display-name");
const avatarFileInput = () => document.getElementById("profile-avatar-file");

// ── Helpers ──────────────────────────────────────────────────────────────────

let pendingFile = null;

const AVATAR_SIZE = 128;

const defaultProfileSVG = `<div class="profile-avatar-initials"><svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
</svg></div>`;

/**
 * Resize an image file to AVATAR_SIZE×AVATAR_SIZE and return a base64 data URL.
 */
function resizeToBase64(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = AVATAR_SIZE;
            canvas.height = AVATAR_SIZE;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
            resolve(canvas.toDataURL("image/png"));
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => reject(new Error("Could not read image file"));
        img.src = URL.createObjectURL(file);
    });
}

function renderAvatarPreview(url) {
    const container = avatarPreview();
    if (!container) return;
    container.innerHTML = "";

    if (url) {
        const img = document.createElement("img");
        img.className = "profile-avatar";
        img.alt = "Avatar";
        img.src = url;
        img.onerror = () => { container.innerHTML = defaultProfileSVG; };
        container.appendChild(img);
    } else {
        container.innerHTML = defaultProfileSVG;
    }
}

// ── Header avatar ────────────────────────────────────────────────────────────

const defaultAvatarSVG = `<svg class="header-avatar-default" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
</svg>`;

export function updateHeaderAvatar(photoURL) {
    const el = document.getElementById("header-avatar");
    if (!el) return;

    if (photoURL) {
        const img = document.createElement("img");
        img.src = photoURL;
        img.alt = "Profile";
        img.onerror = () => { el.innerHTML = defaultAvatarSVG; };
        el.innerHTML = "";
        el.appendChild(img);
    } else {
        el.innerHTML = defaultAvatarSVG;
    }
}

// ── Firestore avatar helpers ────────────────────────────────────────────────

function avatarDocRef(uid) {
    return doc(db, "users", uid);
}

/**
 * Load avatar base64 from Firestore and render it in both the header and profile preview.
 * Called from app.js on auth state change and when opening the profile view.
 */
export async function loadAvatarFromFirestore(uid) {
    try {
        const snap = await getDoc(avatarDocRef(uid));
        const avatarBase64 = snap.exists() ? snap.data().avatar || null : null;
        return avatarBase64;
    } catch {
        return null;
    }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function loadProfile() {
    const user = auth.currentUser;
    if (!user) return;

    nameInput().value = user.displayName || "";
    pendingFile = null;

    // Load avatar from Firestore
    const avatarBase64 = await loadAvatarFromFirestore(user.uid);
    renderAvatarPreview(avatarBase64);

    // Sync dark-mode toggle with current theme
    const toggle = document.getElementById("toggle-dark-mode");
    if (toggle) toggle.checked = localStorage.getItem("theme") === "dark";
}

// ── Event listeners ──────────────────────────────────────────────────────────

// Dark-mode toggle
document.getElementById("toggle-dark-mode").addEventListener("change", (e) => {
    if (e.target.checked) {
        document.body.dataset.theme = "dark";
        localStorage.setItem("theme", "dark");
    } else {
        delete document.body.dataset.theme;
        localStorage.removeItem("theme");
    }
});

// Upload button triggers hidden file input
document.getElementById("btn-upload-avatar").addEventListener("click", () => {
    avatarFileInput().click();
});

// Show local preview immediately when a file is selected
document.getElementById("profile-avatar-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    pendingFile = file;
    renderAvatarPreview(URL.createObjectURL(file));
});

// Save profile
document.getElementById("btn-save-profile").addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;

    const displayName = nameInput().value.trim();

    showSpinner();
    try {
        // Resize and convert to base64 if a new file was selected
        if (pendingFile) {
            const avatarBase64 = await resizeToBase64(pendingFile);
            pendingFile = null;

            // Save avatar base64 to Firestore
            await setDoc(avatarDocRef(user.uid), { avatar: avatarBase64 }, { merge: true });
            updateHeaderAvatar(avatarBase64);
        }

        await updateProfile(user, { displayName });

        // Update header display name
        const headerName = document.getElementById("user-display-name");
        if (headerName) headerName.textContent = displayName || user.email;

        toast("Profile updated!");
        showView("view-decks");
    } catch (err) {
        toast("Failed to update profile: " + err.message, "error");
    } finally {
        hideSpinner();
    }
});

// Back button
document.getElementById("btn-back-from-profile").addEventListener("click", () => {
    showView("view-decks");
});

// Logout button
document.getElementById("btn-logout").addEventListener("click", logout);
