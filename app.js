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
    const examModeSelect = document.getElementById('exam-mode-select');
    const btnCodingLink = document.getElementById('btn-coding-link');
    const btnExamLink = document.getElementById('btn-exam-simulation-link');
    const passageCard = document.getElementById('passage-card');
    const passageText = document.getElementById('passage-text');
    const passageImageContainer = document.getElementById('passage-image-container');
    const passageImage = document.getElementById('passage-image');
    const pageHeaderTitle = document.querySelector('.logo-container h1');

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

    // Keybindings configuration
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

    const savedKeybindings = localStorage.getItem('tcs-ipa-quiz-keybindings');
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
    let currentExamMode = localStorage.getItem('practice-exam-mode') || 'tcs';
    let currentQuestionSet = [];

    function prepareIBPSQuestions() {
        if (typeof ibpsQuestionsData === 'undefined') return [];
        let list = [];
        if (ibpsQuestionsData.papers) {
            ibpsQuestionsData.papers.forEach(p => {
                p.questions.forEach(q => {
                    list.push({
                        ...q,
                        category: `${p.year} Prelims: ${q.section}`,
                        paperYear: p.year,
                        hint: q.explanation
                    });
                });
            });
        }
        if (ibpsQuestionsData.pkIT) {
            ibpsQuestionsData.pkIT.forEach(q => {
                list.push({
                    ...q,
                    category: `PK (IT): ${q.category || 'General'}`,
                    paperYear: 'PK',
                    hint: q.explanation
                });
            });
        }
        return list;
    }
    const ibpsAllQuestions = prepareIBPSQuestions();

    function setupExamMode(mode, loadDefault = true) {
        currentExamMode = mode;
        localStorage.setItem('practice-exam-mode', mode);
        if (examModeSelect) examModeSelect.value = mode;

        if (mode === 'ibps') {
            if (pageHeaderTitle) pageHeaderTitle.textContent = "IBPS SO IT Prelims Practice";
            if (btnCodingLink) btnCodingLink.classList.add('hidden');
            if (btnExamLink) {
                btnExamLink.href = 'ibps-exam.html';
                btnExamLink.textContent = '⚡ IBPS Prelims Simulator';
            }
            currentQuestionSet = ibpsAllQuestions;
        } else {
            if (pageHeaderTitle) pageHeaderTitle.textContent = "TCS IPA Practice";
            if (btnCodingLink) btnCodingLink.classList.remove('hidden');
            if (btnExamLink) {
                btnExamLink.href = 'exam.html';
                btnExamLink.textContent = '⚡ Mock Exam';
            }
            currentQuestionSet = (typeof questionsData !== 'undefined') ? [...questionsData] : [];
        }

        if (!currentQuestionSet || currentQuestionSet.length === 0) {
            if (questionText) questionText.textContent = "No questions found. Please check dataset.";
            return;
        }

        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="all">All Categories</option>';
            const uniqueCategories = [...new Set(currentQuestionSet.map(q => q.category).filter(Boolean))];
            
            if (mode === 'tcs') {
                const categoryOrder = [
                    "KYT", "BizSkill", "UI", "Unix", "Java", 
                    "Python", "Java / Python", "SQL / PLSQL", 
                    "Algorithms", "C# / .NET", "Miscellaneous"
                ];
                uniqueCategories.sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            } else {
                uniqueCategories.sort();
            }

            uniqueCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categoryFilter.appendChild(option);
            });
        }

        filteredQuestions = [...currentQuestionSet];
        if (loadDefault) {
            currentIndex = 0;
            updateJumpBounds();
            loadQuestion(currentIndex);
        }
    }

    if (examModeSelect) {
        examModeSelect.addEventListener('change', (e) => {
            setupExamMode(e.target.value, true);
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            const selected = e.target.value;
            if (selected === 'all') {
                filteredQuestions = [...currentQuestionSet];
            } else {
                filteredQuestions = currentQuestionSet.filter(q => q.category === selected);
            }
            currentIndex = 0;
            updateJumpBounds();
            loadQuestion(currentIndex);
        });
    }

    // Initialize mode without auto-loading question 0 yet
    setupExamMode(currentExamMode, false);

    // Restore category and question index from localStorage if available
    const savedCategory = localStorage.getItem('tcs-ipa-quiz-category');
    const savedIndex = localStorage.getItem('tcs-ipa-quiz-index');

    if (savedCategory && savedCategory !== 'all') {
        const categoryExists = currentQuestionSet.some(q => q.category === savedCategory);
        if (categoryExists) {
            if (categoryFilter) {
                categoryFilter.value = savedCategory;
            }
            filteredQuestions = currentQuestionSet.filter(q => q.category === savedCategory);
        }
    }

    if (savedIndex !== null) {
        const parsedIndex = parseInt(savedIndex, 10);
        if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < filteredQuestions.length) {
            currentIndex = parsedIndex;
        }
    }

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
            localStorage.setItem('tcs-ipa-quiz-category', categoryFilter.value);
        }
        localStorage.setItem('tcs-ipa-quiz-index', index);
    }

    // Initialize App
    loadQuestion(currentIndex);

    // Event Listeners
    btnNext.addEventListener('click', () => {
        if (currentIndex < filteredQuestions.length - 1) {
            currentIndex++;
            loadQuestion(currentIndex);
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            loadQuestion(currentIndex);
        }
    });

    // Jump to question functionality
    function handleJump() {
        if (!jumpInput) return;
        const val = parseInt(jumpInput.value, 10);
        if (!isNaN(val) && val >= 1 && val <= filteredQuestions.length) {
            currentIndex = val - 1;
            loadQuestion(currentIndex);
            jumpInput.value = '';
            jumpInput.blur();
        } else {
            // Apply error shake effect
            if (jumpContainer) {
                jumpContainer.classList.add('shake');
                setTimeout(() => {
                    jumpContainer.classList.remove('shake');
                }, 400);
            }
        }
    }

    if (btnJump) {
        btnJump.addEventListener('click', handleJump);
    }
    if (jumpInput) {
        jumpInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleJump();
            }
        });
    }

    // Helper Functions for Code Formatting and Rendering
    function escapeHTML(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/&lt;br\s*\/?&gt;/gi, "<br>");
    }

    function deduplicateText(str) {
        if (!str) return str;
        str = str.trim();
        
        const len = str.length;
        for (let k = 2; k <= 6; k++) {
            if (len % k === 0) {
                const size = len / k;
                const pattern = str.slice(0, size);
                let repeated = true;
                for (let i = 1; i < k; i++) {
                    if (str.slice(i * size, (i + 1) * size) !== pattern) {
                        repeated = false;
                        break;
                    }
                }
                if (repeated) {
                    return pattern;
                }
            }
        }
        
        const prefix = str.substring(0, Math.min(25, str.length));
        if (prefix.length >= 20) {
            const firstIndex = str.indexOf(prefix);
            const secondIndex = str.indexOf(prefix, firstIndex + prefix.length);
            if (secondIndex !== -1) {
                const part1 = str.substring(0, secondIndex).trim();
                const part2 = str.substring(secondIndex).trim();
                if (part1 === part2 || part2.startsWith(part1)) {
                    return part1;
                }
            }
        }
        
        return str;
    }

    function formatCode(codeStr) {
        codeStr = codeStr.trim();
        let formatted = "";
        let indentLevel = 0;
        const indentSize = 4;
        let inString = false;
        let stringChar = null;
        let inParentheses = 0;
        
        for (let i = 0; i < codeStr.length; i++) {
            const char = codeStr[i];
            
            if ((char === '"' || char === "'") && (i === 0 || codeStr[i-1] !== '\\')) {
                if (inString && char === stringChar) {
                    inString = false;
                    stringChar = null;
                } else if (!inString) {
                    inString = true;
                    stringChar = char;
                }
                formatted += char;
                continue;
            }
            
            if (inString) {
                formatted += char;
                continue;
            }
            
            if (char === '(') {
                inParentheses++;
                formatted += char;
                continue;
            }
            if (char === ')') {
                inParentheses = Math.max(0, inParentheses - 1);
                formatted += char;
                continue;
            }
            
            if (char === '{') {
                indentLevel++;
                formatted = formatted.trimEnd();
                formatted += " {\n" + " ".repeat(indentLevel * indentSize);
                while (i + 1 < codeStr.length && (codeStr[i+1] === ' ' || codeStr[i+1] === '\n' || codeStr[i+1] === '\r')) {
                    i++;
                }
            } else if (char === '}') {
                indentLevel = Math.max(0, indentLevel - 1);
                formatted = formatted.trimEnd();
                formatted += "\n" + " ".repeat(indentLevel * indentSize) + "}";
                while (i + 1 < codeStr.length && (codeStr[i+1] === ' ' || codeStr[i+1] === '\n' || codeStr[i+1] === '\r')) {
                    i++;
                }
                let rest = codeStr.substring(i + 1).trim();
                if (rest.startsWith("else") || rest.startsWith("catch") || rest.startsWith("finally")) {
                    formatted += " ";
                } else {
                    formatted += "\n" + " ".repeat(indentLevel * indentSize);
                }
            } else if (char === ';' && inParentheses === 0) {
                formatted += ";\n" + " ".repeat(indentLevel * indentSize);
                while (i + 1 < codeStr.length && (codeStr[i+1] === ' ' || codeStr[i+1] === '\n' || codeStr[i+1] === '\r')) {
                    i++;
                }
            } else {
                formatted += char;
            }
        }
        return formatted.split('\n').map(line => line.trimRight()).join('\n').trim();
    }

    function extractCodeBlock(text) {
        const keywords = [
            /using\s+System/i,
            /namespace\s+[a-zA-Z_]/i,
            /import\s+[a-zA-Z_]\w*(?:\s*\.\s*[a-zA-Z_/*]\w*)*\s*;/i,
            /public\s+class\s+[a-zA-Z_]/i,
            /class\s+[a-zA-Z_]\w*\s*(?:extends|implements|:|{)/i,
            /public\s+static\s+void/i,
            /static\s+void\s+[a-zA-Z_]/i,
            /public\s+enum\s+[a-zA-Z_]/i,
            /enum\s+[a-zA-Z_]/i,
            /CREATE\s+OR\s+REPLACE\s+FUNCTION/i,
            /declare\s+[a-zA-Z_]/i
        ];
        
        let earliestIndex = -1;
        let matchedKeyword = "";
        
        for (const regex of keywords) {
            const match = text.match(regex);
            if (match && match.index !== undefined) {
                if (earliestIndex === -1 || match.index < earliestIndex) {
                    earliestIndex = match.index;
                    matchedKeyword = match[0];
                }
            }
        }
        
        if (earliestIndex !== -1) {
            const codeStart = earliestIndex;
            const remaining = text.substring(codeStart);
            
            let braceCount = 0;
            let hasBraces = false;
            let codeEnd = -1;
            
            for (let i = 0; i < remaining.length; i++) {
                if (remaining[i] === '{') {
                    braceCount++;
                    hasBraces = true;
                } else if (remaining[i] === '}') {
                    braceCount--;
                    if (hasBraces && braceCount === 0) {
                        codeEnd = codeStart + i + 1;
                        break;
                    }
                }
            }
            
            if (codeEnd === -1) {
                if (/declare|begin/i.test(matchedKeyword) || /CREATE\s+OR\s+REPLACE/i.test(matchedKeyword)) {
                    const endMatch = remaining.match(/end\s*;?/i);
                    if (endMatch && endMatch.index !== undefined) {
                        codeEnd = codeStart + endMatch.index + endMatch[0].length;
                    }
                }
            }
            
            if (codeEnd !== -1) {
                const before = text.substring(0, codeStart);
                const code = text.substring(codeStart, codeEnd);
                const after = text.substring(codeEnd);
                return { before, code, after };
            } else {
                if (remaining.includes(';') || remaining.includes('(')) {
                    const before = text.substring(0, codeStart);
                    const code = remaining;
                    return { before, code, after: "" };
                }
            }
        }
        
        const sqlRegex = /(SELECT\s+[\s\S]+?FROM\s+[\s\S]+?(?:WHERE\s+[\s\S]+?)?)(?:;|$)/i;
        const sqlMatch = text.match(sqlRegex);
        if (sqlMatch && sqlMatch.index !== undefined && sqlMatch[0].length > 15) {
            const before = text.substring(0, sqlMatch.index);
            const code = sqlMatch[0];
            const after = text.substring(sqlMatch.index + sqlMatch[0].length);
            return { before, code, after };
        }
        
        return null;
    }

    function formatInlineCode(text) {
        if (!text) return text;
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        text = text.replace(/'([^']+)'/g, (match, content) => {
            if (content.includes('(') || content.includes('[') || content.includes(';') || content.includes('{') || content.includes('->') || content.includes('==') || content.includes(' = ')) {
                return `<code>${content}</code>`;
            }
            return match;
        });
        
        return text;
    }

    function escapeAndFormat(text) {
        if (!text) return "";
        const formatted = formatInlineCode(text);
        const parts = formatted.split(/(<\/?code>)/g);
        let result = "";
        let insideCode = false;
        
        for (const part of parts) {
            if (part === "<code>") {
                result += "<code>";
                insideCode = true;
            } else if (part === "</code>") {
                result += "</code>";
                insideCode = false;
            } else {
                result += escapeHTML(part);
            }
        }
        
        return result;
    }

    function loadQuestion(index) {
        // Clear any active auto-advance timer
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
        
        // Update Header and Progress
        progressText.textContent = `Question ${index + 1} of ${filteredQuestions.length}`;
        progressBar.style.width = `${((index + 1) / filteredQuestions.length) * 100}%`;
        
        // Update Category Badge
        if (questionCategory) {
            questionCategory.textContent = q.category || "General";
            questionCategory.className = "question-category";
            const catClass = "cat-" + (q.category || "general").toLowerCase().replace(/[^a-z0-9]+/g, '-');
            questionCategory.classList.add(catClass);
        }

        // Setup passage / DI diagram if exists
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
        
        // Setup text with formatting and deduplication
        const deduplicatedQuestion = deduplicateText(q.question);
        const codeBlockData = extractCodeBlock(deduplicatedQuestion);
        
        if (codeBlockData) {
            const beforeHTML = escapeAndFormat(codeBlockData.before);
            const formattedCode = escapeHTML(formatCode(codeBlockData.code));
            const afterHTML = escapeAndFormat(codeBlockData.after);
            
            questionText.innerHTML = `
                ${beforeHTML ? `<div class="question-desc">${beforeHTML}</div>` : ''}
                <pre class="code-block"><code>${formattedCode}</code></pre>
                ${afterHTML ? `<div class="question-desc">${afterHTML}</div>` : ''}
            `;
        } else {
            questionText.innerHTML = escapeAndFormat(deduplicatedQuestion);
        }
        
        // Clear old options and feedback
        optionsContainer.innerHTML = '';
        feedbackContainer.classList.add('hidden');
        
        // Create new options
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            
            const letterSpan = document.createElement('span');
            letterSpan.className = 'option-letter';
            letterSpan.textContent = opt.id;
            
            const textNode = document.createTextNode(` ${opt.text}`);
            
            btn.appendChild(letterSpan);
            btn.appendChild(textNode);
            
            // Keybinding badge
            if (keybindings[opt.id]) {
                const keyBadge = document.createElement('span');
                keyBadge.className = 'option-key-badge';
                keyBadge.textContent = getFriendlyKeyName(keybindings[opt.id]);
                btn.appendChild(keyBadge);
            }
            
            // On Click
            btn.addEventListener('click', () => handleOptionClick(btn, opt, q.options, q.hint || q.explanation || "No explanation available."));
            
            optionsContainer.appendChild(btn);
        });
        
        // Update navigation buttons
        btnPrev.disabled = index === 0;
        btnNext.disabled = index === filteredQuestions.length - 1;
    }

    function handleOptionClick(clickedBtn, selectedOption, allOptionsData, hint) {
        const allButtons = Array.from(optionsContainer.children);
        
        // Disable all buttons
        allButtons.forEach(btn => btn.disabled = true);
        
        // Find correct option index
        const correctIndex = allOptionsData.findIndex(o => o.isCorrect);
        
        if (selectedOption.isCorrect) {
            // Correct guess
            clickedBtn.classList.add('correct');
            showFeedback(true, hint);
            playChime(true);

            // Auto advance
            if (autoAdvanceEnabled && currentIndex < filteredQuestions.length - 1) {
                autoAdvanceTimeoutId = setTimeout(() => {
                    currentIndex++;
                    loadQuestion(currentIndex);
                }, autoAdvanceDelayValue * 1000);
            }
        } else {
            // Incorrect guess
            clickedBtn.classList.add('incorrect');
            
            // Highlight the correct one
            if (correctIndex !== -1) {
                allButtons[correctIndex].classList.add('correct');
            }
            showFeedback(false, hint);
            playChime(false);
        }
    }

    function showFeedback(isCorrect, hint) {
        feedbackContainer.classList.remove('hidden');
        
        const iconSvgCorrect = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        const iconSvgIncorrect = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

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
        
        hintText.innerHTML = escapeAndFormat(hint);
    }

    // Settings Modal Toggle Logic
    if (btnSettings && settingsModal) {
        btnSettings.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
        });
    }

    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            if (recordingOptionId) cancelRecording();
        });
    }

    // Close modal when clicking outside (on overlay)
    if (settingsModal) {
        const modalOverlay = settingsModal.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                settingsModal.classList.add('hidden');
                if (recordingOptionId) cancelRecording();
            });
        }
    }

    // Escape key listener to close modal or cancel keybinding capture
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (settingsModal && !settingsModal.classList.contains('hidden')) {
                if (recordingOptionId) {
                    cancelRecording();
                } else {
                    settingsModal.classList.add('hidden');
                }
            }
        }
    });

    // Theme Management Logic
    function setTheme(theme) {
        // Remove previous theme classes from body
        document.body.classList.remove('theme-light', 'theme-amoled');
        
        if (theme === 'light') {
            document.body.classList.add('theme-light');
        } else if (theme === 'amoled') {
            document.body.classList.add('theme-amoled');
        }
        
        // Update active class on theme option buttons
        if (themeOptions) {
            themeOptions.forEach(opt => {
                if (opt.dataset.theme === theme) {
                    opt.classList.add('active');
                } else {
                    opt.classList.remove('active');
                }
            });
        }
        
        // Persist setting in localStorage
        localStorage.setItem('tcs-ipa-quiz-theme', theme);
    }

    // Load persisted theme
    const savedTheme = localStorage.getItem('tcs-ipa-quiz-theme') || 'classic';
    setTheme(savedTheme);

    // Bind click events to theme selector buttons
    if (themeOptions) {
        themeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const selectedTheme = opt.dataset.theme;
                setTheme(selectedTheme);
            });
        });
    }

    // Load persisted Auto-Advance settings
    const savedAutoAdvance = localStorage.getItem('tcs-ipa-quiz-auto-advance');
    if (savedAutoAdvance !== null) {
        autoAdvanceEnabled = savedAutoAdvance === 'true';
    } else {
        autoAdvanceEnabled = true; // default enabled
    }

    const savedAutoAdvanceDelay = localStorage.getItem('tcs-ipa-quiz-auto-advance-delay');
    if (savedAutoAdvanceDelay !== null) {
        autoAdvanceDelayValue = parseFloat(savedAutoAdvanceDelay) || 1.5;
    } else {
        autoAdvanceDelayValue = 1.5; // default 1.5 seconds
    }

    // Initialize Auto-Advance DOM states
    if (toggleAutoAdvance) {
        toggleAutoAdvance.checked = autoAdvanceEnabled;
        toggleAutoAdvance.addEventListener('change', (e) => {
            autoAdvanceEnabled = e.target.checked;
            localStorage.setItem('tcs-ipa-quiz-auto-advance', autoAdvanceEnabled);
            updateAutoAdvanceUI();
        });
    }

    if (autoAdvanceDelay) {
        autoAdvanceDelay.value = autoAdvanceDelayValue;
        autoAdvanceDelay.addEventListener('change', (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val) || val < 0.5) val = 0.5;
            if (val > 10) val = 10;
            val = Math.round(val * 10) / 10; // round to 1 decimal place
            autoAdvanceDelayValue = val;
            autoAdvanceDelay.value = val;
            localStorage.setItem('tcs-ipa-quiz-auto-advance-delay', autoAdvanceDelayValue);
        });
        
        autoAdvanceDelay.addEventListener('blur', (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val) || val < 0.5) val = 0.5;
            if (val > 10) val = 10;
            val = Math.round(val * 10) / 10;
            autoAdvanceDelay.value = val;
        });
    }

    function updateAutoAdvanceUI() {
        if (autoAdvanceDelayRow) {
            if (autoAdvanceEnabled) {
                autoAdvanceDelayRow.classList.remove('disabled');
            } else {
                autoAdvanceDelayRow.classList.add('disabled');
            }
        }
    }
    updateAutoAdvanceUI();

    // Load persisted Sound Effects settings
    const savedSoundEffects = localStorage.getItem('tcs-ipa-quiz-sound-effects');
    if (savedSoundEffects !== null) {
        soundEffectsEnabled = savedSoundEffects === 'true';
    } else {
        soundEffectsEnabled = true; // default enabled
    }

    // Initialize Sound Effects DOM states
    if (toggleSoundEffects) {
        toggleSoundEffects.checked = soundEffectsEnabled;
        toggleSoundEffects.addEventListener('change', (e) => {
            soundEffectsEnabled = e.target.checked;
            localStorage.setItem('tcs-ipa-quiz-sound-effects', soundEffectsEnabled);
            if (soundEffectsEnabled) {
                playChime(true);
            }
        });
    }

    // Web Audio API Synthesis for Sound Effects
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
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
        
        // Smooth volume envelope: start, sustain, decay to zero to avoid pop/clicks
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
        
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const now = ctx.currentTime;
        
        if (isCorrect) {
            // Correct chime: Two short, rising tones (E5, A5)
            playTone(659.25, 'sine', now, 0.12, 0.05);
            playTone(880.00, 'sine', now + 0.08, 0.25, 0.05);
        } else {
            // Incorrect chime: Two short, descending/dull tones (C4, F#3)
            playTone(261.63, 'triangle', now, 0.15, 0.04);
            playTone(185.00, 'triangle', now + 0.08, 0.25, 0.04);
        }
    }

    // Keybindings recording and management
    function startRecording(button, optionId) {
        if (recordingOptionId) {
            cancelRecording();
        }

        recordingOptionId = optionId;
        recordingButton = button;
        button.classList.add('recording');
        button.textContent = 'Press a key...';

        document.addEventListener('keydown', handleRecordKeydown, true);
    }

    function cancelRecording() {
        if (recordingOptionId && recordingButton) {
            recordingButton.classList.remove('recording');
            recordingButton.textContent = getFriendlyKeyName(keybindings[recordingOptionId]);
        }
        document.removeEventListener('keydown', handleRecordKeydown, true);
        recordingOptionId = null;
        recordingButton = null;
    }

    function handleRecordKeydown(e) {
        e.preventDefault();
        e.stopPropagation();

        const pressedKey = e.key;

        // Escape cancels
        if (pressedKey === 'Escape') {
            cancelRecording();
            return;
        }

        // Swap keybindings if the key is already used
        for (const [optId, key] of Object.entries(keybindings)) {
            if (optId !== recordingOptionId && key.toLowerCase() === pressedKey.toLowerCase()) {
                keybindings[optId] = keybindings[recordingOptionId];
                const otherBtn = Array.from(keybindingButtons).find(btn => btn.dataset.option === optId);
                if (otherBtn) {
                    otherBtn.textContent = getFriendlyKeyName(keybindings[optId]);
                }
            }
        }

        // Save new keybinding
        keybindings[recordingOptionId] = pressedKey;
        localStorage.setItem('tcs-ipa-quiz-keybindings', JSON.stringify(keybindings));

        // Update current button text
        recordingButton.textContent = getFriendlyKeyName(pressedKey);
        recordingButton.classList.remove('recording');

        // Cleanup
        document.removeEventListener('keydown', handleRecordKeydown, true);
        recordingOptionId = null;
        recordingButton = null;

        // Refresh key badges on current question immediately
        loadQuestion(currentIndex);
    }

    // Attach click listeners to keybinding buttons in Settings
    if (keybindingButtons) {
        keybindingButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const optId = btn.dataset.option;
                if (optId) {
                    startRecording(btn, optId);
                }
            });
        });
    }

    // Reset button click listener
    if (btnResetKeybindings) {
        btnResetKeybindings.addEventListener('click', () => {
            if (recordingOptionId) cancelRecording();
            keybindings = { ...defaultKeybindings };
            localStorage.setItem('tcs-ipa-quiz-keybindings', JSON.stringify(keybindings));
            initKeybindingsUI();
            loadQuestion(currentIndex);
        });
    }

    // Global keyboard listener to answer questions
    document.addEventListener('keydown', (e) => {
        // Ignore key presses if user is inside input, textarea, or select elements
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        // Ignore if Settings modal is open
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            return;
        }

        const pressedKey = e.key.toLowerCase();

        // Find which option ID matches this pressed key
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
});
