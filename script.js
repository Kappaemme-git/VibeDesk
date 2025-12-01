// --- COSTANTI E STATO ---
const DEFAULT_TIME_SECONDS = 25 * 60;
const bellSound = new Audio('audio/bell.mp3'); 

let timeRemaining = DEFAULT_TIME_SECONDS;
let isRunning = false;
let timerInterval = null;
let concentrationTimer = null;

// VARIABILE FONDAMENTALE: Tiene traccia della durata sessione scelta (es. 25 o 5)
let currentSessionMinutes = 25; 

let audioMenuToggle = null;
let miniPlayerPlayBtn = null;
let miniPlayerDetails = null;

let currentRadioIndex = 0;

// --- LIBRERIA RADIO BASE ---
const radioLibrary = [
    { name: '🎧 VibeDesk Radio', url: 'https://play.streamafrica.net/lofiradio' },
    { name: '☕ Coffee Shop', url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
    { name: '🔇 No Music', url: '' } 
];

// --- WINTER MODE (ATTIVAZIONE AUTOMATICA) 🎄❄️ ---
const today = new Date();
// Metti ">= 0" se vuoi testarlo oggi (Novembre), poi rimetti "=== 11" per Dicembre
if (today.getMonth() >= 0) { 
    
    // 1. AGGIUNGI RADIO NATALE
    radioLibrary.unshift({ 
        name: '🎄 Christmas Hits', 
        url: 'audio/xmas.mp3' // O usa 'audio/xmas.mp3' se hai il file locale
    });

    // 2. ATTIVA NEVE E TEMA ROSSO
    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('christmas-mode');
        setInterval(createSnow, 300); // Neve leggera
        console.log("Winter Mode Activated: Let it snow! ❄️");
    });
}

// Funzione Neve
function createSnow() {
    const snow = document.createElement('div');
    snow.classList.add('snowflake');
    snow.textContent = '❄'; 
    snow.style.left = Math.random() * 100 + 'vw';
    snow.style.animationDuration = Math.random() * 3 + 5 + 's';
    snow.style.opacity = Math.random();
    snow.style.fontSize = Math.random() * 10 + 10 + 'px';
    
    document.body.appendChild(snow);
    
    setTimeout(() => { snow.remove(); }, 8000);
}
// ----------------------------------------------------

let currentAmbientIndex = 0;
const ambientLibrary = [
    { name: '❌ No Noise', url: '' },
    { name: '💨 White Noise', url: 'suoni/phon.mp3' },
    { name: '🌧️ Rain', url: 'suoni/rain.mp3' },
    { name: '🔥 Fire', url: 'suoni/fire.mp3' },
    { name: '🌊 Ocean', url: 'suoni/ocean.mp3' },
    { name: '🌲 Forest', url: 'suoni/HotNature.mp3' },
    { name: '🌌 Space', url: 'suoni/space.mp3' }
];

let currentThemeIndex = 0;
const themeLibrary = [

    { name: 'Christmas Girl', type: 'video', url: 'Video/Natale.mp4', category: 'Christmas Holiday' },
    { name: 'Cozy Fireplace', type: 'video', url: 'Video/Camino.mp4', category: 'Christmas Holiday' },
    
    { name: 'Girl Studying', type: 'video', url: 'Video/GirlStudyingLofi.mp4', category: 'Lofi Vibes' },
    { name: 'Lofi Cat', type: 'video', url: 'Video/lofiCat.mp4', category: 'Lofi Vibes' },
    { name: 'Girl on Train', type: 'video', url: 'Video/TrainGirl.mp4', category: 'Lofi Vibes' },
    { name: 'Chill Room', type: 'video', url: 'Video/Room.mp4', category: 'Lofi Vibes' },

    
    

    { name: 'Galaxy Loop', type: 'video', url: 'Video/Galaxy.mp4', category: 'Space' },
    { name: 'Deep Space', type: 'image', url: 'Video/space.jpg', category: 'Space' },

    { name: 'Lofi Girl', type: 'image', url: 'Video/girl.jpg', category: 'Static' },
    { name: 'Landscape', type: 'image', url: 'Video/landscape.jpg', category: 'Static' },
    { name: 'Mount Fuji', type: 'image', url: 'Video/monte.jpg', category: 'Static' }
];

let currentConcIndex = 2;
const concentrationOptions = [
    { name: 'Disabled', value: 0 },
    { name: '30 sec', value: 0.5 },
    { name: '5 min', value: 5 },
    { name: '10 min', value: 10 },
    { name: '15 min', value: 15 }
];


