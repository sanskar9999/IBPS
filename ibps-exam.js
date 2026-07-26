document.addEventListener('DOMContentLoaded', () => {
    // UI Screens
    const introScreen = document.getElementById('intro-screen');
    const testScreen = document.getElementById('test-screen');
    const reportScreen = document.getElementById('report-screen');

    // Mode selection cards & elements
    const cardModeSim = document.getElementById('card-mode-sim');
    const cardModePyq = document.getElementById('card-mode-pyq');
    const pyqYearSelect = document.getElementById('pyq-year-select');
    const btnStartMock = document.getElementById('btn-start-mock');
    const btnNewMock = document.getElementById('btn-new-mock');

    // Live Exam elements
    const liveExamTitle = document.getElementById('live-exam-title');
    const qCounterTag = document.getElementById('q-counter-tag');
    const timerDisplay = document.getElementById('timer-display');
    const sectionTabsContainer = document.getElementById('section-tabs-container');
    const testPassageCard = document.getElementById('test-passage-card');
    const testPassageText = document.getElementById('test-passage-text');
    const testPassageImageBox = document.getElementById('test-passage-image-box');
    const testPassageImg = document.getElementById('test-passage-img');
    const testQuestionCategory = document.getElementById('test-question-category');
    const testQuestionText = document.getElementById('test-question-text');
    const testOptionsContainer = document.getElementById('test-options-container');
    const questionPalette = document.getElementById('question-palette');
    const btnFinalSubmit = document.getElementById('btn-final-submit');

    // Action buttons
    const btnTestPrev = document.getElementById('btn-test-prev');
    const btnTestClear = document.getElementById('btn-test-clear');
    const btnTestReview = document.getElementById('btn-test-review');
    const btnTestSave = document.getElementById('btn-test-save');

    // Report elements
    const reportTotalScore = document.getElementById('report-total-score');
    const reportStatusBadge = document.getElementById('report-status-badge');
    const reportTbody = document.getElementById('report-tbody');
    const reportSolutionsContainer = document.getElementById('report-solutions-container');

    // App State
    let selectedMode = 'simulation'; // 'simulation' or 'pyq'
    let examData = []; // Array of section objects: { id, title, timer, timeRemaining, maxMarks, posMark, negMark, questions: [] }
    let currentSectionIdx = 0;
    let currentQuestionIdx = 0;
    let timerInterval = null;
    let isCompositeTimer = false;
    let compositeTimeRemaining = 0;

    // Mode Selector listeners
    if (cardModeSim && cardModePyq) {
        cardModeSim.addEventListener('click', () => {
            selectedMode = 'simulation';
            cardModeSim.classList.add('selected');
            cardModePyq.classList.remove('selected');
        });

        cardModePyq.addEventListener('click', () => {
            selectedMode = 'pyq';
            cardModePyq.classList.add('selected');
            cardModeSim.classList.remove('selected');
        });
    }

    // Helper: Randomly sample N items from array
    function sampleQuestions(array, n) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n).map(q => ({
            ...q,
            selectedOption: null,
            visited: false,
            markedForReview: false
        }));
    }

    function buildExamData() {
        if (typeof ibpsQuestionsData === 'undefined') {
            alert('Error: ibps-questions.js data not loaded!');
            return [];
        }

        if (selectedMode === 'simulation') {
            // Collect pools across all PYQs
            let engPool = [], reaPool = [], quantPool = [], pkPool = [...(ibpsQuestionsData.pkIT || [])];
            (ibpsQuestionsData.papers || []).forEach(p => {
                p.questions.forEach(q => {
                    if (q.section === 'English Language') engPool.push(q);
                    else if (q.section === 'Reasoning Ability') reaPool.push(q);
                    else if (q.section === 'Quantitative Aptitude') quantPool.push(q);
                });
            });

            isCompositeTimer = false;
            return [
                {
                    id: 'eng',
                    title: 'English Language',
                    timeRemaining: 20 * 60,
                    posMark: 1,
                    negMark: 0.25,
                    maxMarks: 25,
                    questions: sampleQuestions(engPool, 25)
                },
                {
                    id: 'rea',
                    title: 'Reasoning Ability',
                    timeRemaining: 20 * 60,
                    posMark: 1,
                    negMark: 0.25,
                    maxMarks: 25,
                    questions: sampleQuestions(reaPool, 25)
                },
                {
                    id: 'quant',
                    title: 'Quantitative Aptitude',
                    timeRemaining: 20 * 60,
                    posMark: 1,
                    negMark: 0.25,
                    maxMarks: 25,
                    questions: sampleQuestions(quantPool, 25)
                },
                {
                    id: 'pk',
                    title: 'Professional Knowledge (IT)',
                    timeRemaining: 20 * 60,
                    posMark: 2,
                    negMark: 0.50,
                    maxMarks: 50,
                    questions: sampleQuestions(pkPool, 25)
                }
            ];
        } else {
            // Full PYQ Paper mode
            const yearSel = pyqYearSelect ? pyqYearSelect.value : '2025';
            isCompositeTimer = true;
            compositeTimeRemaining = 120 * 60; // 2 hours composite timer

            if (yearSel === 'pkIT') {
                const allPk = (ibpsQuestionsData.pkIT || []).map(q => ({
                    ...q,
                    selectedOption: null,
                    visited: false,
                    markedForReview: false
                }));
                return [{
                    id: 'pk-full',
                    title: 'Professional Knowledge (IT Officer Bank - Full)',
                    timeRemaining: compositeTimeRemaining,
                    posMark: 2,
                    negMark: 0.50,
                    maxMarks: allPk.length * 2,
                    questions: allPk
                }];
            } else {
                const paper = (ibpsQuestionsData.papers || []).find(p => String(p.id) === String(yearSel));
                if (!paper) return [];

                let engQs = [], reaQs = [], quantQs = [];
                paper.questions.forEach(q => {
                    const qObj = { ...q, selectedOption: null, visited: false, markedForReview: false };
                    if (q.section === 'English Language') engQs.push(qObj);
                    else if (q.section === 'Reasoning Ability') reaQs.push(qObj);
                    else quantQs.push(qObj);
                });

                return [
                    { id: 'eng', title: 'English Language', posMark: 1, negMark: 0.25, maxMarks: engQs.length, questions: engQs },
                    { id: 'rea', title: 'Reasoning Ability', posMark: 1, negMark: 0.25, maxMarks: reaQs.length, questions: reaQs },
                    { id: 'quant', title: 'Quantitative Aptitude', posMark: 1, negMark: 0.25, maxMarks: quantQs.length, questions: quantQs }
                ];
            }
        }
    }

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (isCompositeTimer) {
                compositeTimeRemaining--;
                timerDisplay.textContent = formatTime(compositeTimeRemaining);
                if (compositeTimeRemaining <= 0) {
                    clearInterval(timerInterval);
                    alert("Examination time has expired! Submitting your responses automatically.");
                    finishExam();
                }
            } else {
                const currentSec = examData[currentSectionIdx];
                currentSec.timeRemaining--;
                timerDisplay.textContent = formatTime(currentSec.timeRemaining);

                if (currentSec.timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    alert(`Section Time Expired for [${currentSec.title}]! Moving to next section.`);
                    if (currentSectionIdx < examData.length - 1) {
                        currentSectionIdx++;
                        currentQuestionIdx = 0;
                        renderSectionTabs();
                        loadCurrentQuestion();
                        startTimer();
                    } else {
                        alert("All sectional times have expired! Submitting your exam automatically.");
                        finishExam();
                    }
                }
            }
        }, 1000);
    }

    function renderSectionTabs() {
        sectionTabsContainer.innerHTML = '';
        examData.forEach((sec, idx) => {
            const btn = document.createElement('button');
            btn.className = 'section-tab-btn';
            if (idx === currentSectionIdx) btn.classList.add('active');
            
            // In sectional timing mode, disable non-active tabs to prevent unauthorized switching
            if (!isCompositeTimer && idx !== currentSectionIdx) {
                btn.classList.add('disabled');
                btn.title = idx < currentSectionIdx ? "Section completed and locked" : "Section locked until current timer finishes";
            }

            btn.textContent = `${sec.title} (${sec.questions.length}Q)`;
            btn.addEventListener('click', () => {
                if (!isCompositeTimer && idx !== currentSectionIdx) {
                    alert("Sectional timing is enforced in Real Simulation mode. You can only attempt the currently active section!");
                    return;
                }
                currentSectionIdx = idx;
                currentQuestionIdx = 0;
                renderSectionTabs();
                loadCurrentQuestion();
            });
            sectionTabsContainer.appendChild(btn);
        });
    }

    function updateQuestionPalette() {
        if (!questionPalette) return;
        questionPalette.innerHTML = '';
        const currentSec = examData[currentSectionIdx];
        
        currentSec.questions.forEach((q, idx) => {
            const btn = document.createElement('button');
            btn.className = 'pal-btn';
            btn.textContent = idx + 1;
            
            if (idx === currentQuestionIdx) {
                btn.classList.add('current');
            }

            if (q.markedForReview && q.selectedOption) {
                btn.classList.add('review-answered');
            } else if (q.markedForReview) {
                btn.classList.add('review');
            } else if (q.selectedOption) {
                btn.classList.add('answered');
            } else if (q.visited) {
                btn.classList.add('unanswered');
            }

            btn.addEventListener('click', () => {
                currentQuestionIdx = idx;
                loadCurrentQuestion();
            });
            questionPalette.appendChild(btn);
        });
    }

    function escapeHTML(text) {
        if (!text) return "";
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function loadCurrentQuestion() {
        const currentSec = examData[currentSectionIdx];
        const q = currentSec.questions[currentQuestionIdx];
        q.visited = true;

        if (qCounterTag) qCounterTag.textContent = `Q ${currentQuestionIdx + 1}/${currentSec.questions.length}`;
        if (testQuestionCategory) {
            testQuestionCategory.textContent = q.category || currentSec.title;
            testQuestionCategory.className = "question-category";
            const catClass = "cat-" + currentSec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            testQuestionCategory.classList.add(catClass);
        }
        
        // Render Passage & Diagram
        if (testPassageCard) {
            if (q.direction || q.directionImage) {
                testPassageCard.classList.remove('hidden');
                if (testPassageText) testPassageText.textContent = q.direction || "";
                if (testPassageImageBox && testPassageImg) {
                    if (q.directionImage) {
                        testPassageImg.src = q.directionImage;
                        testPassageImageBox.classList.remove('hidden');
                    } else {
                        testPassageImageBox.classList.add('hidden');
                    }
                }
            } else {
                testPassageCard.classList.add('hidden');
            }
        }

        if (testQuestionText) testQuestionText.innerHTML = escapeHTML(q.question);
        
        // Render 5 Options
        if (testOptionsContainer) {
            testOptionsContainer.innerHTML = '';
            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                if (q.selectedOption === opt.id) {
                    btn.style.borderColor = '#3b82f6';
                    btn.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                    btn.style.fontWeight = '700';
                }

                const letterSpan = document.createElement('span');
                letterSpan.className = 'option-letter';
                letterSpan.textContent = opt.id;

                btn.appendChild(letterSpan);
                btn.appendChild(document.createTextNode(` ${opt.text}`));

                btn.addEventListener('click', () => {
                    q.selectedOption = opt.id;
                    loadCurrentQuestion();
                });
                testOptionsContainer.appendChild(btn);
            });
        }

        // Nav button states
        if (btnTestPrev) btnTestPrev.disabled = (currentQuestionIdx === 0 && currentSectionIdx === 0);
        updateQuestionPalette();
    }

    // Navigation button handlers
    if (btnTestSave) {
        btnTestSave.addEventListener('click', () => {
            const currentSec = examData[currentSectionIdx];
            const q = currentSec.questions[currentQuestionIdx];
            q.markedForReview = false; // Save clears simple review state
            
            if (currentQuestionIdx < currentSec.questions.length - 1) {
                currentQuestionIdx++;
                loadCurrentQuestion();
            } else if (isCompositeTimer && currentSectionIdx < examData.length - 1) {
                currentSectionIdx++;
                currentQuestionIdx = 0;
                renderSectionTabs();
                loadCurrentQuestion();
            } else {
                updateQuestionPalette();
            }
        });
    }

    if (btnTestReview) {
        btnTestReview.addEventListener('click', () => {
            const currentSec = examData[currentSectionIdx];
            const q = currentSec.questions[currentQuestionIdx];
            q.markedForReview = !q.markedForReview;
            
            if (currentQuestionIdx < currentSec.questions.length - 1) {
                currentQuestionIdx++;
                loadCurrentQuestion();
            } else {
                updateQuestionPalette();
            }
        });
    }

    if (btnTestClear) {
        btnTestClear.addEventListener('click', () => {
            const currentSec = examData[currentSectionIdx];
            const q = currentSec.questions[currentQuestionIdx];
            q.selectedOption = null;
            loadCurrentQuestion();
        });
    }

    if (btnTestPrev) {
        btnTestPrev.addEventListener('click', () => {
            if (currentQuestionIdx > 0) {
                currentQuestionIdx--;
                loadCurrentQuestion();
            } else if (isCompositeTimer && currentSectionIdx > 0) {
                currentSectionIdx--;
                currentQuestionIdx = examData[currentSectionIdx].questions.length - 1;
                renderSectionTabs();
                loadCurrentQuestion();
            }
        });
    }

    if (btnFinalSubmit) {
        btnFinalSubmit.addEventListener('click', () => {
            if (confirm("Are you sure you want to final submit your examination? Any remaining time will be forfeited.")) {
                finishExam();
            }
        });
    }

    function finishExam() {
        if (timerInterval) clearInterval(timerInterval);
        testScreen.classList.add('hidden');
        reportScreen.classList.remove('hidden');

        let totalScore = 0;
        let totalMaxMarks = 0;
        reportTbody.innerHTML = '';
        reportSolutionsContainer.innerHTML = '';

        examData.forEach(sec => {
            let attempted = 0, correct = 0, wrong = 0;
            
            sec.questions.forEach(q => {
                if (q.selectedOption) {
                    attempted++;
                    if (q.selectedOption === q.answer) correct++;
                    else wrong++;
                }
            });

            const netScore = (correct * sec.posMark) - (wrong * sec.negMark);
            totalScore += netScore;
            totalMaxMarks += sec.maxMarks;
            const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) + '%' : '0.0%';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 700; text-align: left;">${sec.title}</td>
                <td>${sec.questions.length}</td>
                <td>${attempted}</td>
                <td style="color: #10b981; font-weight: 700;">${correct}</td>
                <td style="color: #ef4444; font-weight: 700;">${wrong}</td>
                <td style="font-weight: 800; color: #3b82f6;">${netScore.toFixed(2)}</td>
                <td>${accuracy}</td>
            `;
            reportTbody.appendChild(tr);
        });

        reportTotalScore.textContent = `${Math.max(0, totalScore).toFixed(2)} / ${totalMaxMarks.toFixed(2)}`;

        // Cutoff evaluation
        if (selectedMode === 'simulation') {
            const estimatedCutoff = 65.00;
            if (totalScore >= estimatedCutoff) {
                reportStatusBadge.textContent = `✅ ESTIMATED CUTOFF QUALIFIED (Target >= ${estimatedCutoff})`;
                reportStatusBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                reportStatusBadge.style.color = '#10b981';
            } else {
                reportStatusBadge.textContent = `❌ ESTIMATED CUTOFF NOT MET (Target >= ${estimatedCutoff})`;
                reportStatusBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                reportStatusBadge.style.color = '#ef4444';
            }
        } else {
            reportStatusBadge.textContent = `📚 PRACTICE PAPER ATTEMPT COMPLETED`;
            reportStatusBadge.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            reportStatusBadge.style.color = '#3b82f6';
        }

        // Render Question Walkthrough Cards
        examData.forEach((sec, sIdx) => {
            sec.questions.forEach((q, qIdx) => {
                const card = document.createElement('div');
                card.style.cssText = "background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 12px; padding: 24px;";

                let userAnsText = "Not Attempted";
                let badgeColor = "#64748b";
                if (q.selectedOption) {
                    if (q.selectedOption === q.answer) {
                        userAnsText = `Correct (Option ${q.selectedOption})`;
                        badgeColor = "#10b981";
                    } else {
                        userAnsText = `Wrong (Your Option: ${q.selectedOption}, Correct: Option ${q.answer})`;
                        badgeColor = "#ef4444";
                    }
                }

                let passageHTML = "";
                if (q.direction || q.directionImage) {
                    passageHTML = `
                        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #10b981;">
                            ${q.direction ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">${escapeHTML(q.direction)}</div>` : ''}
                            ${q.directionImage ? `<img src="${q.directionImage}" style="max-height: 250px; border-radius: 4px; display: block;" alt="DI">` : ''}
                        </div>
                    `;
                }

                let optionsHTML = q.options.map(o => {
                    let optStyle = "padding: 8px 12px; border-radius: 6px; margin: 4px 0; border: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;";
                    if (o.id === q.answer) optStyle += "background: rgba(16, 185, 129, 0.2); border-color: #10b981; font-weight: 700; color: #10b981;";
                    else if (o.id === q.selectedOption) optStyle += "background: rgba(239, 68, 68, 0.2); border-color: #ef4444; text-decoration: line-through; color: #f87171;";
                    return `<div style="${optStyle}"><strong>(${o.id})</strong> ${escapeHTML(o.text)}</div>`;
                }).join('');

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">${sec.title} — Question ${qIdx + 1}</span>
                        <span style="background: ${badgeColor}; color: #fff; font-size: 0.8rem; font-weight: 700; padding: 4px 12px; border-radius: 20px;">${userAnsText}</span>
                    </div>
                    ${passageHTML}
                    <div style="font-size: 1.05rem; font-weight: 600; margin-bottom: 16px; color: #fff;">${escapeHTML(q.question)}</div>
                    <div>${optionsHTML}</div>
                    <div style="margin-top: 16px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 6px;">
                        <div style="font-weight: 700; font-size: 0.85rem; color: #60a5fa; margin-bottom: 4px;">💡 Solution & Explanation</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">${escapeHTML(q.explanation || "No explanation provided.")}</div>
                    </div>
                `;
                reportSolutionsContainer.appendChild(card);
            });
        });
    }

    if (btnStartMock) {
        btnStartMock.addEventListener('click', () => {
            examData = buildExamData();
            if (!examData || examData.length === 0) return;
            currentSectionIdx = 0;
            currentQuestionIdx = 0;

            if (liveExamTitle) {
                liveExamTitle.textContent = selectedMode === 'simulation' ? "CRP-SPL-XVI Prelims Simulation" : `Full PYQ Practice (${pyqYearSelect ? pyqYearSelect.value : ''})`;
            }

            introScreen.classList.add('hidden');
            reportScreen.classList.add('hidden');
            testScreen.classList.remove('hidden');

            renderSectionTabs();
            loadCurrentQuestion();
            startTimer();
        });
    }

    if (btnNewMock) {
        btnNewMock.addEventListener('click', () => {
            reportScreen.classList.add('hidden');
            testScreen.classList.add('hidden');
            introScreen.classList.remove('hidden');
        });
    }
});
