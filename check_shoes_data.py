"""
2025년 5월 슈즈 대리상 재고 데이터 확인 스크립트
"""

import json
from pathlib import Path

# JSON 파일 읽기
json_path = Path("public/data/stock_weeks_MLB.json")
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 2025년 5월 슈즈 중분류 데이터
shoes_2025_5 = data.get("Shoes", {}).get("2025", {}).get("5", {})

print("=" * 60)
print("2025년 5월 슈즈 중분류 데이터")
print("=" * 60)
print(json.dumps(shoes_2025_5, indent=2, ensure_ascii=False))

# 소분류 목록 확인
shoes_sub = data.get("Shoes", {}).get("소분류", {})
print("\n" + "=" * 60)
print("소분류 목록")
print("=" * 60)
print(list(shoes_sub.keys()))

# SH 소분류 2025년 5월 데이터
if "SH" in shoes_sub:
    sh_2025_5 = shoes_sub.get("SH", {}).get("2025", {}).get("5", {})
    print("\n" + "=" * 60)
    print("2025년 5월 SH 소분류 데이터")
    print("=" * 60)
    print(json.dumps(sh_2025_5, indent=2, ensure_ascii=False))
    
    # SH 소분류의 기초데이터 확인
    if "기초데이터" in sh_2025_5:
        base_data = sh_2025_5["기초데이터"]
        print("\n" + "=" * 60)
        print("SH 소분류 기초데이터 (2025년 5월)")
        print("=" * 60)
        print(f"대리상재고금액: {base_data.get('대리상재고금액', 0):,.0f}")
        print(f"대리상판매금액: {base_data.get('대리상판매금액', 0):,.0f}")
        print(f"대리상재고주수: {sh_2025_5.get('대리상재고주수', 'N/A')}")
else:
    print("\nSH 소분류를 찾을 수 없습니다.")

# 중분류 기초데이터 확인
if "기초데이터" in shoes_2025_5:
    base_data = shoes_2025_5["기초데이터"]
    print("\n" + "=" * 60)
    print("슈즈 중분류 기초데이터 (2025년 5월)")
    print("=" * 60)
    print(f"대리상재고금액: {base_data.get('대리상재고금액', 0):,.0f}")
    print(f"대리상판매금액: {base_data.get('대리상판매금액', 0):,.0f}")
    print(f"대리상재고주수: {shoes_2025_5.get('대리상재고주수', 'N/A')}")







