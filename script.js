const DEFAULT_TIME_SECONDS = 25 * 60;
const bellSound = new Audio('audio/bell.mp3'); 

let timeRemaining = DEFAULT_TIME_SECONDS;
let isRunning = false;
let timerInterval = null;
let concentrationTimer = null;

let audioMenuToggle = null;
let miniPlayerPlayBtn = null;
let miniPlayerDetails = null;

let currentRadioIndex = 0;
const radioLibrary = [
    { name: '🔴 Lofi Girl Radio', url: 'https://play.streamafrica.net/lofiradio' },
    { name: '☕ Coffee Shop', url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
    { name: '🔇 No Music', url: '' } 
];

let currentAmbientIndex = 0;
const ambientLibrary = [
    { name: '❌ No Noise', url: '' },
    { name: '💨 Phon (White Noise)', url: 'suoni/phon.mp3' },
    { name: '🌧️ Rain', url: 'suoni/rain.mp3' },
    { name: '🔥 Fire', url: 'suoni/fire.mp3' },
    { name: '🌊 Ocean', url: 'suoni/ocean.mp3' },
    { name: '🌲 Forest', url: 'suoni/HotNature.mp3' }
];

let currentThemeIndex = 0;
const themeLibrary = [
    { name: 'Girl Studying', type: 'video', url: 'Video/GirlStudyingLofi.mp4' },
    { name: 'Lofi Cat', type: 'video', url: 'Video/lofiCat.mp4' },
    { name: 'Girl on Train', type: 'video', url: 'Video/TrainGirl.mp4' },
    { name: 'Chill Room', type: 'video', url: 'Video/Room.mp4' },
    { name: 'Girl Studying (Static)', type: 'image', url: 'Video/girl.jpg' },
    { name: 'LandScape (Static)', type: 'image', url: 'Video/landscape.jpg' },
    { name: 'Monte Fuji (Static)', type: 'image', url: 'Video/monte.jpg' },

];

let currentConcIndex = 2;
const concentrationOptions = [
    { name: 'Disabled', value: 0 },
    { name: '30 sec', value: 0.5 },
    { name: '5 min', value: 5 },
    { name: '10 min', value: 10 },
    { name: '15 min', value: 15 }
];


function changeRadioTrack(index) {
    const player = document.getElementById('lofi-player');
    if (!player) return;

    if (!radioLibrary[index]) index = 0;
    const selected = radioLibrary[index];
    
    if (selected.url === '') {
        player.pause();
        player.src = '';
        updatePlayIcon(false);
        return;
    }

    const wasPlaying = !player.paused;
    player.src = selected.url;
    
    if (wasPlaying || document.getElementById('start-btn').textContent === 'Pause') {
        player.play().catch(e => console.error("Radio Error:", e));
        updatePlayIcon(true);
    }
    
    saveState();
}

function changeAmbientTrack(index) {
    const player = document.getElementById('ambient-player');
    if (!player) return;

    if (!ambientLibrary[index]) index = 0;
    const selected = ambientLibrary[index];

    if (selected.url === '') {
        player.pause();
        player.src = '';
    } else {
        player.src = selected.url;
        player.loop = true; 
        player.play().catch(e => console.error("Ambient Error:", e));
    }
    saveState();
}

function toggleRadioPlay() {
    const player = document.getElementById('lofi-player');
    if (!player) return;
    
    if (player.paused && player.src) {
        player.play();
        updatePlayIcon(true);
    } else {
        player.pause();
        updatePlayIcon(false);
    }
    saveState();
}

function updatePlayIcon(isPlaying) {
    if (!miniPlayerPlayBtn) return;
    const icon = miniPlayerPlayBtn.querySelector('i');
    if (icon) icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

function showModal(message) {
    const overlay = document.getElementById('custom-modal-overlay');
    const msg = document.getElementById('modal-message');
    if (overlay && msg) {
        msg.textContent = message;
        overlay.classList.remove('hidden');
        overlay.classList.add('active');
    }
}
function closeModal() {
    const overlay = document.getElementById('custom-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.classList.add('hidden');
    }
}

function startConcentrationTimer() {
    stopConcentrationTimer();
    const option = concentrationOptions[currentConcIndex];
    if (!option || option.value <= 0) return;

    console.log(`Focus Check ogni ${option.value} min`);
    concentrationTimer = setInterval(() => {
        const msgs = ["Stay focused! 🔥", "You're doing great! 🚀", "Drink water 💧"];
        showModal(msgs[Math.floor(Math.random() * msgs.length)]);
    }, option.value * 60 * 1000);
}

function stopConcentrationTimer() {
    if (concentrationTimer) clearInterval(concentrationTimer);
}

function saveState() {
    const radioPlayer = document.getElementById('lofi-player');
    
    const state = {
        time: timeRemaining,
        running: isRunning,
        
        radioIndex: currentRadioIndex,
        ambientIndex: currentAmbientIndex,
        themeIndex: currentThemeIndex,
        concIndex: currentConcIndex,
        
        radioVolume: document.getElementById('volume-slider')?.value || 50,
        ambientVolume: document.getElementById('ambient-volume-slider')?.value || 30,
        
        isPlaying: radioPlayer ? !radioPlayer.paused : false,
        miniPlayerVisible: miniPlayerDetails ? !miniPlayerDetails.classList.contains('hidden') : false
    };
    localStorage.setItem('vibeDeskState_v2', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('vibeDeskState_v2');
    
    updateDropdownUI('audio-custom-select', 0, radioLibrary);
    updateDropdownUI('ambient-custom-select', 0, ambientLibrary);
    updateDropdownUI('theme-custom-select', 0, themeLibrary);
    updateDropdownUI('concentration-custom-select', 3, concentrationOptions);

    if (!savedState) return; 

    const state = JSON.parse(savedState);
    
    currentRadioIndex = state.radioIndex || 0;
    currentAmbientIndex = state.ambientIndex || 0;
    currentThemeIndex = state.themeIndex || 0;
    currentConcIndex = state.concIndex || 3;
    timeRemaining = state.time || DEFAULT_TIME_SECONDS;
    isRunning = state.running;

    updateDropdownUI('audio-custom-select', currentRadioIndex, radioLibrary);
    updateDropdownUI('ambient-custom-select', currentAmbientIndex, ambientLibrary);
    updateDropdownUI('theme-custom-select', currentThemeIndex, themeLibrary);
    updateDropdownUI('concentration-custom-select', currentConcIndex, concentrationOptions);

    const radioPlayer = document.getElementById('lofi-player');
    const ambientPlayer = document.getElementById('ambient-player');
    
    const volSlider = document.getElementById('volume-slider');
    if (volSlider && radioPlayer) {
        volSlider.value = state.radioVolume;
        radioPlayer.volume = state.radioVolume / 100;
    }
    
    const ambSlider = document.getElementById('ambient-volume-slider');
    if (ambSlider && ambientPlayer) {
        ambSlider.value = state.ambientVolume;
        ambientPlayer.volume = state.ambientVolume / 100;
    }

    changeRadioTrack(currentRadioIndex);
    if (!state.isPlaying) {
        radioPlayer.pause();
        updatePlayIcon(false);
    }

    if (currentAmbientIndex > 0) {
        changeAmbientTrack(currentAmbientIndex);
    }

    changeTheme(currentThemeIndex, false);
    updateDisplay();

    if (state.miniPlayerVisible && miniPlayerDetails) {
        miniPlayerDetails.classList.remove('hidden');
    }

    if (isRunning) {
        startTimerLoop();
        startConcentrationTimer();
        document.getElementById('start-btn').textContent = 'Pause';
    }
}

// --- ENGINE TIMER ---
function startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            stopConcentrationTimer();
            isRunning = false;
            bellSound.play().catch(e => console.log(e));
            document.getElementById('start-btn').textContent = 'Start';
            timeRemaining = DEFAULT_TIME_SECONDS;
            updateDisplay();
            saveState();
            showModal("Time's up!");
        } else {
            updateDisplay();
        }
    }, 1000);
}

