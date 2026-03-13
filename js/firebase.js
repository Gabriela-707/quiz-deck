// firebase.js
// Initializes Firebase and exports the auth and db instances.
// All other modules import from here — never from each other — to avoid circular dependencies.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyAXzIxJZ8iUtfYJIV55O8HgX2Aon_TxSqQ",
    authDomain:        "quizdeck-c591c.firebaseapp.com",
    projectId:         "quizdeck-c591c",
    storageBucket:     "quizdeck-c591c.firebasestorage.app",
    messagingSenderId: "214015735277",
    appId:             "1:214015735277:web:f3294095304f8d2e32e3e4",
    measurementId:     "G-XYSC6S5DZC"
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db   = getFirestore(firebaseApp);
