# IBPS Specialist Officer (IT Officer) CRP-SPL-XVI Preparation Portal & Exam Simulator

An interactive, high-performance web application for preparing for the **IBPS Specialist Officer (IT Officer) CRP-SPL-XVI Preliminary Examination**.

Live Website: **[https://sanskar9999.github.io/IBPS/](https://sanskar9999.github.io/IBPS/)**

---

## 🌟 Key Features

1. **Authentic Previous Year Papers (2021 – 2025)**:
   - **598 General Prelims Questions**: Extracted from Memory-Based papers (2025 30th Aug Shift 1, 2024 09 Nov Shift 1, 2023, and 2021).
   - **356 Professional Knowledge (IT Officer) Questions**: Structured into 7 core computer science domains (DBMS, Networking, Operating Systems, Computer Architecture, Artificial Intelligence, System Software, and Peripherals).

2. **Data Interpretation (DI) Chart & Diagram Integration**:
   - Automatically extracted **171 high-resolution chart and diagram images** embedded directly into questions and passage cards with hover-zoom support.

3. **Practice Portal (`index.html`)**:
   - **Dynamic Subject & Year Filtering**: Practice by specific exam years or core CS topics.
   - **5-Option MCQ Interface**: Native support for options (A, B, C, D, E) with instant feedback and detailed explanations.
   - **Keyboard Shortcuts**: Select options using keys `1`, `2`, `3`, `4`, `5` or custom keybindings.
   - **Themes**: Classic Blue, Light Mode, and AMOLED Dark modes.

4. **Real Exam Simulator (`ibps-exam.html`)**:
   - **CRP-SPL-XVI Real Simulation**: 100 Questions | 125 Maximum Marks | 80 Minutes total duration with 20-minute strict **Sectional Timers**.
   - **Sectional Breakdown**:
     - English Language: 25 Qs | 25 Marks (+1 / -0.25)
     - Reasoning Ability: 25 Qs | 25 Marks (+1 / -0.25)
     - Quantitative Aptitude: 25 Qs | 25 Marks (+1 / -0.25)
     - Professional Knowledge (IT): 25 Qs | 50 Marks (+2 / -0.50)
   - **Banking Question Palette**: Interactive palette tracking *Answered*, *Not Answered*, *Marked for Review*, and *Answered & Marked for Review*.
   - **Scorecard & Detailed Walkthrough**: Instant section-wise breakdown, cutoff qualification status, and full solution walkthroughs.

---

## 📁 Repository Structure

```
├── index.html                 # Practice portal homepage
├── app.js                     # Practice portal interactive logic
├── style.css                  # Modern glassmorphism design system & theme variables
├── ibps-exam.html             # Online banking test simulator interface
├── ibps-exam.js               # Exam simulator engine & timer logic
├── ibps-questions.js          # Complete IBPS dataset (950+ Qs)
├── ibps-images/               # Extracted DI charts and graph diagrams
├── extract_ibps.py            # PDF data & image parsing pipeline script
├── verify_ibps_data.py        # Automated dataset verification test suite
└── test_exam_simulation.py    # Automated simulation & scoring test suite
```

---

## 🧪 Automated Testing

Run the automated test scripts to verify data integrity and simulation math:

```bash
python verify_ibps_data.py
python test_exam_simulation.py
```
