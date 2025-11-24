"""
2025년 5월 대리상재고 원본 데이터 확인 스크립트
"""

import pandas as pd
from pathlib import Path

# 파일 경로
AGENCY_STOCK_PATH = Path(r"C:\2.대시보드(파일)\재고주수\대리상재고")
file_path = AGENCY_STOCK_PATH / "2025.05.csv"

if not file_path.exists():
    print(f"파일을 찾을 수 없습니다: {file_path}")
    exit(1)

print("=" * 80)
print("2025년 5월 대리상재고 원본 데이터 확인")
print("=" * 80)

# 필요한 컬럼만 읽기
usecols = [
    "Channel 2",
    "产品品牌",
    "产品大分类",
    "产品中分类",
    "本地小分类",
    "预计库存金额"
]

# 샘플 데이터 읽기 (처음 1000행)
df_sample = pd.read_csv(file_path, nrows=1000, encoding='utf-8-sig', usecols=usecols)

print(f"\n전체 샘플 데이터 행 수: {len(df_sample)}")
print(f"\n컬럼 정보:")
print(df_sample.dtypes)

# MLB, Shoes, SH 필터링
df_filtered = df_sample[
    (df_sample["Channel 2"] == "FRS") &
    (df_sample["产品品牌"] == "MLB") &
    (df_sample["产品大分类"] == "饰品") &
    (df_sample["产品中分类"] == "Shoes")
].copy()

print(f"\nMLB + Shoes 필터링 후 행 수: {len(df_filtered)}")

if len(df_filtered) > 0:
    print(f"\n중분류 값들:")
    print(df_filtered["产品中分类"].value_counts())
    
    print(f"\n소분류 값들:")
    print(df_filtered["本地小分类"].value_counts())
    
    # SH 소분류만 필터링
    df_sh = df_filtered[df_filtered["本地小分类"] == "SH"].copy()
    print(f"\nSH 소분류 행 수: {len(df_sh)}")
    
    if len(df_sh) > 0:
        print(f"\nSH 소분류 '预计库存金额' 샘플 (처음 20개):")
        print(df_sh[["本地小分类", "预计库存金额"]].head(20))
        
        print(f"\n'预计库存金额' 데이터 타입: {df_sh['预计库存金额'].dtype}")
        print(f"\n'预计库存金额' 고유값 샘플:")
        print(df_sh["预计库存金额"].unique()[:20])
        
        # 숫자 변환 시도
        df_sh["재고금액_변환"] = pd.to_numeric(df_sh["预计库存金额"], errors='coerce')
        print(f"\n변환 후 NaN 개수: {df_sh['재고금액_변환'].isna().sum()}")
        print(f"\n변환 후 통계:")
        print(df_sh["재고금액_변환"].describe())
        
        # 비정상적으로 큰 값 확인
        large_values = df_sh[df_sh["재고금액_변환"] > 1_000_000_000]  # 10억 이상
        print(f"\n10억 이상인 값 개수: {len(large_values)}")
        if len(large_values) > 0:
            print("\n비정상적으로 큰 값들:")
            print(large_values[["本地小分类", "预计库存金额", "재고금액_변환"]].head(10))

# 전체 파일에서 집계 확인 (청크로)
print("\n" + "=" * 80)
print("전체 파일 청크 기반 집계 확인")
print("=" * 80)

chunks = []
chunk_size = 100_000
total_rows = 0

for chunk in pd.read_csv(file_path, chunksize=chunk_size, encoding='utf-8-sig', usecols=usecols):
    chunk_filtered = chunk[
        (chunk["Channel 2"] == "FRS") &
        (chunk["产品品牌"] == "MLB") &
        (chunk["产品大分类"] == "饰品") &
        (chunk["产品中分类"] == "Shoes") &
        (chunk["本地小分类"] == "SH")
    ].copy()
    
    if len(chunk_filtered) > 0:
        chunk_filtered["재고금액"] = pd.to_numeric(chunk_filtered["预计库存金额"], errors='coerce').fillna(0)
        chunks.append(chunk_filtered)
        total_rows += len(chunk_filtered)

if chunks:
    df_all = pd.concat(chunks, ignore_index=True)
    print(f"\n전체 파일에서 MLB + Shoes + SH 행 수: {total_rows}")
    print(f"\n재고금액 합계: {df_all['재고금액'].sum():,.0f}원")
    print(f"\n재고금액 통계:")
    print(df_all["재고금액"].describe())
    
    # 비정상적으로 큰 값 확인
    large_values = df_all[df_all["재고금액"] > 1_000_000_000]
    print(f"\n10억 이상인 값 개수: {len(large_values)}")
    if len(large_values) > 0:
        print("\n비정상적으로 큰 값 샘플:")
        print(large_values[["本地小分类", "预计库存金额", "재고금액"]].head(10))







