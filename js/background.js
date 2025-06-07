let timer = null;
let remaining = 0;
let isRunning = false;


//alert
function showAlert(){
    chrome.notifications.create({
        type:"basic",
        iconUrl : "../images/icon.png",
        title : "Pomodoro&TodoList",
        message  :"timer is END",
        requireInteraction: false
    });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
            const audio = new Audio(chrome.runtime.getURL("../sound/alert.mp3"));
            //sound file 6 second;
            audio.play().catch( () => console.error("mp3file error",err));
        },
        });
    });
}

//formatTime
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
//timer start
function startTimer() {
    clearInterval(timer);
    isRunning = true;

    timer = setInterval(() => {
        remaining--;

        //const min = Math.ceil(remaining / 60).toString();
        chrome.action.setBadgeText({text:formatTime(remaining) });
        chrome.action.setBadgeBackgroundColor({color:remaining <= 5 * 60 ? '#FF0000' : '#FF6457'});

        chrome.storage.local.set({remaining, isRunning});

        if(remaining <= 0){
            clearInterval(timer);
            isRunning = false;
            chrome.storage.local.set({remaining:0, isRunning:false});
            chrome.action.setBadgeText({text:''});
            showAlert();
        }
    }, 1000);
}
//opp
//message
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch(msg.action) {
        case 'start':
            if(remaining <= 0){
                remaining = msg.minutes * 60;
            }

            startTimer();

            chrome.storage.local.set({remaining, isRunning:true});
            break;
        case 'pause':
            clearInterval(timer);
            isRunning = false;
            chrome.storage.local.set({remaining, isRunning:false});
            chrome.action.setBadgeText({text:'REST'});
            chrome.action.setBadgeBackgroundColor({color:'#25b3fa'});
            break;
        case 'reset':
            clearInterval(timer);
            remaining = 0;
            isRunning = false;

            chrome.storage.local.set({remaining:0, isRunning:false});
            chrome.action.setBadgeText({text:''});
            break;
        case 'getTime':
            sendResponse({remaining, running:isRunning});
            break;
    }
});

//browser restart
function restoreTimer(){
    chrome.storage.local.get(['remaining','isRunning'], (res) => {
        if(res.isRunning && res.remaining > 0){
            remaining = res.remaining;
            isRunning = true;
            startTimer();
        }else if(!res.isRunning && res.remaining > 0){
            remaining = res.remaining;
            chrome.action.setBadgeText({text : 'REST'});
            chrome.action.setBadgeBackgroundColor({color:'#25b3fa'});
        }
    });
}

chrome.runtime.onStartup.addListener(restoreTimer);
chrome.runtime.onInstalled.addListener(restoreTimer);
