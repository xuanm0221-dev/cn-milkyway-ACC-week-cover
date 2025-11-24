"""
운영기준별 재고주수 대시보드 전처리 코드
청크 기반 처리로 메모리 효율성 확보
"""

import pandas as pd
import json
from pathlib import Path
from collections import defaultdict
import calendar


# 파일 경로 설정
BASE_PATH = Path(r"C:\2.대시보드(파일)\재고주수")
AGENCY_STOCK_PATH = BASE_PATH / "대리상재고"
SALES_PATH = BASE_PATH / "판매매출"

# 출력 경로 설정 (스크립트 위치 기준)
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "public" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 분석 대상 브랜드
TARGET_BRANDS = ["MLB", "MLB KIDS", "DISCOVERY"]

# 중분류 매핑
CATEGORY_MAP = {
    "Shoes": "신발",
    "Headwear": "모자",
    "Bag": "가방",
    "Acc_etc": "기타"
}

# 100주 임계값
WEEKS_100_THRESHOLD = 100


def get_days_in_month(year: int, month: int) -> int:
    """월별 일수 반환"""
    return calendar.monthrange(year, month)[1]


def load_stock_by_operation(year: int, month: int, chunk_size: int = 100_000) -> pd.DataFrame:
    """
    대리상재고 파일에서 운영기준별 재고 데이터를 청크 단위로 읽어서 집계
    
    Returns:
        집계된 DataFrame: [year, month, channel, brand, item_category, operation, 재고금액]
    """
    file_path = AGENCY_STOCK_PATH / f"{year}.{month:02d}.csv"
    
    if not file_path.exists():
        return pd.DataFrame(columns=["year", "month", "channel", "brand", "item_category", "operation", "재고금액"])
    
    usecols = [
        "Channel 2",
        "产品品牌",
        "产品大分类",
        "产品中分类",
        "运营基准",
        "预计库存金额",
    ]
    
    chunks: list[pd.DataFrame] = []
    
    for chunk in pd.read_csv(
        file_path,
        chunksize=chunk_size,
        encoding="utf-8-sig",
        usecols=usecols,
        low_memory=False
    ):
        # 1) FRS 또는 OR
        chunk = chunk[chunk["Channel 2"].isin(["FRS", "OR"])].copy()
        # 2) 브랜드
        chunk = chunk[chunk["产品品牌"].isin(TARGET_BRANDS)].copy()
        # 3) 대분류 = 饰品
        chunk = chunk[chunk["产品大分类"] == "饰品"].copy()
        # 4) 중분류 4개
        valid_mid = ["Shoes", "Headwear", "Bag", "Acc_etc"]
        chunk = chunk[chunk["产品中分类"].isin(valid_mid)].copy()
        
        # 5) 운영기준 처리 (NaN을 "运营基准없음"으로 변환)
        chunk["运营基准"] = chunk["运营基准"].fillna("运营基准없음")
        chunk["运营基准"] = chunk["运营基准"].astype(str).str.strip()
        chunk.loc[chunk["运营基准"] == "", "运营基准"] = "运营基准없음"
        chunk.loc[chunk["运营基准"] == "nan", "运营基准"] = "运营基准없음"
        
        # 6) 필요한 컬럼만
        chunk = chunk[["Channel 2", "产品品牌", "产品中分类", "运营基准", "预计库存金额"]].copy()
        chunk.columns = ["channel", "brand", "item_category", "operation", "재고금액"]
        
        # 7) 재고금액 숫자 변환
        chunk["재고금액"] = pd.to_numeric(chunk["재고금액"].astype(str), errors="coerce").fillna(0)
        
        # 8) 그룹 집계
        chunk_agg = (
            chunk.groupby(["channel", "brand", "item_category", "operation"], as_index=False)["재고금액"]
            .sum()
        )
        chunk_agg["year"] = year
        chunk_agg["month"] = month
        
        chunks.append(chunk_agg)
        del chunk
    
    if not chunks:
        return pd.DataFrame(columns=["year", "month", "channel", "brand", "item_category", "operation", "재고금액"])
    
    result = pd.concat(chunks, ignore_index=True)
    result = (
        result.groupby(["year", "month", "channel", "brand", "item_category", "operation"], as_index=False)["재고금액"]
        .sum()
    )
    
    return result


