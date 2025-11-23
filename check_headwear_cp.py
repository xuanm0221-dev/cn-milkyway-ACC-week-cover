import pandas as pd
from pathlib import Path

BASE_PATH = Path(r"C:\2.대시보드(파일)\재고주수")
AGENCY_STOCK_PATH = BASE_PATH / "대리상재고"

year, month = 2024, 3
file_path = AGENCY_STOCK_PATH / f"{year}.{month:02d}.csv"

df = pd.read_csv(file_path, encoding="utf-8-sig")

# 전처리와 동일한 필터 적용
df = df[df["Channel 2"] == "FRS"].copy()
df = df[df["产品品牌"] == "MLB"].copy()
df = df[df["产品大分类"] == "饰品"].copy()
df = df[df["产品中分类"] == "Headwear"].copy()
df = df[df["本地小分类"] == "CP"].copy()

print("=" * 80)
print(f"2024년 3월 MLB Headwear CP 소분류 대리상재고 데이터")
print("=" * 80)
print(f"\n총 행 수: {len(df)}")
print(f"\n상위 50개 행:")
print(df[["Channel 2","产品品牌","产品大分类","产品中分类","本地小分类","预计库存金额"]].head(50))
print()
print("=" * 80)
print("预计库存金额 통계:")
print("=" * 80)
print(df["预计库存金额"].describe())
print(f"\n최대값: {df['预计库存金额'].max():,.0f}")
print(f"최소값: {df['预计库存金额'].min():,.0f}")
print(f"합계: {df['预计库存金额'].sum():,.0f}")

# 숫자 변환 확인
df["预计库存金额_숫자"] = pd.to_numeric(df["预计库存金额"], errors='coerce')
print(f"\n숫자 변환 후 NaN 개수: {df['预计库存金额_숫자'].isna().sum()}")
print(f"숫자 변환 후 합계: {df['预计库存金额_숫자'].sum():,.0f}")



