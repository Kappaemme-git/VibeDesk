// --- COSTANTI E STATO ---
const DEFAULT_TIME_SECONDS = 25 * 60;

let timeRemaining = DEFAULT_TIME_SECONDS;
let isRunning = false;
let timerInterval = null;
let concentrationTimer = null;

// Riferimenti UI (verranno popolati al caricamento)
let audioMenuToggle = null;
let miniPlayerPlayBtn = null;
let miniPlayerDetails = null;

// --- DATI MENU ---
let currentAudioIndex = 0;
const audioLibrary = [
    { name: '🔴 Lofi Radio ', type: 'radio', url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
    { name: '🌧️ Rain', type: 'ambient', url: 'suoni/rain.mp3' },
    { name: '🌲 Warm Nature', type: 'ambient', url: 'suoni/HotNature.mp3' },
    { name: '🔥 Fire', type: 'ambient', url: 'suoni/fire.mp3' },
    { name: '🌊 Ocean', type: 'ambient', url: 'suoni/ocean.mp3' }
];

let currentThemeIndex = 0;
const themeLibrary = [
    { name: 'Girl Studying', type: 'video', url: 'Video/GirlStudyingLofi.mp4' },
    { name: 'Lofi Cat', type: 'video', url: 'Video/lofiCat.mp4' },
    { name: 'Girl on Train', type: 'video', url: 'Video/TrainGirl.mp4' },
    { name: 'Static Scene', type: 'image', url: 'Video/girl.jpg' }
];

let currentConcIndex = 2;
const concentrationOptions = [
    { name: 'Disabled', value: 0 },
    { name: '30 sec', value: 0.5 },
    { name: '5 min', value: 5 },
    { name: '10 min', value: 10 },
    { name: '15 min', value: 15 }
];

function showModal(message) {
    const overlay = document.getElementById('custom-modal-overlay');
    const msgElement = document.getElementById('modal-message');
    
    if (overlay && msgElement) {
        msgElement.textContent = message;
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
    
    if (!concentrationOptions[currentConcIndex]) currentConcIndex = 0;

    const option = concentrationOptions[currentConcIndex];
    const minutes = option.value;

    if (minutes > 0) {
        const intervalMs = minutes * 60 * 1000;
        
        const messages = [
            "Stay focused! 🔥", 
            "You're doing great! 🚀", 
            "Don't give up now! 💪", 
            "Focus on your goal! 🎯",
            "Drink some water 💧"
        ];
        
        console.log(`Timer concentrazione avviato: ogni ${minutes} minuti`); 
        
        concentrationTimer = setInterval(() => {
            const message = messages[Math.floor(Math.random() * messages.length)];
            showModal(message);
        }, intervalMs);
    }
}

function closeModal() {
    const overlay = document.getElementById('custom-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function saveState() {
    const lofiPlayer = document.getElementById('lofi-player');
    if (!lofiPlayer) return;

    const state = {
        time: timeRemaining,
        running: isRunning,
        audioIndex: currentAudioIndex,
        themeIndex: currentThemeIndex,
        concIndex: currentConcIndex,
        volume: document.getElementById('volume-slider') ? document.getElementById('volume-slider').value : 50,
        minutesInput: document.getElementById('minutes-input') ? document.getElementById('minutes-input').value : 25,
        isPlaying: !lofiPlayer.paused,
        miniPlayerVisible: miniPlayerDetails ? !miniPlayerDetails.classList.contains('hidden') : false
    };
    localStorage.setItem('vibeDeskState', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('vibeDeskState');
    
    if (!savedState) {
        const input = document.getElementById('minutes-input');
        if(input) input.value = 25;
        changeTheme(0, false);
        updateDropdownUI('audio-custom-select', 0, audioLibrary);
        updateDropdownUI('theme-custom-select', 0, themeLibrary);
        updateDropdownUI('concentration-custom-select', 3, concentrationOptions);
        return;
    }

    const state = JSON.parse(savedState);
    const lofiPlayer = document.getElementById('lofi-player');
    const minInput = document.getElementById('minutes-input');
    const volSlider = document.getElementById('volume-slider');

    if (minInput) minInput.value = state.minutesInput || 25;
    if (volSlider) volSlider.value = state.volume || 50;

    currentAudioIndex = state.audioIndex || 0;
    currentThemeIndex = state.themeIndex || 0;
    currentConcIndex = (state.concIndex !== undefined) ? state.concIndex : 3;

    updateDropdownUI('audio-custom-select', currentAudioIndex, audioLibrary);
    updateDropdownUI('theme-custom-select', currentThemeIndex, themeLibrary);
    updateDropdownUI('concentration-custom-select', currentConcIndex, concentrationOptions);

    if (miniPlayerDetails) {
        if (state.miniPlayerVisible) miniPlayerDetails.classList.remove('hidden');
        else miniPlayerDetails.classList.add('hidden');
    }

    timeRemaining = state.time;
    isRunning = state.running;
    updateDisplay();

    if (lofiPlayer) {
        lofiPlayer.volume = (state.volume || 50) / 100;
        changeTrack(currentAudioIndex, false);
        
        if (state.isPlaying) {
            setTimeout(() => toggleAudio(true), 100);
        } else {
            updatePlayIcon(false);
        }
    }
    
    changeTheme(currentThemeIndex, false);

    if (isRunning) {
        const startBtn = document.getElementById('start-btn');
        if(startBtn) startBtn.textContent = 'Pause';
        startTimerLoop();
        startConcentrationTimer();
    }
}

// --- ENGINE TIMER ---
function startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(timerTick, 1000);
}

function timerTick() {
    timeRemaining--;
    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        stopConcentrationTimer();
        isRunning = false;
        
        const startBtn = document.getElementById('start-btn');
        if(startBtn) startBtn.textContent = 'Start';
        
        const minInput = document.getElementById('minutes-input');
        timeRemaining = minInput ? parseInt(minInput.value) * 60 : DEFAULT_TIME_SECONDS;
        
        updateDisplay();
        saveState();
        showModal("Time's up! Take a break.");
        return;
    }
    updateDisplay();
}

function toggleTimer(isLoad = false) {
    const startBtn = document.getElementById('start-btn');
    
    if (isRunning) {
        clearInterval(timerInterval);
        stopConcentrationTimer();
        if(startBtn) startBtn.textContent = 'Resume';
        isRunning = false;
        saveState();
    } else {
        // Avvia
        if (timeRemaining <= 0) setTime();
        isRunning = true;
        if(startBtn) startBtn.textContent = 'Pause';
        startTimerLoop();
        startConcentrationTimer();
        saveState();
    }
}

function updateDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const displayElement = document.getElementById('timer-display');
    if (!displayElement) return;

    let timeString;
    if (hours > 0) {
        timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        displayElement.classList.add('long-text');
    } else {
        timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        displayElement.classList.remove('long-text');
    }

    displayElement.textContent = timeString;
    document.title = `${timeString} | VibeDesk`;
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

function resetTimer() {
    clearInterval(timerInterval);
    stopConcentrationTimer();
    isRunning = false;
    
    const input = document.getElementById('minutes-input');
    timeRemaining = input ? parseInt(input.value) * 60 : DEFAULT_TIME_SECONDS;
    
    const startBtn = document.getElementById('start-btn');
    if(startBtn) startBtn.textContent = 'Start';
    
    updateDisplay();
    saveState();
}

// --- DROPDOWN & UI ---
function setupCustomDropdown(wrapperId, dataList, onChangeCallback) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    
    const optionsContainer = wrapper.querySelector('.custom-options');
    const triggerDiv = wrapper.querySelector('.custom-select__trigger');

    if (!optionsContainer || !triggerDiv) return;

    optionsContainer.innerHTML = '';
    dataList.forEach((item, index) => {
        const option = document.createElement('div');
        option.className = 'custom-option';
        option.textContent = item.name;
        option.dataset.value = index;
        option.addEventListener('click', () => {
            updateDropdownUI(wrapperId, index, dataList);
            onChangeCallback(index);
            wrapper.classList.remove('open');
        });
        optionsContainer.appendChild(option);
    });

    triggerDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-wrapper').forEach(el => {
            if (el !== wrapper) el.classList.remove('open');
        });
        wrapper.classList.toggle('open');
    });
}