// --- FEATURE: DAILY STATS SYSTEM ---
function updateStatsUI() {
    const statEl = document.getElementById('focus-minutes');
    if (statEl) {
        let mins = parseFloat(localStorage.getItem('vibeDailyMinutes') || 0);
        statEl.textContent = Number.isInteger(mins) ? mins : mins.toFixed(1);
    }
}

function checkDailyReset() {
    const today = new Date().toDateString(); 
    const lastDate = localStorage.getItem('vibeLastDate');

    if (lastDate !== today) {
        localStorage.setItem('vibeDailyMinutes', 0);
        localStorage.setItem('vibeLastDate', today);
    }
    updateStatsUI();
}

function addMinutesToStats(minutesAdded) {
    checkDailyReset(); 
    
    let current = parseFloat(localStorage.getItem('vibeDailyMinutes') || 0);
    current += minutesAdded;
    
    localStorage.setItem('vibeDailyMinutes', current);
    updateStatsUI();
}


// --- AUDIO LOGIC ---
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


// --- MODAL LOGIC ---
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

    concentrationTimer = setInterval(() => {
        const msgs = ["Stay focused! 🔥", "You're doing great! 🚀", "Drink water 💧"];
        showModal(msgs[Math.floor(Math.random() * msgs.length)]);
    }, option.value * 60 * 1000);
}

function stopConcentrationTimer() {
    if (concentrationTimer) clearInterval(concentrationTimer);
}


