import os
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"c:\Users\91800\Desktop\TCS IPA\TCS_IPA Practice Website"
JS_FILE = os.path.join(BASE_DIR, "ibps-questions.js")

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
    for p in papers:
        qs = p["questions"]
        print(f"  -> Validating Paper [{p['id']}] ({len(qs)} questions)...")
        assert len(qs) >= 140, f"ERROR: Paper {p['id']} has dangerously few questions ({len(qs)})"
        for q in qs:
            assert q["question"].strip(), f"ERROR: Empty question text in {q['id']}"
            assert len(q["options"]) >= 3, f"ERROR: Too few options ({len(q['options'])}) in {q['id']}"
            assert any(o["isCorrect"] for o in q["options"]), f"ERROR: No correct option marked for {q['id']}"
            assert q["answer"] in [o["id"] for o in q["options"]], f"ERROR: Answer {q['answer']} not in option IDs for {q['id']}"
            if q["directionImage"]:
                img_full_path = os.path.join(BASE_DIR, q["directionImage"])
                assert os.path.exists(img_full_path), f"ERROR: Image {q['directionImage']} does not exist on disk!"
                images_referenced += 1
        total_general += len(qs)
        
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
        assert q["section"] == "Professional Knowledge (IT)", f"ERROR: Incorrect section tag in {q['id']}"
        categories.add(q.get("category", "Uncategorized"))
        
    print(f"[TEST 4 PASSED] PK IT Bank verified. Categories covered: {', '.join(sorted(categories))}")
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
