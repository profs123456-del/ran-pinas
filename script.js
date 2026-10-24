  /* ✅ YOUR FIREBASE CONFIG (keep yours) */
const firebaseConfig = {
  apiKey: "AIzaSyB1KVldN8j5zZtl3RT6QKve5kXL0kN2OgM",
  authDomain: "ran-pinas.firebaseapp.com",
  databaseURL: "https://ran-pinas-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ran-pinas",
  storageBucket: "ran-pinas.firebasestorage.app",
  messagingSenderId: "973643160856",
  appId: "1:973643160856:web:0974713412731eceeb926d"
};
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  /* ✅ SERVER TIME SYNC (fix +12 sec issues) */
  let serverOffset = 0;
  let serverReady = false;

  db.ref(".info/serverTimeOffset").on("value", snap => {
    serverOffset = snap.val() || 0;
    serverReady = true;
  });
/* =========================
   ✅ SETTINGS
   ========================= */
const HISTORY_LIMIT = 200;     // show last 200 logs
const ADMIN_PIN = "1234";      // change this

let inputLock=false;
document.addEventListener("focusin",e=>{if(e.target.type==="datetime-local") inputLock=true;});
document.addEventListener("focusout",e=>{if(e.target.type==="datetime-local") inputLock=false;});

const bosses=[
 {id:"1",name:"CH-0 DARK ART MASTER",respawn:1},
 {id:"2",name:"CH-1 DARK ART MASTER",respawn:1},
 {id:"3",name:"CH-2 DARK ART MASTER",respawn:1},
 {id:"4",name:"CH-0 CRUEL JUPITER",respawn:8},
 {id:"5",name:"CH-1 CRUEL JUPITER",respawn:8},
 {id:"6",name:"CH-2 CRUEL JUPITER",respawn:8},
];

const container=document.getElementById("bossContainer");
const sound=document.getElementById("sound");
const sortBtn=document.getElementById("sortBtn");
const soundBtn=document.getElementById("soundBtn");
const nextBossTimer=document.getElementById("nextBossTimer");

let autoSort=true;
let alarmOn=true;
let alerted={};
let warnedTenMin={};
let lastBeepSecond=null;

function speak(text){
 try{
   window.speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(text);
   u.rate = 1;
   u.pitch = 1;
   u.volume = 1;
   speechSynthesis.speak(u);
 }catch(e){}
}

/* =========================
   ✅ BUILD CARDS
   ========================= */
bosses.forEach(b=>{
 const card=document.createElement("div");
 card.className="card";
 card.id=b.id+"-card";

if(b.name.includes("EF")){
   card.style.backgroundImage = "url('ef-ai.png')";
 }
 if(b.name.includes("CAMPUS")){
   card.style.backgroundImage = "url('ds-ai.png')";
 }
if(b.name.includes("CH-0 MP HOLE")){
   card.style.backgroundImage = "url('ds-ai.png')";
 }
if(b.name.includes("CH-0 PH HOLE")){
   card.style.backgroundImage = "url('ds-ai.png')";
 }
if(b.name.includes("CH-1 PH HOLE")){
   card.style.backgroundImage = "url('ds-ai.png')";
 }
if(b.name.includes("CH-1 MP HOLE")){
   card.style.backgroundImage = "url('ds-ai.png')";
 }
if(b.name.includes("CH-1 DARK SWORDSMAN")){
   card.style.backgroundImage = "url('dark-swordsman ai.png')";
 }
if(b.name.includes("CH-0 DARK SWORDSMAN")){
   card.style.backgroundImage = "url('dark-swordsman ai.png')";
 }
if(b.name.includes("CH-0 NINJA KNIFE")){
   card.style.backgroundImage = "url('ninja knife-ai.png')";
 }
 if(b.name.includes("CH-1 NINJA KNIFE")){
   card.style.backgroundImage = "url('ninja knife-ai.png')";
 }
 if(b.name.includes("CH-1 CRUEL JUPITER")){
   card.style.backgroundImage = "url('cruel jupiter-ai.png')";
 }
 if(b.name.includes("CH-0 CRUEL JUPITER")){
   card.style.backgroundImage = "url('cruel jupiter-ai.png')";
 }
  if(b.name.includes("CH-2 CRUEL JUPITER")){
   card.style.backgroundImage = "url('cruel jupiter-ai.png')";
 }
 if(b.name.includes("CH-0 DARK ART MASTER")){
   card.style.backgroundImage = "url('dam.png')";
 }
if(b.name.includes("CH-1 DARK ART MASTER")){
   card.style.backgroundImage = "url('dam.png')";
 }
 if(b.name.includes("CH-2 DARK ART MASTER")){
   card.style.backgroundImage = "url('dam.png')";
 }
 card.innerHTML=`
  <h2>${b.name}</h2>
  <div class="timer" id="${b.id}-timer">--:--:--</div>
  <div id="${b.id}-next">Next Spawn: --</div>

  <div class="calendar-panel">
    <div class="calendar-display">Select Date & Time</div>
    <input
    type="datetime-local"
    class="datetime-input"
    id="${b.id}-input"
    step="1">
</div>

  <button class="set-manual" onclick="manual('${b.id}',${b.respawn})">Set Manual</button>
  <button class="killed-now" onclick="now('${b.id}',${b.respawn})">Killed Now</button>
 `;
 container.appendChild(card);
});
/* =========================
   ✅ TOP BUTTONS
   ========================= */