function updateDisplay() {
    const m = Math.floor(timeRemaining / 60);
    const s = timeRemaining % 60;
    const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const display = document.getElementById('timer-display');
    if(display) display.textContent = timeString;
    document.title = `${timeString} | VibeDesk`;
}

function toggleTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        stopConcentrationTimer();
        isRunning = false;
        document.getElementById('start-btn').textContent = 'Resume';
    } else {
        isRunning = true;
        startTimerLoop();
        startConcentrationTimer();
        document.getElementById('start-btn').textContent = 'Pause';
    }
    saveState();
}

function resetTimer() {
    clearInterval(timerInterval);
    stopConcentrationTimer();
    isRunning = false;
    timeRemaining = DEFAULT_TIME_SECONDS;
    document.getElementById('start-btn').textContent = 'Start';
    updateDisplay();
    saveState();
}

function setTime() {
    const input = document.getElementById('minutes-input');
    const inputMinutes = input ? parseInt(input.value) : 25;
    
    if (isNaN(inputMinutes) || inputMinutes <= 0) return;
    
    clearInterval(timerInterval);
    stopConcentrationTimer();
    isRunning = false;
    timeRemaining = inputMinutes * 60;
    
    const startBtn = document.getElementById('start-btn');
    if(startBtn) startBtn.textContent = 'Start';
    
    updateDisplay();
    saveState();
}

function toggleFullScreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
    } else {
        if (el.requestFullscreen) el.requestFullscreen();
    }
}

function changeTheme(index, doSave = true) {
    const selected = themeLibrary[index] || themeLibrary[0];
    const bg = document.getElementById('background-media');
    bg.innerHTML = '';
    
    if (selected.type === 'video') {
        const v = document.createElement('video');
        v.src = selected.url;
        v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
        bg.appendChild(v);
    } else {
        const img = document.createElement('img');
        img.src = selected.url;
        bg.appendChild(img);
    }
    if(doSave) saveState();
}

function setupCustomDropdown(wrapperId, dataList, callback) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    const list = wrapper.querySelector('.custom-options');
    list.innerHTML = '';
    
    dataList.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'custom-option';
        div.textContent = item.name;
        div.onclick = () => {
            updateDropdownUI(wrapperId, idx, dataList);
            callback(idx);
            wrapper.classList.remove('open');
        };
        list.appendChild(div);
    });

    wrapper.querySelector('.custom-select__trigger').onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-wrapper').forEach(el => {
            if(el !== wrapper) el.classList.remove('open');
        });
        wrapper.classList.toggle('open');
    }
}

function updateDropdownUI(id, idx, list) {
    const w = document.getElementById(id);
    if(!w) return;
    w.querySelector('span').textContent = list[idx] ? list[idx].name : list[0].name;
}

document.addEventListener('DOMContentLoaded', () => {
    miniPlayerDetails = document.getElementById('mini-player-details');
    miniPlayerPlayBtn = document.getElementById('mini-player-play-btn');

    setupCustomDropdown('audio-custom-select', radioLibrary, (idx) => {
        currentRadioIndex = idx;
        changeRadioTrack(idx);
    });

    setupCustomDropdown('ambient-custom-select', ambientLibrary, (idx) => {
        currentAmbientIndex = idx;
        changeAmbientTrack(idx);
    });

    setupCustomDropdown('theme-custom-select', themeLibrary, (idx) => {
        currentThemeIndex = idx;
        changeTheme(idx);
    });

    setupCustomDropdown('concentration-custom-select', concentrationOptions, (idx) => {
        currentConcIndex = idx;
        if(isRunning) startConcentrationTimer();
        saveState();
    });

    if(miniPlayerPlayBtn) miniPlayerPlayBtn.onclick = toggleRadioPlay;

    const radioVol = document.getElementById('volume-slider');
    if(radioVol) radioVol.oninput = () => {
        const player = document.getElementById('lofi-player');
        if(player) player.volume = radioVol.value / 100;
        saveState();
    };

    const ambVol = document.getElementById('ambient-volume-slider');
    if(ambVol) ambVol.oninput = () => {
        const player = document.getElementById('ambient-player');
        if(player) player.volume = ambVol.value / 100;
        saveState();
    };

    document.getElementById('start-btn').onclick = toggleTimer;
    document.getElementById('reset-btn').onclick = resetTimer;
    
    const setTimeBtn = document.getElementById('set-time-btn');
    if(setTimeBtn) setTimeBtn.onclick = setTime;

    const fullScreenBtn = document.getElementById('fullscreen-button');
    if(fullScreenBtn) fullScreenBtn.onclick = toggleFullScreen;

    document.getElementById('audio-menu-toggle').onclick = () => {
        miniPlayerDetails.classList.toggle('hidden');
        saveState();
    };
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('settings-btn').onclick = () => document.getElementById('settings-panel').classList.toggle('visible');
    document.getElementById('close-settings-btn').onclick = () => document.getElementById('settings-panel').classList.remove('visible');
    
    loadState();
});

document.addEventListener('click', e => {
    if(!e.target.closest('.custom-select-wrapper')) {
        document.querySelectorAll('.custom-select-wrapper').forEach(el => el.classList.remove('open'));
    }
});