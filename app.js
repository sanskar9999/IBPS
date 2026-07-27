document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackStatus = document.getElementById('feedback-status');
    const hintText = document.getElementById('hint-text');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const progressText = document.getElementById('question-progress');
    const progressBar = document.getElementById('progress-bar');
    const jumpInput = document.getElementById('jump-input');
    const btnJump = document.getElementById('btn-jump');
    const jumpContainer = document.getElementById('jump-container');
    const categoryFilter = document.getElementById('category-filter');
    const questionCategory = document.getElementById('question-category');
    const passageCard = document.getElementById('passage-card');
    const passageText = document.getElementById('passage-text');
    const passageImageContainer = document.getElementById('passage-image-container');
    const passageImage = document.getElementById('passage-image');

    // Settings Elements
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const themeOptions = document.querySelectorAll('.theme-option');
    const toggleAutoAdvance = document.getElementById('toggle-auto-advance');
    const toggleSoundEffects = document.getElementById('toggle-sound-effects');
    const autoAdvanceDelay = document.getElementById('auto-advance-delay');
    const autoAdvanceDelayRow = document.getElementById('auto-advance-delay-row');
    const keybindingButtons = document.querySelectorAll('.keybinding-btn');
    const btnResetKeybindings = document.getElementById('btn-reset-keybindings');

    // App State
    let currentIndex = 0;
    let filteredQuestions = [];
    let autoAdvanceEnabled = true;
    let autoAdvanceDelayValue = 1.5;
    let autoAdvanceTimeoutId = null;
    let soundEffectsEnabled = true;

    // Load setting states from localStorage
    const savedAutoAdvance = localStorage.getItem('ibps-so-quiz-auto-advance');
    if (savedAutoAdvance !== null) {
        autoAdvanceEnabled = savedAutoAdvance === 'true';
    }
    const savedAutoAdvanceDelay = localStorage.getItem('ibps-so-quiz-auto-advance-delay');
    if (savedAutoAdvanceDelay !== null) {
        autoAdvanceDelayValue = parseFloat(savedAutoAdvanceDelay) || 1.5;
    }
    const savedSoundEffects = localStorage.getItem('ibps-so-quiz-sound-effects');
    if (savedSoundEffects !== null) {
        soundEffectsEnabled = savedSoundEffects === 'true';
    }

    // Sync UI with loaded settings
    if (toggleAutoAdvance) {
        toggleAutoAdvance.checked = autoAdvanceEnabled;
    }
    if (autoAdvanceDelay) {
        autoAdvanceDelay.value = autoAdvanceDelayValue;
    }
    if (toggleSoundEffects) {
        toggleSoundEffects.checked = soundEffectsEnabled;
    }

    function updateDelayRowState() {
        if (autoAdvanceDelayRow) {
            if (autoAdvanceEnabled) {
                autoAdvanceDelayRow.classList.remove('disabled');
                if (autoAdvanceDelay) autoAdvanceDelay.disabled = false;
            } else {
                autoAdvanceDelayRow.classList.add('disabled');
                if (autoAdvanceDelay) autoAdvanceDelay.disabled = true;
            }
        }
    }
    updateDelayRowState();

    // Settings Event Listeners
    if (toggleAutoAdvance) {
        toggleAutoAdvance.addEventListener('change', (e) => {
            autoAdvanceEnabled = e.target.checked;
            localStorage.setItem('ibps-so-quiz-auto-advance', autoAdvanceEnabled);
            updateDelayRowState();
            
            // If auto-advance is disabled, cancel any active countdown
            if (!autoAdvanceEnabled && autoAdvanceTimeoutId) {
                clearTimeout(autoAdvanceTimeoutId);
                autoAdvanceTimeoutId = null;
                // Re-render feedback status to remove countdown text
                const feedbackStatusElement = document.getElementById('feedback-status');
                if (feedbackStatusElement) {
                    const feedbackStatusText = feedbackStatusElement.innerHTML;
                    if (feedbackStatusText.includes('auto-advance-countdown')) {
                        const iconSvgCorrect = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
                        feedbackStatusElement.innerHTML = `${iconSvgCorrect} Correct!`;
                    }
                }
            }
        });
    }

    if (autoAdvanceDelay) {
        autoAdvanceDelay.addEventListener('change', (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val) || val < 0.5) val = 0.5;
            if (val > 10) val = 10;
            autoAdvanceDelayValue = val;
            autoAdvanceDelay.value = val;
            localStorage.setItem('ibps-so-quiz-auto-advance-delay', autoAdvanceDelayValue);
        });
    }

    if (toggleSoundEffects) {
        toggleSoundEffects.addEventListener('change', (e) => {
            soundEffectsEnabled = e.target.checked;
            localStorage.setItem('ibps-so-quiz-sound-effects', soundEffectsEnabled);
        });
    }

    // Keybindings configuration (5 Options for IBPS)
    const defaultKeybindings = {
        'A': '1',
        'B': '2',
        'C': '3',
        'D': '4',
        'E': '5'
    };
    let keybindings = { ...defaultKeybindings };
    let recordingOptionId = null;
    let recordingButton = null;

    const savedKeybindings = localStorage.getItem('ibps-so-quiz-keybindings');
    if (savedKeybindings) {
        try {
            keybindings = JSON.parse(savedKeybindings);
        } catch (e) {
            console.error('Error parsing keybindings from localStorage', e);
        }
    }

    function getFriendlyKeyName(key) {
        if (!key) return 'None';
        if (key === ' ') return 'Space';
        if (key === 'ArrowUp') return '↑';
        if (key === 'ArrowDown') return '↓';
        if (key === 'ArrowLeft') return '←';
        if (key === 'ArrowRight') return '→';
        if (key.length === 1) return key.toUpperCase();
        return key.charAt(0).toUpperCase() + key.slice(1);
    }

    function initKeybindingsUI() {
        if (keybindingButtons) {
            keybindingButtons.forEach(btn => {
                const optId = btn.dataset.option;
                if (optId && keybindings[optId]) {
                    btn.textContent = getFriendlyKeyName(keybindings[optId]);
                }
            });
        }
    }
    initKeybindingsUI();

    // Prepare IBPS Questions Dataset
    function loadIBPSDataset() {
        if (typeof ibpsQuestionsData === 'undefined') {
            return [];
        }

        let list = [];
        // Add PYQs (2025, 2024, 2023, 2021)
        if (ibpsQuestionsData.papers) {
            ibpsQuestionsData.papers.forEach(p => {
                p.questions.forEach(q => {
                    list.push({
                        ...q,
                        paperYear: p.year,
                        paperTitle: p.title,
                        category: `${p.year} Prelims: ${q.section}`,
                        hint: q.explanation || "Refer to IBPS Prelims official answer key & explanation."
                    });
                });
            });
        }

        // Add Professional Knowledge (IT Officer)
        if (ibpsQuestionsData.pkIT) {
            ibpsQuestionsData.pkIT.forEach(q => {
                list.push({
                    ...q,
                    paperYear: 'PK',
                    category: `PK (IT): ${q.category || 'Core CS'}`,
                    hint: q.explanation || "Verified solution from IBPS SO IT Officer Professional Knowledge Question Bank."
                });
            });
        }

        return list;
    }

    const allIBPSQuestions = loadIBPSDataset();

    if (!allIBPSQuestions || allIBPSQuestions.length === 0) {
        if (questionText) questionText.textContent = "No IBPS questions found. Please check ibps-questions.js file.";
        return;
    }

    // Populate category filter dropdown dynamically
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="all">All Categories (950+ Questions)</option>';

        // Section & Year Group Options
        const customCategories = [
            { label: "--- Papers & Main Subjects ---", disabled: true },
            { label: "2025 Prelims Paper (Memory-Based)", value: "year-2025" },
            { label: "2024 Prelims Paper (Memory-Based)", value: "year-2024" },
            { label: "2023 Prelims Paper (Memory-Based)", value: "year-2023" },
            { label: "2021 Prelims Paper (Memory-Based)", value: "year-2021" },
            { label: "All Professional Knowledge (IT Officer)", value: "section-pk" },
            { label: "All English Language", value: "section-eng" },
            { label: "All Reasoning Ability", value: "section-rea" },
            { label: "All Quantitative Aptitude", value: "section-quant" },
            { label: "--- Detailed IT Categories ---", disabled: true }
        ];

        customCategories.forEach(c => {
            const opt = document.createElement('option');
            if (c.disabled) {
                opt.disabled = true;
                opt.textContent = c.label;
            } else {
                opt.value = c.value;
                opt.textContent = c.label;
            }
            categoryFilter.appendChild(opt);
        });

        // Add specific PK IT subcategories
        const pkSubcats = [...new Set(allIBPSQuestions.filter(q => q.section === "Professional Knowledge (IT)").map(q => q.category))].sort();
        pkSubcats.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            categoryFilter.appendChild(opt);
        });

        categoryFilter.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'all') {
                filteredQuestions = [...allIBPSQuestions];
            } else if (val.startsWith('year-')) {
                const yr = val.replace('year-', '');
                filteredQuestions = allIBPSQuestions.filter(q => String(q.paperYear) === yr);
            } else if (val === 'section-pk') {
                filteredQuestions = allIBPSQuestions.filter(q => q.section === 'Professional Knowledge (IT)');
            } else if (val === 'section-eng') {
                filteredQuestions = allIBPSQuestions.filter(q => q.section === 'English Language');
            } else if (val === 'section-rea') {
                filteredQuestions = allIBPSQuestions.filter(q => q.section === 'Reasoning Ability');
            } else if (val === 'section-quant') {
                filteredQuestions = allIBPSQuestions.filter(q => q.section === 'Quantitative Aptitude');
            } else {
                filteredQuestions = allIBPSQuestions.filter(q => q.category === val);
            }

            currentIndex = 0;
            updateJumpBounds();
            loadQuestion(currentIndex);
        });
    }

    filteredQuestions = [...allIBPSQuestions];

    // Dynamic setup for jump input attributes
    function updateJumpBounds() {
        if (jumpInput) {
            jumpInput.max = filteredQuestions.length;
            jumpInput.placeholder = `1-${filteredQuestions.length}`;
        }
    }
    updateJumpBounds();

    function saveProgress(index) {
        if (categoryFilter) {
            localStorage.setItem('ibps-so-quiz-category', categoryFilter.value);
        }
        localStorage.setItem('ibps-so-quiz-index', index);
    }

    // Event Listeners for Nav
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentIndex < filteredQuestions.length - 1) {
                currentIndex++;
                loadQuestion(currentIndex);
            }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                loadQuestion(currentIndex);
            }
        });
    }

    function handleJump() {
        if (!jumpInput) return;
        const val = parseInt(jumpInput.value, 10);
        if (!isNaN(val) && val >= 1 && val <= filteredQuestions.length) {
            currentIndex = val - 1;
            loadQuestion(currentIndex);
            jumpInput.value = '';
            jumpInput.blur();
        } else {
            if (jumpContainer) {
                jumpContainer.classList.add('shake');
                setTimeout(() => jumpContainer.classList.remove('shake'), 400);
            }
        }
    }

    if (btnJump) btnJump.addEventListener('click', handleJump);
    if (jumpInput) {
        jumpInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleJump();
        });
    }

    function escapeHTML(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function loadQuestion(index) {
        if (autoAdvanceTimeoutId) {
            clearTimeout(autoAdvanceTimeoutId);
            autoAdvanceTimeoutId = null;
        }

        if (!filteredQuestions || filteredQuestions.length === 0 || index < 0 || index >= filteredQuestions.length) {
            return;
        }

        currentIndex = index;
        saveProgress(index);

        const q = filteredQuestions[index];

        progressText.textContent = `Question ${index + 1} of ${filteredQuestions.length}`;
        progressBar.style.width = `${((index + 1) / filteredQuestions.length) * 100}%`;

        if (questionCategory) {
            questionCategory.textContent = q.category || q.section || "General";
            questionCategory.className = "question-category";
            const catClass = "cat-" + (q.section || "general").toLowerCase().replace(/[^a-z0-9]+/g, '-');
            questionCategory.classList.add(catClass);
        }

        // Render Passage & DI Diagram
        if (passageCard) {
            if (q.direction || q.directionImage) {
                passageCard.classList.remove('hidden');
                if (passageText) passageText.textContent = q.direction || "";
                if (passageImageContainer && passageImage) {
                    if (q.directionImage) {
                        passageImage.src = q.directionImage;
                        passageImageContainer.classList.remove('hidden');
                    } else {
                        passageImageContainer.classList.add('hidden');
                    }
                }
            } else {
                passageCard.classList.add('hidden');
            }
        }

        questionText.innerHTML = escapeHTML(q.question);

        optionsContainer.innerHTML = '';
        feedbackContainer.classList.add('hidden');

        // Options A-E
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            const letterSpan = document.createElement('span');
            letterSpan.className = 'option-letter';
            letterSpan.textContent = opt.id;

            const textNode = document.createTextNode(` ${opt.text}`);

            btn.appendChild(letterSpan);
            btn.appendChild(textNode);

            if (keybindings[opt.id]) {
                const keyBadge = document.createElement('span');
                keyBadge.className = 'option-key-badge';
                keyBadge.textContent = getFriendlyKeyName(keybindings[opt.id]);
                btn.appendChild(keyBadge);
            }

            btn.addEventListener('click', () => handleOptionClick(btn, opt, q.options, q.hint || q.explanation));
            optionsContainer.appendChild(btn);
        });

        if (btnPrev) btnPrev.disabled = index === 0;
        if (btnNext) btnNext.disabled = index === filteredQuestions.length - 1;
    }

    function handleOptionClick(clickedBtn, selectedOption, allOptionsData, hint) {
        const allButtons = Array.from(optionsContainer.children);
        allButtons.forEach(btn => btn.disabled = true);

        const correctIndex = allOptionsData.findIndex(o => o.isCorrect);

        if (selectedOption.isCorrect) {
            clickedBtn.classList.add('correct');
            showFeedback(true, hint);
            playChime(true);

            if (autoAdvanceEnabled && currentIndex < filteredQuestions.length - 1) {
                autoAdvanceTimeoutId = setTimeout(() => {
                    currentIndex++;
                    loadQuestion(currentIndex);
                }, autoAdvanceDelayValue * 1000);
            }
        } else {
            clickedBtn.classList.add('incorrect');
            if (correctIndex !== -1) {
                allButtons[correctIndex].classList.add('correct');
            }
            showFeedback(false, hint);
            playChime(false);
        }
    }

    function showFeedback(isCorrect, hint) {
        feedbackContainer.classList.remove('hidden');

        const iconSvgCorrect = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        const iconSvgIncorrect = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

        if (isCorrect) {
            feedbackStatus.className = 'feedback-status status-correct';
            let countdownText = "";
            if (autoAdvanceEnabled && currentIndex < filteredQuestions.length - 1) {
                countdownText = ` <span class="auto-advance-countdown">(Advancing in ${autoAdvanceDelayValue}s)</span>`;
            }
            feedbackStatus.innerHTML = `${iconSvgCorrect} Correct!${countdownText}`;
        } else {
            feedbackStatus.className = 'feedback-status status-incorrect';
            feedbackStatus.innerHTML = `${iconSvgIncorrect} Incorrect`;
        }

        hintText.innerHTML = escapeHTML(hint || "Solution verified from official IBPS SO IT Officer answer key.");
    }

    // Settings Modal
    if (btnSettings && settingsModal) {
        btnSettings.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    }
    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
    }

    // Themes
    const savedTheme = localStorage.getItem('ibps-so-quiz-theme') || 'classic';
    setTheme(savedTheme);

    themeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const themeName = btn.dataset.theme;
            setTheme(themeName);
            localStorage.setItem('ibps-so-quiz-theme', themeName);
        });
    });

    function setTheme(name) {
        document.body.className = '';
        if (name !== 'classic') {
            document.body.classList.add(`theme-${name}`);
        }
        themeOptions.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === name);
        });
    }

    // Sound Effects & Audio Context
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        return audioCtx;
    }

    function playTone(freq, type, startTime, duration, volume) {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    function playChime(isCorrect) {
        if (!soundEffectsEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        if (isCorrect) {
            playTone(659.25, 'sine', now, 0.15, 0.2);
            playTone(880.00, 'sine', now + 0.12, 0.35, 0.25);
        } else {
            playTone(220.00, 'sawtooth', now, 0.2, 0.2);
            playTone(185.00, 'sawtooth', now + 0.15, 0.3, 0.2);
        }
    }

    // Global keyboard listener
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        if (settingsModal && !settingsModal.classList.contains('hidden')) return;

        const pressedKey = e.key.toLowerCase();
        let matchedOptionId = null;
        for (const [optionId, key] of Object.entries(keybindings)) {
            if (key.toLowerCase() === pressedKey) {
                matchedOptionId = optionId;
                break;
            }
        }

        if (matchedOptionId) {
            const optionButtons = Array.from(optionsContainer.querySelectorAll('.option-btn'));
            const matchedBtn = optionButtons.find(btn => {
                const letterSpan = btn.querySelector('.option-letter');
                return letterSpan && letterSpan.textContent.trim() === matchedOptionId;
            });

            if (matchedBtn && !matchedBtn.disabled) {
                e.preventDefault();
                matchedBtn.click();
            }
        }
    });

    // Initialize first question
    loadQuestion(currentIndex);
});