function updateDropdownUI(wrapperId, index, dataList) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    
    const triggerSpan = wrapper.querySelector('.custom-select__trigger span');
    const options = wrapper.querySelectorAll('.custom-option');
    
    if (dataList[index] && triggerSpan) {
        triggerSpan.textContent = dataList[index].name;
    }
    
    options.forEach(opt => {
        if (parseInt(opt.dataset.value) === index) opt.classList.add('selected');
        else opt.classList.remove('selected');
    });
}

function onAudioChange(index) { 
    currentAudioIndex = index; 
    changeTrack(index); 
}
function onThemeChange(index) { 
    currentThemeIndex = index; 
    changeTheme(index); 
}
function onConcChange(index) { 
    currentConcIndex = index; 
    if (isRunning) startConcentrationTimer(); 
    saveState(); 
}

function changeTrack(index, doSave = true) {
    const player = document.getElementById('lofi-player');
    if (!player) return;

    if (!audioLibrary[index]) index = 0;
    const selectedTrack = audioLibrary[index];
    
    const wasPlaying = !player.paused;
    player.src = selectedTrack.url;
    
    if (wasPlaying) {
        player.play().catch(e => console.error("Errore riproduzione:", e));
    }
    
    if (doSave) saveState();
}

function updatePlayIcon(isPlaying) {
    if (!miniPlayerPlayBtn) return;
    const icon = miniPlayerPlayBtn.querySelector('i');
    if (!icon) return;

    if (isPlaying) icon.className = 'fas fa-pause';
    else icon.className = 'fas fa-play';
}

