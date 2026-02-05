import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD8-6fIW9F7vw7NO5p9_hCitfqesLU5f0g",
  authDomain: "mind-battle-32801.firebaseapp.com",
  projectId: "mind-battle-32801",
  storageBucket: "mind-battle-32801.firebasestorage.app",
  messagingSenderId: "134995556582",
  appId: "1:134995556582:web:1ed2267687a197f1b0e327"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const historyList = document.getElementById("history-list");

async function loadHistory(uid) {
  historyList.innerHTML = "<p>Loading game history...</p>";

  const q = query(
    collection(db, "matches"),
    where("uid", "==", uid),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    historyList.innerHTML = "<p>No game history found.</p>";
    return;
  }

  historyList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <p><b>Mode:</b> ${data.mode}</p>
      ${data.mode === "practice" ? `<p><b>Score:</b> ${data.score} / ${data.total}</p>` : `<p><b>Streak:</b> ${data.streak}</p>`}
      <p><b>Category:</b> ${data.category}</p>
      <p><b>Difficulty:</b> ${data.difficulty}</p>
      <p><b>Date:</b> ${data.date}</p>
    `;
    historyList.appendChild(item);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadHistory(user.uid);
    } else {
      historyList.innerHTML = "<p>Please log in to see your game history.</p>";
    }
  });
});
