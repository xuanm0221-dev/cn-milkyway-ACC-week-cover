"""
JSON 파일에서 2023년 데이터 제거 스크립트
스크립트가 있는 디렉토리 기준으로 실행
"""

import json
import os
from pathlib import Path

def remove_2023_from_json(file_path: Path):
    """JSON 파일에서 2023년 데이터 제거"""
    if not file_path.exists():
        print(f"파일을 찾을 수 없습니다: {file_path}")
        return
    
    print(f"처리 중: {file_path.name}")
    
    # JSON 파일 읽기
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    removed_count = 0
    
    # 각 중분류별로 처리
    for category in data:
        category_data = data[category]
        
        # 연도별 데이터에서 2023 제거
        if "2023" in category_data:
            del category_data["2023"]
            removed_count += 1
            print(f"  - {category}: 2023년 데이터 제거됨")
        
        # 소분류 처리
        if "소분류" in category_data:
            for sub_category in category_data["소분류"]:
                sub_data = category_data["소분류"][sub_category]
                if "2023" in sub_data:
                    del sub_data["2023"]
                    removed_count += 1
                    print(f"  - {category}/소분류/{sub_category}: 2023년 데이터 제거됨")
    
    if removed_count > 0:
        # JSON 파일 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"완료: {file_path.name} (제거된 항목: {removed_count}개)\n")
    else:
        print(f"완료: {file_path.name} (2023년 데이터 없음)\n")

# 스크립트가 있는 디렉토리 기준으로 경로 설정
script_dir = Path(__file__).parent.resolve()

# 처리할 파일 목록
files_to_process = [
    script_dir / "public" / "data" / "stock_weeks_MLB.json",
    script_dir / "public" / "data" / "stock_weeks_MLB_KIDS.json",
    script_dir / "public" / "data" / "stock_weeks_DISCOVERY.json",
]

print("=" * 60)
print("2023년 데이터 제거 스크립트")
print("=" * 60)
print(f"작업 디렉토리: {script_dir}\n")

# 각 파일 처리
for file_path in files_to_process:
    remove_2023_from_json(file_path)

print("=" * 60)
print("모든 파일 처리 완료!")
print("=" * 60)