function toggleAudio(isLoad = false) {
    const player = document.getElementById('lofi-player');
    if (!player) return;

    if (player.paused) {
        if (!player.src || player.src === "") changeTrack(currentAudioIndex, false);
        player.play().then(() => updatePlayIcon(true)).catch(e => console.error(e));
    } else {
        player.pause();
        updatePlayIcon(false);
    }
    
    if (!isLoad) saveState();
}

function toggleMiniPlayerPanel() {
    if (!miniPlayerDetails) return;
    miniPlayerDetails.classList.toggle('hidden');
    saveState();
}

function toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    if (panel) panel.classList.toggle('visible');
}

function changeTheme(index, doSave = true) {
    if (!themeLibrary[index]) index = 0;
    const selectedTheme = themeLibrary[index];
    
    const bg = document.getElementById('background-media');
    if (!bg) return;

    bg.innerHTML = ''; 
    bg.style.backgroundColor = '';
    
    if (selectedTheme.type === 'image') {
        const img = document.createElement('img'); 
        img.src = selectedTheme.url; 
        bg.appendChild(img);
    } else if (selectedTheme.type === 'video') {
        const video = document.createElement('video'); 
        video.src = selectedTheme.url; 
        video.autoplay = true; 
        video.loop = true; 
        video.muted = true; 
        video.playsInline = true;
        bg.appendChild(video);
    }
    
    if (doSave) saveState();
}

function startConcentrationTimer() {
    stopConcentrationTimer(); 
    
    const option = concentrationOptions[currentConcIndex];
    if (!option) return;
    
    const minutes = option.value;

    if (minutes > 0) {
        const intervalMs = minutes * 60 * 1000;
        
        const messages = [
            "Stay focused! 🔥", 
            "You're doing great! 🚀", 
            "Don't give up now! 💪", 
            "Focus on your goal! 🎯"
        ];
        
        concentrationTimer = setInterval(() => {
            const message = messages[Math.floor(Math.random() * messages.length)];
            showModal(message);
        }, intervalMs);
    }
}

function stopConcentrationTimer() {
    if (concentrationTimer) { 
        clearInterval(concentrationTimer); 
        concentrationTimer = null; 
    }
}

function toggleFullScreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
    } else {
        if (el.requestFullscreen) el.requestFullscreen();
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper')) {
        document.querySelectorAll('.custom-select-wrapper').forEach(el => el.classList.remove('open'));
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const lofiPlayer = document.getElementById('lofi-player');
    const volumeSlider = document.getElementById('volume-slider');
    
    audioMenuToggle = document.getElementById('audio-menu-toggle');      
    miniPlayerPlayBtn = document.getElementById('mini-player-play-btn'); 
    miniPlayerDetails = document.getElementById('mini-player-details');  
    
    // Setup UI
    setupCustomDropdown('audio-custom-select', audioLibrary, onAudioChange);
    setupCustomDropdown('theme-custom-select', themeLibrary, onThemeChange);
    setupCustomDropdown('concentration-custom-select', concentrationOptions, onConcChange);

    loadState(); 

    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', () => toggleTimer(false)); // FIX IMPORTANTE: Passa false o vuoto, non l'evento

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);

    const setTimeBtn = document.getElementById('set-time-btn');
    if (setTimeBtn) setTimeBtn.addEventListener('click', setTime);

    const fullScreenBtn = document.getElementById('fullscreen-button');
    if (fullScreenBtn) fullScreenBtn.addEventListener('click', toggleFullScreen);

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', toggleSettingsPanel);

    const closeSettingsBtn = document.getElementById('close-settings-btn');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', toggleSettingsPanel);

    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    if (audioMenuToggle) audioMenuToggle.addEventListener('click', toggleMiniPlayerPanel);
    if (miniPlayerPlayBtn) miniPlayerPlayBtn.addEventListener('click', () => toggleAudio(false));

    if (volumeSlider && lofiPlayer) {
        volumeSlider.addEventListener('input', () => {
            lofiPlayer.volume = volumeSlider.value / 100;
            saveState();
        });
    }

    window.addEventListener('beforeunload', saveState);
});