// --- STATE MANAGEMENT ---
function saveState() {
    const radioPlayer = document.getElementById('lofi-player');
    
    const state = {
        time: timeRemaining,
        running: isRunning,
        sessionMins: currentSessionMinutes, 
        
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
    
    checkDailyReset();

    if (!savedState) return; 

    const state = JSON.parse(savedState);
    
    currentRadioIndex = (state.radioIndex < radioLibrary.length) ? state.radioIndex : 0;
    currentAmbientIndex = (state.ambientIndex < ambientLibrary.length) ? state.ambientIndex : 0;
    currentThemeIndex = (state.themeIndex < themeLibrary.length) ? state.themeIndex : 0;
    
    currentConcIndex = state.concIndex || 3;
    timeRemaining = state.time || DEFAULT_TIME_SECONDS;
    isRunning = state.running;
    
    if (state.sessionMins) currentSessionMinutes = state.sessionMins;

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
            
            addMinutesToStats(currentSessionMinutes);

            bellSound.currentTime = 0;
            bellSound.play().catch(e => console.log(e));
            
            document.getElementById('start-btn').textContent = 'Start';
            timeRemaining = currentSessionMinutes * 60;
            
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
    const s = Math.floor(timeRemaining % 60); 
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
    timeRemaining = currentSessionMinutes * 60; 
    document.getElementById('start-btn').textContent = 'Start';
    updateDisplay();
    saveState();
}

function setTime() {
    const input = document.getElementById('minutes-input');
    const inputMinutes = input ? parseFloat(input.value) : 25;
    
    if (isNaN(inputMinutes) || inputMinutes <= 0) return;
    
    clearInterval(timerInterval);
    stopConcentrationTimer();
    isRunning = false;
    
    currentSessionMinutes = inputMinutes; // Salva la nuova durata
    timeRemaining = inputMinutes * 60;
    
    const startBtn = document.getElementById('start-btn');
    if(startBtn) startBtn.textContent = 'Start';
    
    updateDisplay();
    saveState();
}

function setMode(minutes) {
    const input = document.getElementById('minutes-input');
    if (input) {
        input.value = minutes;
        setTime(); 
    }
}

function toggleFullScreen() {
    const el = document.documentElement;
    const radio = document.getElementById('lofi-player');
    const ambient = document.getElementById('ambient-player');

    if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
    } else {
        if (el.requestFullscreen) {
            el.requestFullscreen().then(() => {
                if (radio && !radio.paused) radio.play();
                if (ambient && !ambient.paused) ambient.play();
            }).catch(err => console.log(err));
        }
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
    
    let lastCategory = null;

    dataList.forEach((item, idx) => {
        // CATEGORIE NEL MENU
        if (item.category && item.category !== lastCategory) {
            const catHeader = document.createElement('div');
            catHeader.className = 'dropdown-category-header';
            catHeader.textContent = item.category;
            list.appendChild(catHeader);
            lastCategory = item.category;
        }

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


// --- EVENTS ---
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
    
    // --- RESET STATS ---
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    const confirmOverlay = document.getElementById('confirm-modal-overlay');
    const confirmYes = document.getElementById('confirm-yes-btn');
    const confirmNo = document.getElementById('confirm-no-btn');

    if (resetStatsBtn) {
        resetStatsBtn.onclick = () => {
            if(confirmOverlay) {
                confirmOverlay.classList.remove('hidden');
                confirmOverlay.classList.add('active');
            }
        };
    }

    if (confirmYes) {
        confirmYes.onclick = () => {
            localStorage.setItem('vibeDailyMinutes', 0);
            updateStatsUI();
            confirmOverlay.classList.remove('active');
            confirmOverlay.classList.add('hidden');
        };
    }

    if (confirmNo) {
        confirmNo.onclick = () => {
            confirmOverlay.classList.remove('active');
            confirmOverlay.classList.add('hidden');
        };
    }

    // --- GESTIONE CALENDARIO ---
    const calendarEl = document.getElementById('floating-calendar');
    const calToggle = document.getElementById('calendar-toggle');
    const monthYearEl = document.getElementById('calendar-month-year');
    const datesGrid = document.getElementById('calendar-dates');
    const prevBtn = document.getElementById('prev-month-btn');
    const nextBtn = document.getElementById('next-month-btn');

    let currentDate = new Date(); 
    let todayDate = new Date();   

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        monthYearEl.textContent = `${monthNames[month]} ${year}`;
        datesGrid.innerHTML = ''; 

        const firstDayIndex = new Date(year, month, 1).getDay(); 
        const daysInMonth = new Date(year, month + 1, 0).getDate(); 
        
        let emptyDays = firstDayIndex - 1; 
        if (emptyDays === -1) emptyDays = 6; 

        for (let i = 0; i < emptyDays; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('empty');
            datesGrid.appendChild(emptyDiv);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = i;
            if (i === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear()) {
                dayDiv.classList.add('today');
            }
            datesGrid.appendChild(dayDiv);
        }
    }

    if (calToggle) {
        calToggle.onclick = () => {
            calendarEl.classList.toggle('hidden');
            if (!calendarEl.classList.contains('hidden')) {
                currentDate = new Date(); 
                renderCalendar(currentDate);
            }
        };
    }

    if (prevBtn) prevBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); };
    if (nextBtn) nextBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); };

    renderCalendar(currentDate);

    // --- GESTIONE NOTEPAD ---
    const notepad = document.getElementById('floating-notepad');
    const notepadToggle = document.getElementById('notepad-toggle');
    const closeNotepad = document.getElementById('close-notepad-btn');
    const textarea = document.getElementById('notepad-content');

    if (textarea) textarea.value = localStorage.getItem('vibeNotepadContent') || '';
    
    if (notepadToggle) {
        notepadToggle.onclick = () => {
            notepad.classList.toggle('hidden');
            if (!notepad.classList.contains('hidden')) {
                setTimeout(() => textarea.focus(), 100);
            }
        };
    }
    
    if (closeNotepad) {
        closeNotepad.onclick = () => {
            notepad.classList.add('hidden');
        };
    }
    
    if (textarea) {
        textarea.addEventListener('input', () => {
            localStorage.setItem('vibeNotepadContent', textarea.value);
        });
    }

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

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
        e.preventDefault(); 
        toggleTimer();
    }

    if (e.code === 'KeyR') resetTimer();
    if (e.code === 'KeyF') toggleFullScreen();

    // T per Note
    if (e.code === 'KeyT') {
        const notepad = document.getElementById('floating-notepad');
        if (notepad) {
            notepad.classList.toggle('hidden');
            if (!notepad.classList.contains('hidden')) {
                setTimeout(() => document.getElementById('notepad-content').focus(), 100);
            }
        }
    }

    // M per Mixer
    if (e.code === 'KeyM') {
        const audioPanel = document.getElementById('mini-player-details');
        if (audioPanel) {
            audioPanel.classList.toggle('hidden');
            saveState();
        }
    }

    // C per Calendario
    if (e.code === 'KeyC') {
        const calendar = document.getElementById('floating-calendar');
        if (calendar) calendar.classList.toggle('hidden');
    }

    if (e.code === 'Escape') {
        const settings = document.getElementById('settings-panel');
        const modal = document.getElementById('custom-modal-overlay');
        const resetModal = document.getElementById('confirm-modal-overlay');
        const audioPanel = document.getElementById('mini-player-details');
        const notepad = document.getElementById('floating-notepad');
        const calendar = document.getElementById('floating-calendar');
        
        if (modal && !modal.classList.contains('hidden')) closeModal();
        else if (resetModal && !resetModal.classList.contains('hidden')) {
            resetModal.classList.remove('active');
            resetModal.classList.add('hidden');
        }
        else if (settings && settings.classList.contains('visible')) settings.classList.remove('visible');
        else if (audioPanel && !audioPanel.classList.contains('hidden')) audioPanel.classList.add('hidden');
        else if (notepad && !notepad.classList.contains('hidden')) notepad.classList.add('hidden');
        else if (calendar && !calendar.classList.contains('hidden')) calendar.classList.add('hidden');
    }
});