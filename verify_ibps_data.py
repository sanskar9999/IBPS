import os
import json
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JS_FILE = os.path.join(BASE_DIR, "ibps-questions.js")

PLACEHOLDER_MARKERS = [
    "Option A (Verified)", "Option B (Verified)", "Option C (Verified)",
    "Option D (Verified)", "Option E (Verified)",
    "Refer to general CS/Exam reasoning standards.",
    "TODO", "lorem ipsum", "placeholder",
]


def is_placeholder(text):
    if not text:
        return True
    return any(marker in text for marker in PLACEHOLDER_MARKERS)


def check_answer_distribution(questions, label):
    """Flag lopsided answer keys (e.g. one letter marks > 60% of a paper)."""
    counts = Counter(q["answer"] for q in questions)
    n = len(questions)
    worst = counts.most_common(1)[0]
    warnings = []
    if n and worst[1] / n > 0.60:
        warnings.append(f"{label}: suspiciously lopsided answer key - {worst[0]} marks {worst[1]}/{n} ({100.0 * worst[1] / n:.1f}%)")
    for letter, c in sorted(counts.items()):
        if c / n > 0.60:
            warnings.append(f"{label}: {letter} = {c}/{n} ({100.0 * c / n:.1f}%)")
    return warnings

def run_tests():
    print("=== RUNNING AUTOMATED CODE-BASED VERIFICATION TESTS ===")
    
    # Test 1: Check File Existence & Size
    assert os.path.exists(JS_FILE), f"ERROR: {JS_FILE} does not exist!"
    file_size = os.path.getsize(JS_FILE)
    print(f"[TEST 1 PASSED] ibps-questions.js exists (Size: {file_size / 1024:.2f} KB)")
    
    # Test 2: Parse JS as JSON structure
    with open(JS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    prefix = "const ibpsQuestionsData = "
    assert content.startswith(prefix), "ERROR: File does not start with expected JS variable declaration!"
    
    json_str = content[len(prefix):].split(";\n\nif (typeof module")[0]
    data = json.loads(json_str)
    print("[TEST 2 PASSED] Valid JSON syntax within JavaScript declaration.")
    
    # Test 3: Validate Papers and Question Integrity
    papers = data["papers"]
    assert len(papers) == 4, f"ERROR: Expected 4 papers, found {len(papers)}"
    
    total_general = 0
    images_referenced = 0
    all_warnings = []
    for p in papers:
        qs = p["questions"]
        print(f"  -> Validating Paper [{p['id']}] ({len(qs)} questions)...")
        assert len(qs) >= 140, f"ERROR: Paper {p['id']} has dangerously few questions ({len(qs)})"
        ph_count = 0
        for q in qs:
            assert q["question"].strip(), f"ERROR: Empty question text in {q['id']}"
            assert len(q["options"]) >= 3, f"ERROR: Too few options ({len(q['options'])}) in {q['id']}"
            assert any(o["isCorrect"] for o in q["options"]), f"ERROR: No correct option marked for {q['id']}"
            assert q["answer"] in [o["id"] for o in q["options"]], f"ERROR: Answer {q['answer']} not in option IDs for {q['id']}"
            assert sum(1 for o in q["options"] if o["isCorrect"]) == 1, f"ERROR: Multiple correct options in {q['id']}"
            for o in q["options"]:
                assert o["text"].strip(), f"ERROR: Empty option text in {q['id']}"
                assert o["isCorrect"] == (o["id"] == q["answer"]), f"ERROR: isCorrect mismatch in {q['id']}"
            if is_placeholder(q["explanation"]):
                ph_count += 1
            if q["directionImage"]:
                img_full_path = os.path.join(BASE_DIR, q["directionImage"])
                assert os.path.exists(img_full_path), f"ERROR: Image {q['directionImage']} does not exist on disk!"
                images_referenced += 1
        total_general += len(qs)
        if ph_count:
            all_warnings.append(f"Paper {p['id']}: {ph_count} questions still carry placeholder explanations")
        all_warnings.extend(check_answer_distribution(qs, f"Paper {p['id']}"))

    print(f"[TEST 3 PASSED] General Papers validated: {total_general} total questions, {images_referenced} diagram references confirmed.")

    # Test 4: Validate Professional Knowledge (IT) Bank
    pk = data["pkIT"]
    print(f"  -> Validating Professional Knowledge (IT) Bank ({len(pk)} questions)...")
    assert len(pk) >= 300, f"ERROR: Expected >= 300 PK IT questions, found {len(pk)}"

    categories = set()
    for q in pk:
        assert q["question"].strip(), f"ERROR: Empty Q text in {q['id']}"
        assert len(q["options"]) >= 3, f"ERROR: Options count < 3 in {q['id']}"
        assert any(o["isCorrect"] for o in q["options"]), f"ERROR: No correct option in {q['id']}"
        assert sum(1 for o in q["options"] if o["isCorrect"]) == 1, f"ERROR: Multiple correct options in {q['id']}"
        assert q["answer"] in [o["id"] for o in q["options"]], f"ERROR: Answer {q['answer']} not in option IDs for {q['id']}"
        for o in q["options"]:
            assert o["isCorrect"] == (o["id"] == q["answer"]), f"ERROR: isCorrect mismatch in {q['id']}"
            assert o["text"].strip(), f"ERROR: Empty option text in {q['id']}"
        assert q["section"] == "Professional Knowledge (IT)", f"ERROR: Incorrect section tag in {q['id']}"
        assert not is_placeholder(q["explanation"]), f"ERROR: Placeholder explanation in {q['id']}: {q['explanation'][:50]}"
        categories.add(q.get("category", "Uncategorized"))

    print(f"[TEST 4 PASSED] PK IT Bank verified. Categories covered: {', '.join(sorted(categories))}")

    if all_warnings:
        print("\n--- VERIFICATION WARNINGS (non-fatal) ---")
        for w in all_warnings:
            print(f"  [!] {w}")

    print("\nALL AUTOMATED DATA VERIFICATION TESTS PASSED SUCCESSFULLY! ✅")

if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED EXCEPTION: {str(e)}")
        sys.exit(1)
