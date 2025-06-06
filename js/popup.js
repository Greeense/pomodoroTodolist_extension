let isRunning = false;

document.addEventListener("DOMContentLoaded", () => {
    const timeInput = document.getElementById("timeInput");
    const timerDisplay = document.getElementById("timerDisplay");
    const startStopBtn = document.getElementById("startStopBtn");
    const resetBtn = document.getElementById("resetBtn");

    //timer format
    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
   
    chrome.runtime.sendMessage({ action: 'getTime' }, (res) => {
        if (res && typeof res.remaining === 'number') {
        timerDisplay.textContent = formatTime(res.remaining);
        isRunning = res.running;
        startStopBtn.textContent = isRunning ? 'STOP' : 'START';
        }
    });

    //timer UI setting...
    //1second after, get left time from background.js
    setInterval(() => {
        chrome.runtime.sendMessage({ action: 'getTime' }, (res) => {
        if (res && typeof res.remaining === 'number') {
            timerDisplay.textContent = formatTime(res.remaining);
            isRunning = res.running;
            startStopBtn.textContent = isRunning ? 'STOP' : 'START';
        }
        });
    }, 1000);
    
    //startStopBtn
    startStopBtn.addEventListener('click', () => {
        const minutes = parseInt(timeInput.value);

         //check Input value
        if (isNaN(minutes) || minutes < 1 || minutes > 60) {
            showCustomAlert("[Message] You can input a value between 1 and 60.");
            timeInput.value = 30; 
            return;
        }
        if (!isRunning) {
        chrome.runtime.sendMessage({ action: 'start', minutes, break: false });
        } else {
        chrome.runtime.sendMessage({ action: 'pause' });
        }
    });

    //resetBtn
    resetBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({action:'reset'});
    });

    chrome.storage.local.get(['remaining', 'isRunning'], (res) => {
        console.log("현재 상태:", res.remaining, "초 남음 / 실행중?", res.isRunning);
    });

});
//onmessage
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if(msg.action === 'playSound'){
        playSound();
    }
});
//sound
function playSound() {
    const audio = new Audio(chrome.runtime.getURL("sound/alert.mp3"));
    audio.play().catch((err) => {
        console.error("Sound play failed:", err);
    });
}
//goal manager
const goalInput = document.getElementById("goalInput");
const addGoalBtn = document.getElementById("addGoalBtn");
const goalList = document.getElementById("goalList");

function renderGoalList(goals){
    goalList.innerHTML = "";
    goals.forEach((goal, index) => {
        const div = document.createElement("div");
        div.className = "goal-item" + (goal.completed ? " completed" : "");

        const span = document.createElement("span");
        span.textContent = goal.text;

        //create complete btn
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "✔";
        completeBtn.onclick = () => {
            goals[index].completed = !goals[index].completed;
            saveGoals(goals);
            completeBtn.classList.toggle("completed");
        };

        if (goal.completed) {
            completeBtn.classList.add("completed");            
        }
        //create delete btn
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✖";
        deleteBtn.onclick = () => {
            goals.splice(index, 1);
            saveGoals(goals);
        };

        const btnGroup = document.createElement("div");
        btnGroup.className = "goal-buttons";
        btnGroup.appendChild(completeBtn);
        btnGroup.appendChild(deleteBtn);

        div.appendChild(completeBtn);
        div.appendChild(span);
        div.appendChild(deleteBtn);
        
        goalList.appendChild(div);

    });
}
function saveGoals(goals) {
    chrome.storage.local.set({goals}, () => renderGoalList(goals));
}

function loadGoals() {
    chrome.storage.local.get("goals", (data) => {
        const goals = data.goals || [];
        renderGoalList(goals);
    });
}

addGoalBtn.addEventListener("click", () => {
    const text = goalInput.value.trim();
    if (text === ""){
        showCustomAlert("[Message] Please input Todo.");
        return;
    };
    chrome.storage.local.get("goals", (data) => {
        const goals = data.goals || [];
        if (goals.length >= 3){
            showCustomAlert("[Message] You can only add up to 3 tasks.");
            return;
        }
        goals.push({text, completed : false});
        goalInput.value = "";
        saveGoals(goals);
    });
});

//custom alert
function showCustomAlert(message) {
  const alertBox = document.getElementById("customAlert");
  alertBox.textContent = message;
  alertBox.style.display = "block";
  alertBox.style.background = "#dc3545";
  alertBox.style.color = "white";
  alertBox.style.padding = "5px";
  alertBox.style.borderRadius = "6px";
  alertBox.style.margin = "3px 0";
  alertBox.style.textAlign = "center";

  setTimeout(() => {
    alertBox.style.display = "none";
  }, 2500);
}

loadGoals();