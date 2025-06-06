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
        startStopBtn.textContent = isRunning ? '중지' : '시작';
        }
    });

    //timer UI setting...
    //1second after, get left time from background.js
    setInterval(() => {
        chrome.runtime.sendMessage({ action: 'getTime' }, (res) => {
        if (res && typeof res.remaining === 'number') {
            timerDisplay.textContent = formatTime(res.remaining);
            isRunning = res.running;
            startStopBtn.textContent = isRunning ? '중지' : '시작';
        }
        });
    }, 1000);
    
    //startStopBtn
    startStopBtn.addEventListener('click', () => {
        const minutes = parseInt(timeInput.value);
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

    //onmessage
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if(msg.action === 'playSound'){
            playSound();
        }
    });
});

//sound
function playSound() {
    const audio = new Audio(chrome.runtime.getURL("sound/alert.mp3"));
    audio.play().catch((err) => {
        console.error("Sound play failed:", err);
    });
}
