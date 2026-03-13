// ui.js
// Shared UI helpers used across the entire app.

// ── View switching ────────────────────────────────────────────────────────────

const views  = document.querySelectorAll(".view");
const header = document.getElementById("app-header");

export function showView(viewId) {
    views.forEach(v => v.classList.remove("active-view"));
    document.getElementById(viewId).classList.add("active-view");

    if (viewId === "view-auth") {
        header.classList.add("hidden");
    } else {
        header.classList.remove("hidden");
    }
}

// ── Spinner ───────────────────────────────────────────────────────────────────

const spinnerOverlay = document.getElementById("spinner-overlay");

export function showSpinner() {
    spinnerOverlay.classList.remove("hidden");
}

export function hideSpinner() {
    spinnerOverlay.classList.add("hidden");
}

// ── Toast notifications ───────────────────────────────────────────────────────

const toastContainer = document.getElementById("toast-container");

/**
 * Show a temporary notification.
 * @param {string} message
 * @param {'success'|'error'} type
 */
export function toast(message, type = "success") {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const modalOverlay = document.getElementById("modal-overlay");
const modalTitle   = document.getElementById("modal-title");
const modalForm    = document.getElementById("modal-form");
const modalSubmit  = document.getElementById("modal-submit");

/**
 * Open the shared modal with a dynamic form.
 *
 * @param {Object} config
 * @param {string}   config.title        - Modal heading
 * @param {Array}    config.fields        - Array of field descriptors:
 *                                          { id, label, type, placeholder, value, required }
 *                                          type can be 'text' | 'textarea'
 * @param {string}   config.submitLabel  - Text for the submit button (default: 'Save')
 * @param {Function} config.onSubmit     - Called with a { fieldId: value } object on submit
 */
export function openModal({ title, fields, submitLabel = "Save", onSubmit }) {
    // Set title and submit label
    modalTitle.textContent  = title;
    modalSubmit.textContent = submitLabel;

    // Build form fields
    modalForm.innerHTML = "";
    fields.forEach(({ id, label, type = "text", placeholder = "", value = "", required = true }) => {
        const wrapper = document.createElement("div");

        const lbl = document.createElement("label");
        lbl.htmlFor     = id;
        lbl.textContent = label;
        lbl.style.cssText = "display:block; font-size:0.9rem; margin-bottom:0.3rem; text-align:left;";

        let input;
        if (type === "textarea") {
            input = document.createElement("textarea");
        } else {
            input = document.createElement("input");
            input.type = type;
        }
        input.id          = id;
        input.name        = id;
        input.className   = "input";
        input.placeholder = placeholder;
        input.value       = value;
        input.required    = required;

        wrapper.appendChild(lbl);
        wrapper.appendChild(input);
        modalForm.appendChild(wrapper);
    });

    // Attach submit handler (replace any previous one)
    modalForm.onsubmit = (e) => {
        e.preventDefault();
        const data = {};
        fields.forEach(({ id }) => {
            data[id] = document.getElementById(id).value.trim();
        });
        onSubmit(data);
    };

    modalOverlay.classList.remove("hidden");

    // Focus the first input
    const first = modalForm.querySelector("input, textarea");
    if (first) first.focus();
}

export function closeModal() {
    modalOverlay.classList.add("hidden");
    modalForm.innerHTML  = "";
    modalForm.onsubmit   = null;
}

// Wire up close buttons once
document.getElementById("modal-close").addEventListener("click",  closeModal);
document.getElementById("modal-cancel").addEventListener("click", closeModal);

// Close when clicking the backdrop
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
});