def load_sales_by_operation(year: int, month: int) -> pd.DataFrame:
    """
    판매매출 파일을 청크 단위로 읽어서 운영기준별로 집계
    
    Returns:
        집계된 DataFrame: [year, month, channel, brand, item_category, operation, 판매금액]
    """
    file_path = SALES_PATH / f"{year}.{month:02d}.csv"
    
    if not file_path.exists():
        return pd.DataFrame()
    
    chunks = []
    chunk_size = 100_000
    
    usecols = [
        "Channel 2",
        "产品品牌",
        "产品大分类",
        "产品中分类",
        "运营基准",
        "吊牌金额"
    ]
    
    for chunk in pd.read_csv(
        file_path,
        chunksize=chunk_size,
        encoding='utf-8-sig',
        usecols=usecols,
        low_memory=False
    ):
        # FRS, OR
        chunk = chunk[chunk["Channel 2"].isin(["FRS", "OR"])].copy()
        # 브랜드
        chunk = chunk[chunk["产品品牌"].isin(TARGET_BRANDS)].copy()
        # 대분류 = 饰品
        chunk = chunk[chunk["产品大分类"] == "饰品"].copy()
        
        # 운영기준 처리
        chunk["运营基准"] = chunk["运营基准"].fillna("运营基准없음")
        chunk["运营基准"] = chunk["运营基准"].astype(str).str.strip()
        chunk.loc[chunk["运营基准"] == "", "运营基准"] = "运营基准없음"
        chunk.loc[chunk["运营基准"] == "nan", "运영기준"] = "运营基准없음"
        
        chunk = chunk[[
            "Channel 2",
            "产品品牌",
            "产品中分类",
            "运营基准",
            "吊牌金额"
        ]].copy()
        
        chunk.columns = ["channel", "brand", "item_category", "operation", "판매금액"]
        
        # 판매금액 숫자 변환
        chunk["판매금액"] = pd.to_numeric(chunk["판매금액"].astype(str), errors='coerce').fillna(0)
        
        chunk_agg = chunk.groupby(["channel", "brand", "item_category", "operation"], as_index=False)["판매금액"].sum()
        chunk_agg["year"] = year
        chunk_agg["month"] = month
        
        chunks.append(chunk_agg)
        del chunk
    
    if not chunks:
        return pd.DataFrame(columns=["year", "month", "channel", "brand", "item_category", "operation", "판매금액"])
    
    result = pd.concat(chunks, ignore_index=True)
    result = result.groupby(
        ["year", "month", "channel", "brand", "item_category", "operation"],
        as_index=False
    )["판매금액"].sum()
    
    return result


def compute_operation_stock_weeks(
    stock_data: pd.DataFrame,
    sales_data: pd.DataFrame,
) -> pd.DataFrame:
    """
    운영기준별 재고주수 계산
    """
    # Channel별 분리
    stock_frs = stock_data[stock_data["channel"] == "FRS"].copy() if not stock_data.empty else pd.DataFrame()
    stock_or = stock_data[stock_data["channel"] == "OR"].copy() if not stock_data.empty else pd.DataFrame()
    sales_frs = sales_data[sales_data["channel"] == "FRS"].copy() if not sales_data.empty else pd.DataFrame()
    sales_or = sales_data[sales_data["channel"] == "OR"].copy() if not sales_data.empty else pd.DataFrame()
    
    # 모든 키 수집
    all_keys = set()
    for df in [stock_frs, stock_or, sales_frs, sales_or]:
        if not df.empty:
            all_keys.update(df[["year", "month", "brand", "item_category", "operation"]].apply(tuple, axis=1))
    
    if not all_keys:
        return pd.DataFrame()
    
    key_cols = ["year", "month", "brand", "item_category", "operation"]
    merged = pd.DataFrame(list(all_keys), columns=key_cols)
    
    # 데이터 병합
    for df, suffix in [(stock_frs, "agency_stock"), (stock_or, "or_stock"), 
                        (sales_frs, "frs_sales"), (sales_or, "or_sales")]:
        if not df.empty:
            value_col = "재고금액" if "재고금액" in df.columns else "판매금액"
            merged = merged.merge(
                df[key_cols + [value_col]],
                on=key_cols,
                how="left"
            ).rename(columns={value_col: suffix})
        else:
            merged[suffix] = 0
    
    merged = merged.fillna(0)
    
    results = []
    for _, row in merged.iterrows():
        year = int(row["year"])
        month = int(row["month"])
        brand = row["brand"]
        item_category = row["item_category"]
        operation = row["operation"]
        
        agency_stock = float(row.get("agency_stock", 0))
        or_stock = float(row.get("or_stock", 0))
        frs_sales = float(row.get("frs_sales", 0))
        or_sales = float(row.get("or_sales", 0))
        
        days_in_month = get_days_in_month(year, month)
        
        total_stock = agency_stock + or_stock
        total_sales = frs_sales + or_sales
        
        # 재고주수 계산
        stock_weeks = None
        if total_sales > 0:
            weekly_sales = (total_sales / days_in_month) * 7
            if weekly_sales > 0:
                stock_weeks = round(total_stock / weekly_sales, 2)
        
        # 100주 이상 이상치 플래그
        is_outlier_100wks = False
        if stock_weeks is not None and stock_weeks >= WEEKS_100_THRESHOLD:
            is_outlier_100wks = True
        
        results.append({
            "year": year,
            "month": month,
            "brand": brand,
            "item_category": item_category,
            "operation": operation,
            "stock_weeks": stock_weeks,
            "is_outlier_100wks": is_outlier_100wks,
            "total_stock": total_stock,
            "total_sales": total_sales,
        })
    
    return pd.DataFrame(results)


