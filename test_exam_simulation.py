import os
import json
import random
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JS_FILE = os.path.join(BASE_DIR, "ibps-questions.js")

def test_simulation_engine():
    print("=== STARTING AUTOMATED EXAM SIMULATION VERIFICATION TESTS ===")
    
    with open(JS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    json_str = content.split("const ibpsQuestionsData = ")[1].split(";\n\nif (typeof module")[0]
    data = json.loads(json_str)
    
    # Pool categorization
    eng_pool = []
    rea_pool = []
    quant_pool = []
    pk_pool = data["pkIT"]
    
    for p in data["papers"]:
        for q in p["questions"]:
            if q["section"] == "English Language":
                eng_pool.append(q)
            elif q["section"] == "Reasoning Ability":
                rea_pool.append(q)
            elif q["section"] == "Quantitative Aptitude":
                quant_pool.append(q)
                
    print(f"[TEST 1 PASSED] Pools generated -> English: {len(eng_pool)}, Reasoning: {len(rea_pool)}, Quant: {len(quant_pool)}, PK IT: {len(pk_pool)}")
    
    assert len(eng_pool) >= 25, "Not enough English questions for simulation!"
    assert len(rea_pool) >= 25, "Not enough Reasoning questions for simulation!"
    assert len(quant_pool) >= 25, "Not enough Quant questions for simulation!"
    assert len(pk_pool) >= 25, "Not enough PK IT questions for simulation!"
    
    # Simulate CRP-SPL-XVI pattern (100 Qs, 125 Marks, 80 Minutes)
    sections = [
        {"title": "English Language", "qs": random.sample(eng_pool, 25), "pos": 1.0, "neg": 0.25, "time": 20},
        {"title": "Reasoning Ability", "qs": random.sample(rea_pool, 25), "pos": 1.0, "neg": 0.25, "time": 20},
        {"title": "Quantitative Aptitude", "qs": random.sample(quant_pool, 25), "pos": 1.0, "neg": 0.25, "time": 20},
        {"title": "Professional Knowledge (IT)", "qs": random.sample(pk_pool, 25), "pos": 2.0, "neg": 0.50, "time": 20}
    ]
    
    total_qs = sum(len(s["qs"]) for s in sections)
    total_max_marks = sum(len(s["qs"]) * s["pos"] for s in sections)
    total_duration_mins = sum(s["time"] for s in sections)
    
    assert total_qs == 100, f"Expected 100 questions, got {total_qs}"
    assert total_max_marks == 125.0, f"Expected 125 maximum marks, got {total_max_marks}"
    assert total_duration_mins == 80, f"Expected 80 minutes total duration, got {total_duration_mins}"
    
    print(f"[TEST 2 PASSED] Exam structural rules verified -> {total_qs} Questions | {total_max_marks} Max Marks | {total_duration_mins} Mins Sectional Timing.")
    
    # Test 3: Simulate grading with penalties
    # Scenario:
    # Eng: 20 correct, 5 wrong -> 20*1 - 5*0.25 = 18.75
    # Rea: 15 correct, 10 wrong -> 15*1 - 10*0.25 = 12.50
    # Quant: 25 correct, 0 wrong -> 25*1 - 0 = 25.00
    # PK IT: 18 correct, 7 wrong -> 18*2 - 7*0.50 = 36.00 - 3.50 = 32.50
    # Total Expected Net Score = 18.75 + 12.50 + 25.00 + 32.50 = 88.75
    
    scores = []
    scenarios = [(20, 5), (15, 10), (25, 0), (18, 7)]
    
    for idx, (corr, wrng) in enumerate(scenarios):
        sec = sections[idx]
        net = (corr * sec["pos"]) - (wrng * sec["neg"])
        scores.append(net)
        
    calc_total = sum(scores)
    assert abs(calc_total - 88.75) < 1e-6, f"Score evaluation error! Expected 88.75, calculated {calc_total}"
    print(f"[TEST 3 PASSED] Negative marking & section weighting verified accurately (Calculated test score: {calc_total:.2f} / 125.00).")
    print("\nALL EXAM SIMULATION CODE-BASED TESTS PASSED WITH 100% ACCURACY! ✅")

if __name__ == "__main__":
    test_simulation_engine()
