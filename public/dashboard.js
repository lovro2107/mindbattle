import { getFirestore, doc, getDoc } 
  from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
import { getAuth, onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js"
import { initializeApp } 
  from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"

const firebaseConfig = {
  apiKey: "AIzaSyD8-6fIW9F7vw7NO5p9_hCitfqesLU5f0g",
  authDomain: "mind-battle-32801.firebaseapp.com",
  projectId: "mind-battle-32801",
  storageBucket: "mind-battle-32801.firebasestorage.app",
  messagingSenderId: "134995556582",
  appId: "1:134995556582:web:1ed2267687a197f1b0e327",
  measurementId: "G-RWWLR1E277"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const loginBtn = document.getElementById("login-btn")
const signupBtn = document.getElementById("signup-btn")
const userNameSpan = document.getElementById("user-name")
const logoutBtn = document.getElementById("logout-btn")

const statsIds = {
  elo: document.getElementById("elo"),
  rank: document.getElementById("rank"),
  winRate: document.getElementById("winRate"),
  totalGames: document.getElementById("totalGames"),
  level: document.getElementById("level"),
  xpFill: document.getElementById("xpFill"),
  xpText: document.getElementById("xpText"),
  winStreak: document.getElementById("winStreak"),
  accuracy: document.getElementById("accuracy"),
  achievements: document.getElementById("achievements"),
  username: document.getElementById("username"),
  bestStreak: document.getElementById("bestStreak")
}

const playerAvatar = document.getElementById("playerAvatar")

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

function calculateXPProgress(xp) {
  const level = calculateLevel(xp)
  const prev = Math.pow(level - 1, 2) * 100
  const next = Math.pow(level, 2) * 100
  return {
    level,
    progress: ((xp - prev) / (next - prev)) * 100,
    currentXP: xp - prev,
    nextXP: next - prev
  }
}

function getRankFromElo(elo) {
  if (elo < 900) return "Bronze III"
  if (elo < 1000) return "Bronze II"
  if (elo < 1100) return "Bronze I"
  if (elo < 1200) return "Silver III"
  if (elo < 1300) return "Silver II"
  if (elo < 1400) return "Silver I"
  if (elo < 1500) return "Gold III"
  if (elo < 1600) return "Gold II"
  if (elo < 1700) return "Gold I"
  if (elo < 1800) return "Platinum III"
  if (elo < 1900) return "Platinum II"
  if (elo < 2000) return "Platinum I"
  if (elo < 2200) return "Diamond III"
  if (elo < 2400) return "Diamond II"
  return "Diamond I"
}


onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace("signin.html")
    return
  }

  const name = user.displayName || user.email.split("@")[0]

  loginBtn.style.display = "none"
  signupBtn.style.display = "none"
  logoutBtn.style.display = "inline-block"
  userNameSpan.style.display = "inline-block"
  userNameSpan.textContent = name

  statsIds.username.textContent = `Welcome back, ${name}!`

  if (user.photoURL) {
    playerAvatar.src = user.photoURL
  }

  const docSnap = await getDoc(doc(db, "players", user.uid))
  if (!docSnap.exists()) return

  const data = docSnap.data()

  statsIds.elo.textContent = data.elo || 1000
  const elo = data.elo || 1000
  statsIds.elo.textContent = elo
  statsIds.rank.textContent = getRankFromElo(elo)

  statsIds.winRate.textContent = data.winRate !== undefined ? `${data.winRate}%` : "0%"
  statsIds.totalGames.textContent = data.totalGames || 0
  statsIds.winStreak.textContent = data.winStreak || 0

  const totalAnswered = data.totalAnswered || 0
  const totalCorrect = data.totalCorrect || 0
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
  statsIds.accuracy.textContent = `${accuracy}%`

  statsIds.achievements.textContent = data.achievements ? data.achievements.length : 0
  statsIds.bestStreak.textContent = data.bestStreak || 0

  const xp = calculateXPProgress(data.xp || 0)
  statsIds.level.textContent = `Level ${xp.level}`
  statsIds.xpFill.style.width = `${xp.progress}%`
  statsIds.xpText.textContent = `${xp.currentXP} / ${xp.nextXP} XP`
})

logoutBtn.onclick = async () => {
  await signOut(auth)
  window.location.replace("signin.html")
}