def preprocess_operation_all(brand: str) -> pd.DataFrame:
    """
    운영기준별 전체 전처리 프로세스 실행
    """
    if brand not in TARGET_BRANDS:
        raise ValueError(f"브랜드는 {TARGET_BRANDS} 중 하나여야 합니다.")
    
    years = set()
    months = set()
    
    # 대리상재고 폴더에서 파일 목록 수집
    for file_path in AGENCY_STOCK_PATH.glob("*.csv"):
        try:
            parts = file_path.stem.split(".")
            if len(parts) == 2:
                year = int(parts[0])
                month = int(parts[1])
                years.add(year)
                months.add((year, month))
        except:
            continue
    
    all_results = []
    
    for year, month in sorted(months):
        print(f"처리 중: {year}년 {month}월 - {brand} (운영기준)")
        
        stock_data = load_stock_by_operation(year, month)
        sales_data = load_sales_by_operation(year, month)
        
        # 브랜드 필터링
        if not stock_data.empty:
            stock_data = stock_data[stock_data["brand"] == brand].copy()
        if not sales_data.empty:
            sales_data = sales_data[sales_data["brand"] == brand].copy()
        
        result = compute_operation_stock_weeks(stock_data, sales_data)
        
        if not result.empty:
            all_results.append(result)
        
        del stock_data, sales_data, result
    
    if not all_results:
        return pd.DataFrame()
    
    return pd.concat(all_results, ignore_index=True)


def export_operation_json(df: pd.DataFrame, output_path: str = "stock_weeks_operation.json"):
    """
    운영기준별 재고주수를 JSON 형태로 출력
    """
    if df.empty:
        print("출력할 데이터가 없습니다.")
        return
    
    # 중분류 -> 운영기준 -> 연도 -> 월 구조로 변환
    result_dict = {}
    
    categories = sorted(df["item_category"].unique())
    
    for category in categories:
        cat_data = df[df["item_category"] == category]
        operations = sorted(cat_data["operation"].unique())
        
        result_dict[category] = {}
        
        for operation in operations:
            op_data = cat_data[cat_data["operation"] == operation]
            years = sorted(op_data["year"].unique())
            
            result_dict[category][operation] = {}
            
            for year in years:
                year_data = op_data[op_data["year"] == year]
                year_str = str(year)
                
                result_dict[category][operation][year_str] = {}
                
                for month in range(1, 13):
                    month_data = year_data[year_data["month"] == month]
                    month_str = str(month)
                    
                    if len(month_data) > 0:
                        row = month_data.iloc[0]
                        result_dict[category][operation][year_str][month_str] = {
                            "stock_weeks": row["stock_weeks"],
                            "is_outlier_100wks": bool(row["is_outlier_100wks"]),
                            "total_stock": float(row["total_stock"]),
                            "total_sales": float(row["total_sales"]),
                        }
                    else:
                        result_dict[category][operation][year_str][month_str] = {
                            "stock_weeks": None,
                            "is_outlier_100wks": False,
                            "total_stock": 0,
                            "total_sales": 0,
                        }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result_dict, f, ensure_ascii=False, indent=2)
    
    print(f"결과가 {output_path}에 저장되었습니다.")


if __name__ == "__main__":
    """
    사용 방법:
    1. python preprocess_operation_stock_weeks.py 실행
    2. 각 브랜드별로 JSON 파일이 public/data/ 폴더에 자동으로 생성됩니다:
       - public/data/stock_weeks_MLB_operation.json
       - public/data/stock_weeks_MLB_KIDS_operation.json
       - public/data/stock_weeks_DISCOVERY_operation.json
    """
    for brand in TARGET_BRANDS:
        print(f"\n{'='*50}")
        print(f"{brand} 브랜드 운영기준별 처리 시작")
        print(f"{'='*50}\n")
        
        result_df = preprocess_operation_all(brand)
        
        if not result_df.empty:
            output_file = DATA_DIR / f"stock_weeks_{brand.replace(' ', '_')}_operation.json"
            export_operation_json(result_df, str(output_file))
            print(f"\n{brand} 처리 완료: {len(result_df)}건")
            print(f"생성된 파일: {output_file}")
        else:
            print(f"\n{brand} 처리 완료: 데이터 없음")

