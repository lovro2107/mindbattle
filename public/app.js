let questions=[]
let current=0
let correctAnswers=0
let totalAnswers=0
let responseTimes=[]
let questionStartTime=0
let questionTimer=null
let timeLimit=10

let gameMode=window.gameMode||"practice"
let matchId=null
let playerNumber=null
let currentPlayerName=""
let eloGained=0

const qElem=document.getElementById("question")
const optionsElem=document.getElementById("options")
const feedbackElem=document.getElementById("feedback")
const nextBtn=document.getElementById("nextBtn")
const categoryElem=document.getElementById("category")
const difficultyElem=document.getElementById("difficulty")
const startBtn=document.getElementById("startBtn")
const gameDiv=document.getElementById("game")
const setupDiv=document.getElementById("setup")
const statusElem=document.getElementById("status")
const chatBox=document.getElementById("chatBox")
const chatInput=document.getElementById("chatInput")
const sendBtn=document.getElementById("sendBtn")

const retryBtn=document.getElementById("retryBtn")
const dashboardBtn=document.getElementById("dashboardBtn")
const endButtons=document.getElementById("endButtons")


import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js"

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

onAuthStateChanged(auth,u=>{
  if(u) currentPlayerName=u.displayName||"Player"
})

async function loadQuestions(cat,diff){
  let url=`https://opentdb.com/api.php?amount=10&type=multiple`
  if(cat) url+=`&category=${cat}`
  if(diff) url+=`&difficulty=${diff}`

  const res=await fetch(url)
  const data=await res.json()

  questions=data.results.map(q=>{
    const opts=[...q.incorrect_answers]
    const idx=Math.floor(Math.random()*(opts.length+1))
    opts.splice(idx,0,q.correct_answer)
    return { q:q.question, options:opts, answer:idx }
  })

  current=0
  correctAnswers=0
  totalAnswers=0
  responseTimes=[]

  setupDiv.style.display="none"
  gameDiv.style.display="block"

  if(gameMode==="1v1"){
    await setDoc(doc(db,"matches",matchId),{
      nextQuestionTriggered:false,
      "player1.answered":false,
      "player2.answered":false,
      "player1.correctCount":0,
      "player2.correctCount":0,
      eloDone:false
    },{merge:true})
    listenMatch()
  }

  loadQuestion()
}

function loadQuestion(){
  clearTimeout(questionTimer)
  feedbackElem.textContent=""
  questionStartTime=Date.now()


  const q=questions[current]
  qElem.innerHTML=q.q
  optionsElem.innerHTML=""

  q.options.forEach((o,i)=>{
    const b=document.createElement("button")
    b.innerHTML=o
    b.onclick=()=>submitAnswer(i)
    optionsElem.appendChild(b)
  })

  if(gameMode==="1v1") startTimer()
}

function startTimer(){
  questionTimer=setTimeout(async()=>{
    const ref=doc(db,"matches",matchId)
    const snap=await getDoc(ref)
    const d=snap.data()
    if(!d[`player${playerNumber}`]?.answered){
      submitAnswer(-1)
    }
  },timeLimit*1000)
}

async function submitAnswer(sel) {
  clearTimeout(questionTimer)
  const correct = questions[current].answer
  const time = (Date.now() - questionStartTime) / 1000
  totalAnswers++
  responseTimes.push(time)

  if(gameMode === "streak" || gameMode === "1v1") {
    if(typeof streak === "undefined") streak = 0
    if(sel === correct) {
      correctAnswers++
      streak++
    } else {
      streak = 0
    }
  } else {
    if(sel === correct) correctAnswers++
  }

  feedbackElem.textContent = sel === correct 
    ? "✅ Correct" 
    : `❌ Correct: ${questions[current].options[correct]}`

  if(gameMode !== "1v1") {
    nextBtn.onclick = () => next()
    return
  }

  const ref = doc(db,"matches",matchId)
  const snap = await getDoc(ref)
  const d = snap.data()
  if(d[`player${playerNumber}`]?.answered) return

  await updateDoc(ref,{
    [`player${playerNumber}.answered`]: true,
    [`player${playerNumber}.correctCount`]: 
      (d[`player${playerNumber}`].correctCount || 0) + (sel === correct ? 1 : 0)
  })
}


function listenMatch(){
  const ref=doc(db,"matches",matchId)
  onSnapshot(ref,snap=>{
    const d=snap.data()
    if(!d) return

    if(d.player1?.answered && d.player2?.answered && !d.nextQuestionTriggered){
      clearTimeout(questionTimer)
      if(playerNumber===1){
        updateDoc(ref,{nextQuestionTriggered:true})
        setTimeout(async()=>{
          current++
          if(current<questions.length){
            await updateDoc(ref,{
              nextQuestionTriggered:false,
              "player1.answered":false,
              "player2.answered":false
            })
            loadQuestion()
          }else endGame()
        },700)
      }
    }
  })
}

function next(){
  feedbackElem.textContent=""
  current++
  if(current<questions.length) loadQuestion()
  else endGame()
}


async function endGame(){
  qElem.textContent="Game Over"
  optionsElem.innerHTML=""
  feedbackElem.textContent=""
  nextBtn.style.display="none"

  if(gameMode==="practice"){
    endButtons.style.display="block"
    return
  }


  if(gameMode!=="1v1") return

  const ref=doc(db,"matches",matchId)
  const snap=await getDoc(ref)
  const d=snap.data()
  if(d.eloDone) return

  const p1=d.player1.correctCount||0
  const p2=d.player2.correctCount||0

  let res=0
  if(p1>p2) res=playerNumber===1?1:-1
  if(p2>p1) res=playerNumber===2?1:-1
  eloGained=res*25

  await updateDoc(ref,{
    eloDone:true,
    winner:res===1?playerNumber:0
  })

  const playerRef = doc(db,"players",auth.currentUser.uid)
  const playerSnap = await getDoc(playerRef)
  const playerData = playerSnap.exists()?playerSnap.data():{}

  await updateDoc(playerRef,{
    elo:(playerData.elo||0)+eloGained,
    totalCorrect:(playerData.totalCorrect||0)+correctAnswers,
    totalAnswered:(playerData.totalAnswered||0)+totalAnswers,
    avgResponseTime:responseTimes.reduce((a,b)=>a+b,0)/responseTimes.length
  })

  await addDoc(collection(db,"matchesHistory"),{
    matchId,
    player:currentPlayerName,
    correct:correctAnswers,
    total:totalAnswers,
    avgTime:responseTimes.reduce((a,b)=>a+b,0)/responseTimes.length,
    elo:eloGained,
    time:Date.now()
  })
}

async function startMatch(id,num){
  matchId=id
  playerNumber=num
  loadQuestions(categoryElem.value,difficultyElem.value)
}

if(sendBtn){
  sendBtn.onclick=async()=>{
    if(!chatInput.value) return
    await addDoc(collection(db,`matches/${matchId}/chat`),{
      player:currentPlayerName,
      text:chatInput.value,
      timestamp:Date.now()
    })
    chatInput.value=""
  }
}

async function loadCategories() {
  const res = await fetch("https://opentdb.com/api_category.php");
  const data = await res.json();
  data.trivia_categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    categoryElem.appendChild(option);
  });
}

loadCategories();

if(startBtn){
  startBtn.onclick=()=>loadQuestions(categoryElem.value,difficultyElem.value)
}
