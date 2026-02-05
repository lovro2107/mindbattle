import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js"

const app=initializeApp({
  apiKey:"AIzaSyD8-6fIW9F7vw7NO5p9_hCitfqesLU5f0g",
  authDomain:"mind-battle-32801.firebaseapp.com",
  projectId:"mind-battle-32801",
  storageBucket:"mind-battle-32801.firebasestorage.app",
  messagingSenderId:"134995556582",
  appId:"1:134995556582:web:1ed2267687a197f1b0e327"
})

const db=getFirestore(app)
const auth=getAuth(app)

let questions=[]
let current=0
let score=0

const startBtn=document.getElementById("startDailyBtn")
const qElem=document.getElementById("dailyQuestion")
const optionsElem=document.getElementById("dailyOptions")
const feedbackElem=document.getElementById("dailyFeedback")
const nextBtn=document.getElementById("dailyNextBtn")
const gameDiv=document.getElementById("dailyGame")
const xpDisplay=document.getElementById("xpDisplay")

function today(){
  const d=new Date()
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
}

async function loadQuestions(){
  const res=await fetch("https://opentdb.com/api.php?amount=10&type=multiple")
  const data=await res.json()
  questions=data.results.map(q=>{
    const opts=[...q.incorrect_answers]
    const i=Math.floor(Math.random()*(opts.length+1))
    opts.splice(i,0,q.correct_answer)
    return {q:q.question,opts,ans:i}
  })
  current=0
  score=0
  gameDiv.style.display="block"
  loadQuestion()
}

function loadQuestion(){
  const q=questions[current]
  qElem.innerHTML=q.q
  optionsElem.innerHTML=""
  feedbackElem.textContent=""
  nextBtn.style.display="none"
  q.opts.forEach((o,i)=>{
    const b=document.createElement("button")
    b.innerHTML=o
    b.onclick=()=>answer(i)
    optionsElem.appendChild(b)
  })
}

function answer(i){
  if(i===questions[current].ans) score++
  feedbackElem.textContent=i===questions[current].ans?"✅ Correct":"❌ Wrong"
  nextBtn.style.display="block"
}

nextBtn.onclick=async()=>{
  current++
  if(current<questions.length){
    loadQuestion()
  }else{
    const u=auth.currentUser
    if(!u) return

    const playedRef=doc(db,"dailyPlayed",`${u.uid}_${today()}`)
    if((await getDoc(playedRef)).exists()) return
    await setDoc(playedRef,{played:true})

    const xpRef=doc(db,"xp",u.uid)
    const xpSnap=await getDoc(xpRef)
    const xp=(xpSnap.exists()?xpSnap.data().xp:0)+(score*20)
    await setDoc(xpRef,{xp})
    xpDisplay.textContent=`XP: ${xp}`

    const pRef=doc(db,"players",u.uid)
    const pSnap=await getDoc(pRef)
    const d=pSnap.exists()?pSnap.data():{}

    const totalAnswered=(d.totalAnswered||0)+questions.length
    const totalCorrect=(d.totalCorrect||0)+score

    await setDoc(pRef,{
      username:u.displayName||u.email.split("@")[0],
      totalGames:(d.totalGames||0)+1,
      totalAnswered,
      totalCorrect,
      accuracy:Math.round((totalCorrect/totalAnswered)*100)
    },{merge:true})

    qElem.textContent=`Daily complete! +${score*20} XP`
    optionsElem.innerHTML=""
    feedbackElem.textContent=""
    nextBtn.style.display="none"
  }
}

startBtn.onclick=()=>loadQuestions()