sortBtn.onclick=()=>{
 autoSort=!autoSort;
 sortBtn.textContent="AUTO SORT: "+(autoSort?"ON":"OFF");
 sortBtn.classList.toggle("off",!autoSort);
};

soundBtn.onclick=()=>{
 alarmOn=!alarmOn;
 soundBtn.textContent="ALARM: "+(alarmOn?"ON":"SILENT");
 soundBtn.classList.toggle("off",!alarmOn);
};

/* =========================
   ✅ HISTORY
   ========================= */
function renderHistory(items){
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";

  if(!items || items.length === 0){
    const empty = document.createElement("div");
    empty.className = "history-item";
    empty.textContent = "No logs yet. Click Killed Now.";
    historyList.appendChild(empty);
    return;
  }

  items.forEach(item=>{
    const div=document.createElement("div");
    div.className="history-item";
    div.textContent = `${item.name} killed - ${new Date(item.killedAt).toLocaleString()}`;
    historyList.appendChild(div);
  });
}

function refreshHistory(){
  db.ref("history").limitToLast(HISTORY_LIMIT).once("value").then(snapshot=>{
    const data = snapshot.val();
    if(!data) return renderHistory([]);
    const items = Object.values(data).sort((a,b)=>b.killedAt-a.killedAt);
    renderHistory(items);
  });
}

function clearHistory(){
  const pinInput = document.getElementById("pinInput");
  const pinError = document.getElementById("pinError");
  const pin = (pinInput.value || "").trim();

  if(pin !== ADMIN_PIN){
    pinError.style.color = "#ff3b3b";
    pinError.textContent = "❌ Wrong PIN";
    return;
  }

  if(!confirm("Clear ALL kill history?")) return;

  db.ref("history").remove().then(()=>{
    pinError.style.color = "#00ff9c";
    pinError.textContent = "✅ History Cleared!";
    pinInput.value = "";
  }).catch(()=>{
    pinError.style.color = "#ff3b3b";
    pinError.textContent = "❌ Error clearing history";
  });
}

db.ref("history").limitToLast(HISTORY_LIMIT).on("value", snapshot=>{
  const data = snapshot.val();
  if(!data) return renderHistory([]);
  const items = Object.values(data).sort((a,b)=>b.killedAt-a.killedAt);
  renderHistory(items);
});

/* =========================
   ✅ TIMER STORAGE (FIREBASE)
   ========================= */
let firebaseBosses = {};

db.ref("bosses").on("value", snapshot => {
  firebaseBosses = snapshot.val() || {};
});

/* =========================
   ✅ SET NEXT (MANUAL)
   ========================= */
function setNext(id,h,k){
  const nextTime = k.getTime() + h * 3600000;
  db.ref("bosses/" + id).set(nextTime);
  alerted[id] = false;
  warnedTenMin[id] = false;
  warnedTenMin[id] = false;
}

/* =========================
   ✅ BUTTON ACTIONS
   ========================= */
function now(id,h){
  // prevent clicking before server time is ready
  if(!serverReady){
    // small message only (no breaking)
    const pinError = document.getElementById("pinError");
    if(pinError){
      pinError.style.color = "#ffd700";
      pinError.textContent = "⏳ Wait 1 second (syncing server time)...";
      setTimeout(()=>{ pinError.textContent=""; }, 1500);
    }
    return;
  }

  const serverNow = Date.now() + serverOffset;
  const nextTime = serverNow + h * 3600000;

  db.ref("bosses/" + id).set(nextTime);
  alerted[id] = false;
  warnedTenMin[id] = false;

  const boss = bosses.find(b => b.id === id);
  db.ref("history").push({
    bossId: id,
    name: boss ? boss.name : ("BOSS " + id),
    killedAt: serverNow
  });
}

function manual(id,h){
  const v=document.getElementById(id+"-input").value;
  if(!v) return alert("Enter time");
  setNext(id,h,new Date(v));
}

function resetAll(){
  if(!confirm("Reset ALL timers?")) return;
  alerted = {};
  warnedTenMin = {};
  lastBeepSecond = null;
  db.ref("bosses").remove();
}

/* =========================
   ✅ MAIN UPDATE LOOP
   ========================= */
function update(){
 if(inputLock) return;
 let soonest=null,soonId=null,sortData=[];

 bosses.forEach(b=>{
  const t = firebaseBosses[b.id];
  const timer=document.getElementById(b.id+"-timer");
  const next=document.getElementById(b.id+"-next");
  const card=document.getElementById(b.id+"-card");
  card.classList.remove("next");

  if (Object.keys(firebaseBosses).length === 0) {
    document.getElementById("nextBossName").textContent = "---";
    document.getElementById("nextBossTimer").textContent = "--:--:--";
    document.getElementById("nextBossTime").textContent = "---";
    document.getElementById("nextBossTimer").classList.remove("danger");
  }

  if (!t) {
    timer.textContent = "--:--:--";
    next.textContent = "Next Spawn: --";
    sortData.push({ id: b.id, time: Infinity });
    return;
  }

  // ✅ server-time countdown
  const nowServer = Date.now() + serverOffset;
  const d = t - nowServer;

  if(d<=0){
   timer.textContent="SPAWNED!";
   next.textContent="NOW";
   warnedTenMin[b.id] = false;
   if(!alerted[b.id]){
     if(alarmOn){
       sound.currentTime=0;
       sound.play().catch(()=>{});
       speak(b.name+" has spawned");
     }
     alerted[b.id]=true;
   }
   sortData.push({id:b.id,time:0});
   return;
  }

  if(d<=10*60*1000 && d>9*60*1000 && !warnedTenMin[b.id]){
    if(alarmOn){
      sound.currentTime=0;
      sound.play().catch(()=>{});
      setTimeout(()=>{
        speak(b.name + " will spawn in 10 minutes");
      }, 250);
    }
    warnedTenMin[b.id] = true;
  }

  if(d>10*60*1000){
    warnedTenMin[b.id] = false;
  }

  sortData.push({id:b.id,time:d});
  if(soonest===null||d<soonest){soonest=d;soonId=b.id;}

  const hh=String(Math.floor(d/3600000)).padStart(2,"0");
  const mm=String(Math.floor(d%3600000/60000)).padStart(2,"0");
  const ss=String(Math.floor(d%60000/1000)).padStart(2,"0");
  timer.textContent=`${hh}:${mm}:${ss}`;
  next.textContent="Next: "+new Date(t).toLocaleString();
 });

 if(autoSort){
  sortData.sort((a,b)=>a.time-b.time);

  // Only touch the DOM if the order actually changed. Re-inserting every
  // card on every 1-second tick — even when nothing moved — can shift a
  // card out from under the cursor mid-click (since DOM order = screen
  // position in this flex layout), which is why "Killed Now" sometimes
  // needed a second click to register.
  const currentOrder = Array.from(container.children).map(el => el.id);
  const desiredOrder = sortData.map(o => o.id + "-card");
  const orderChanged = currentOrder.length !== desiredOrder.length ||
    currentOrder.some((id, i) => id !== desiredOrder[i]);

  if(orderChanged){
    sortData.forEach(o=>container.appendChild(document.getElementById(o.id+"-card")));
  }
 }

 if(soonId){
  document.getElementById(soonId+"-card").classList.add("next");
  const b=bosses.find(x=>x.id===soonId);
  document.getElementById("nextBossName").textContent=b.name;
  document.getElementById("nextBossTimer").textContent=document.getElementById(soonId+"-timer").textContent;

  const soonTs = firebaseBosses[soonId];
  document.getElementById("nextBossTime").textContent = soonTs
    ? ("Spawns at: " + new Date(soonTs).toLocaleString())
    : "---";

  if(soonest<=10000&&soonest>0){
    const sec=Math.ceil(soonest/1000);
    if(lastBeepSecond!==sec){
      if(alarmOn){
        sound.currentTime=0;
        sound.play().catch(()=>{});
      }
      lastBeepSecond=sec;
    }
  }else{ lastBeepSecond=null; }

  if(soonest<=5*60*1000){
    nextBossTimer.classList.add("danger");
  }else{
    nextBossTimer.classList.remove("danger");
  }
 }
}

setInterval(update,1000);
