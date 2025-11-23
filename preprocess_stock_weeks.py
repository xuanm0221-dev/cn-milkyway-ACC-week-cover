"""
재고주수 대시보드 전처리 코드
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
OR_STOCK_PATH = BASE_PATH / "직영재고"
SALES_PATH = BASE_PATH / "판매매출"

# 출력 경로 설정 (스크립트 위치 기준)
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "public" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)  # 폴더가 없으면 생성

# 분석 대상 브랜드
TARGET_BRANDS = ["MLB", "MLB KIDS", "DISCOVERY"]

# 중분류 매핑 (직영재고용)
OR_CATEGORY_MAP = {
    "A0120": "Acc_etc",  # 기타악세
    "A0130": "Bag",      # 가방
    "A0140": "Headwear", # 모자
    "A0150": "Shoes"     # 신발
}

# 검증 임계값 설정 (경고용, 제거 X)
MAX_INDIVIDUAL_AMOUNT = 10_000_000_000   # 개별 행 최대값: 100억원
MAX_AGGREGATED_AMOUNT = 500_000_000_000  # 집계 합계 최대값: 5,000억원


# 월별 일수 계산
def get_days_in_month(year: int, month: int) -> int:
    """월별 일수 반환"""
    return calendar.monthrange(year, month)[1]


def validate_amount(
    df: pd.DataFrame,
    amount_col: str,
    year: int,
    month: int,
    data_type: str,
    threshold_individual: float = MAX_INDIVIDUAL_AMOUNT,
    threshold_aggregated: float = MAX_AGGREGATED_AMOUNT
) -> pd.DataFrame:
    """
    금액 데이터 검증 및 이상치 감지 (경고만, 제거 없음)
    
    Args:
        df: 검증할 DataFrame
        amount_col: 금액 컬럼명
        year: 연도
        month: 월
        data_type: 데이터 타입 ("대리상재고", "직영재고", "판매매출")
        threshold_individual: 개별 행 최대값 임계값
        threshold_aggregated: 집계 합계 최대값 임계값
    
    Returns:
        df (데이터 변경 없음)
    """
    if df.empty:
        return df
    
    if amount_col in df.columns:
        # 개별 행 이상치 경고
        large_rows = df[df[amount_col].abs() > threshold_individual]
        if len(large_rows) > 0:
            print(f"\n⚠️  [경고] {year}년 {month}월 {data_type} - 개별 행 이상치 감지(유지됨):")
            for idx, row in large_rows.iterrows():
                info_cols = [col for col in df.columns if col not in [amount_col, 'year', 'month']]
                info = ", ".join([f"{col}={row[col]}" for col in info_cols if col in row])
                print(f"   - {info}: {amount_col}={row[amount_col]:,.0f}원")

        # 집계 합계 이상치 경고
        group_cols = [col for col in df.columns if col not in [amount_col, 'year', 'month']]
        grouped = df.groupby(group_cols, as_index=False)[amount_col].sum()
        large_groups = grouped[grouped[amount_col].abs() > threshold_aggregated]
        if len(large_groups) > 0:
            print(f"\n⚠️  [경고] {year}년 {month}월 {data_type} - 집계 합계 이상치 감지(유지됨):")
            for idx, row in large_groups.iterrows():
                info_cols = [col for col in grouped.columns if col not in [amount_col, 'year', 'month']]
                info = ", ".join([f"{col}={row[col]}" for col in info_cols if col in row])
                print(f"   - {info}: 집계합계={row[amount_col]:,.0f}원")

    return df


def load_stock_agency_chunked(year: int, month: int, chunk_size: int = 100_000) -> pd.DataFrame:
    """
    대리상재고 파일을 청크 단위로 읽어서 집계
    
    필터링 조건:
    - Channel 2 == "FRS" (대리상)
    - 产品品牌 in TARGET_BRANDS (MLB, MLB KIDS, DISCOVERY)
    - 产品大分类 == "饰品" (악세사리)
    - 产品中分类 in ["Shoes", "Headwear", "Bag", "Acc_etc"] (중분류 4개만)
    
    Returns:
        집계된 DataFrame: [year, month, brand, 중분류, 소분류, 재고금액]
    """
    file_path = AGENCY_STOCK_PATH / f"{year}.{month:02d}.csv"
    
    if not file_path.exists():
        return pd.DataFrame(columns=["year", "month", "brand", "중분류", "소분류", "재고금액"])
    
    usecols = [
        "Channel 2",
        "产品品牌",
        "产品大分类",
        "产品中分类",
        "本地小分类",
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
        # 1) FRS(대리상)
        chunk = chunk[chunk["Channel 2"] == "FRS"].copy()
        # 2) 브랜드
        chunk = chunk[chunk["产品品牌"].isin(TARGET_BRANDS)].copy()
        # 3) 대분류 = 饰品
        chunk = chunk[chunk["产品大分类"] == "饰品"].copy()
        # 4) 중분류 4개
        valid_mid = ["Shoes", "Headwear", "Bag", "Acc_etc"]
        chunk = chunk[chunk["产品中分类"].isin(valid_mid)].copy()
        
        # 5) 필요한 컬럼만
        chunk = chunk[["产品品牌", "产品中分类", "本地小分类", "预计库存金额"]].copy()
        chunk.columns = ["brand", "중분류", "소분류", "재고금액"]
        
        # 6) 재고금액 숫자 변환 (음수 유지, 상한 제거 없음)
        chunk["재고금액"] = pd.to_numeric(chunk["재고금액"].astype(str), errors="coerce").fillna(0)
        
        # 개별 이상치 경고만 (삭제/수정 없음)
        large_rows = chunk[chunk["재고금액"].abs() > MAX_INDIVIDUAL_AMOUNT]
        if len(large_rows) > 0:
            print(f"\n⚠️  [경고] {year}년 {month:02d}월 대리상재고 - 청크 내 개별 행 이상치 감지(유지됨):")
            for idx, row in large_rows.head(10).iterrows():
                print(f"   - brand={row['brand']}, 중분류={row['중분류']}, 소분류={row['소분류']}: {row['재고금액']:,.0f}원")
        
        # 7) 그룹 집계
        chunk_agg = (
            chunk.groupby(["brand", "중분류", "소분류"], as_index=False)["재고금액"]
            .sum()
        )
        chunk_agg["year"] = year
        chunk_agg["month"] = month
        
        chunks.append(chunk_agg)
        del chunk
    
    if not chunks:
        return pd.DataFrame(columns=["year", "month", "brand", "중분류", "소분류", "재고금액"])
    
    result = pd.concat(chunks, ignore_index=True)
    result = (
        result.groupby(["year", "month", "brand", "중분류", "소분류"], as_index=False)["재고금액"]
        .sum()
    )
    
    result = validate_amount(result, "재고금액", year, month, "대리상재고")
    return result


def load_stock_or_chunked(year: int, month: int) -> pd.DataFrame:
    """
    직영재고 파일을 청크 단위로 읽어서 집계
    
    Returns:
        집계된 DataFrame: [year, month, brand, 중분류, 소분류, 재고금액]
    """
    file_path = OR_STOCK_PATH / f"{year}.{month:02d}.csv"
    
    if not file_path.exists():
        return pd.DataFrame()
    
    chunks = []
    chunk_size = 100_000
    
    usecols = [
        "브랜드명",
        "제품계층구조",
        "스타일 코드",
        "TAG-기말재고"
    ]
    
    for chunk in pd.read_csv(
        file_path,
        chunksize=chunk_size,
        encoding='utf-8-sig',
        usecols=usecols,
        low_memory=False
    ):
        # 브랜드 필터
        chunk = chunk[chunk["브랜드명"].isin(TARGET_BRANDS)].copy()
        # 악세사리
        chunk = chunk[chunk["제품계층구조"].str[:5] == "A0100"].copy()
        # 중분류 코드
        chunk["중분류코드"] = chunk["제품계층구조"].str[5:10]
        chunk = chunk[chunk["중분류코드"].isin(OR_CATEGORY_MAP.keys())].copy()
        chunk["중분류"] = chunk["중분류코드"].map(OR_CATEGORY_MAP)
        # 소분류 (스타일 코드 7~8자리)
        chunk["소분류"] = chunk["스타일 코드"].str[6:8]
        
        chunk = chunk[[
            "브랜드명",
            "중분류",
            "소분류",
            "TAG-기말재고"
        ]].copy()
        
        chunk.columns = ["brand", "중분류", "소분류", "재고금액"]
        
        # 재고금액 숫자 변환 (음수 유지, 상한 제거 없음)
        chunk["재고금액"] = pd.to_numeric(chunk["재고금액"].astype(str), errors='coerce').fillna(0)
        
        # 이상치 경고만
        large_rows = chunk[chunk["재고금액"].abs() > MAX_INDIVIDUAL_AMOUNT]
        if len(large_rows) > 0:
            print(f"\n⚠️  [경고] {year}년 {month:02d}월 직영재고 - 청크 내 개별 행 이상치 감지(유지됨):")
            for idx, row in large_rows.head(10).iterrows():
                print(f"   - brand={row['brand']}, 중분류={row['중분류']}, 소분류={row['소분류']}: {row['재고금액']:,.0f}원")
        
        chunk_agg = chunk.groupby(["brand", "중분류", "소분류"], as_index=False)["재고금액"].sum()
        chunk_agg["year"] = year
        chunk_agg["month"] = month
        
        chunks.append(chunk_agg)
        del chunk
    
    if not chunks:
        return pd.DataFrame(columns=["year", "month", "brand", "중분류", "소분류", "재고금액"])
    
    result = pd.concat(chunks, ignore_index=True)
    result = result.groupby(["year", "month", "brand", "중분류", "소분류"], as_index=False)["재고금액"].sum()
    
    result = validate_amount(result, "재고금액", year, month, "직영재고")
    return result


def load_sales_chunked(year: int, month: int) -> pd.DataFrame:
    """
    판매매출 파일을 청크 단위로 읽어서 집계
    
    Returns:
        집계된 DataFrame: [year, month, brand, channel, 중분류, 소분류, 판매금액]
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
        "本地小分类",
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
        
        chunk = chunk[[
            "Channel 2",
            "产品品牌",
            "产品中分类",
            "本地小分类",
            "吊牌金额"
        ]].copy()
        
        chunk.columns = ["channel", "brand", "중분류", "소분류", "판매금액"]
        
        # 판매금액 숫자 변환 (음수 허용, 상한 제거 없음)
        chunk["판매금액"] = pd.to_numeric(chunk["판매금액"].astype(str), errors='coerce').fillna(0)
        
        # 이상치 경고만
        large_rows = chunk[chunk["판매금액"].abs() > MAX_INDIVIDUAL_AMOUNT]
        if len(large_rows) > 0:
            print(f"\n⚠️  [경고] {year}년 {month:02d}월 판매매출 - 청크 내 개별 행 이상치 감지(유지됨):")
            for idx, row in large_rows.head(10).iterrows():
                print(f"   - channel={row['channel']}, brand={row['brand']}, 중분류={row['중분류']}, 소분류={row['소분류']}: {row['판매금액']:,.0f}원")
        
        chunk_agg = chunk.groupby(["channel", "brand", "중분류", "소분류"], as_index=False)["판매금액"].sum()
        chunk_agg["year"] = year
        chunk_agg["month"] = month
        
        chunks.append(chunk_agg)
        del chunk
    
    if not chunks:
        return pd.DataFrame(columns=["year", "month", "channel", "brand", "중분류", "소분류", "판매금액"])
    
    result = pd.concat(chunks, ignore_index=True)
    result = result.groupby(
        ["year", "month", "channel", "brand", "중분류", "소분류"],
        as_index=False
    )["판매금액"].sum()
    
    # 최종 검증 (경고만)
    result_check = result.copy()
    result_check["판매금액_abs"] = result_check["판매금액"].abs()
    result_check = validate_amount(result_check, "판매금액_abs", year, month, "판매매출")
    del result_check
    
    return result


def compute_stock_weeks(
    stock_agency: pd.DataFrame,
    stock_or: pd.DataFrame,
    sales: pd.DataFrame,
    n_weeks: int = 25
) -> pd.DataFrame:
    """
    재고주수 계산
    """
    sales_frs = sales[sales["channel"] == "FRS"].copy()
    sales_or = sales[sales["channel"] == "OR"].copy()
    
    if not sales_frs.empty:
        sales_frs = sales_frs.groupby(
            ["year", "month", "brand", "중분류", "소분류"],
            as_index=False
        )["판매금액"].sum()
    if not sales_or.empty:
        sales_or = sales_or.groupby(
            ["year", "month", "brand", "중분류", "소분류"],
            as_index=False
        )["판매금액"].sum()
    
    all_keys = set()
    for df in [stock_agency, stock_or, sales_frs, sales_or]:
        if not df.empty:
            all_keys.update(df[["year", "month", "brand", "중분류", "소분류"]].apply(tuple, axis=1))
    
    if not all_keys:
        return pd.DataFrame(columns=[
            "year", "month", "brand", "중분류", "소분류",
            "전체재고주수", "대리상재고주수", "창고재고주수"
        ])
    
    key_cols = ["year", "month", "brand", "중분류", "소분류"]
    merged = pd.DataFrame(list(all_keys), columns=key_cols)
    
    if not stock_agency.empty:
        merged = merged.merge(
            stock_agency[key_cols + ["재고금액"]],
            on=key_cols,
            how="left"
        ).rename(columns={"재고금액": "agency_stock"})
    else:
        merged["agency_stock"] = 0
    
    if not stock_or.empty:
        merged = merged.merge(
            stock_or[key_cols + ["재고금액"]],
            on=key_cols,
            how="left"
        ).rename(columns={"재고금액": "or_stock"})
    else:
        merged["or_stock"] = 0
    
    if not sales_frs.empty:
        merged = merged.merge(
            sales_frs[key_cols + ["판매금액"]],
            on=key_cols,
            how="left"
        ).rename(columns={"판매금액": "frs_sales"})
    else:
        merged["frs_sales"] = 0
    
    if not sales_or.empty:
        merged = merged.merge(
            sales_or[key_cols + ["판매금액"]],
            on=key_cols,
            how="left"
        ).rename(columns={"판매금액": "or_sales"})
    else:
        merged["or_sales"] = 0
    
    merged = merged.fillna(0)
    
    results = []
    for _, row in merged.iterrows():
        year = int(row["year"])
        month = int(row["month"])
        brand = row["brand"]
        중분류 = row["중분류"]
        소분류 = row["소분류"]
        
        agency_stock = float(row["agency_stock"])
        or_stock = float(row["or_stock"])
        frs_sales = float(row["frs_sales"])
        or_sales = float(row["or_sales"])
        
        days_in_month = get_days_in_month(year, month)
        
        total_stock = agency_stock + or_stock
        total_sales = frs_sales + or_sales
        
        전체재고주수 = None
        대리상재고주수 = None
        창고재고주수 = None
        
        if total_sales == 0 or pd.isna(total_sales):
            전체재고주수 = "판매0"
        else:
            weekly_sales = (total_sales / days_in_month) * 7
            if weekly_sales != 0:
                전체재고주수 = round(total_stock / weekly_sales, 2)
            else:
                전체재고주수 = "판매0"
        
        if frs_sales == 0 or pd.isna(frs_sales):
            대리상재고주수 = "판매0"
        else:
            frs_weekly_sales = (frs_sales / days_in_month) * 7
            if frs_weekly_sales != 0:
                대리상재고주수 = round(agency_stock / frs_weekly_sales, 2)
            else:
                대리상재고주수 = "판매0"
        
        if or_sales == 0 or pd.isna(or_sales):
            or_weekly_sales = 0
        else:
            or_weekly_sales = (or_sales / days_in_month) * 7
        
        직영판매예정재고 = or_weekly_sales * n_weeks
        창고재고 = or_stock - 직영판매예정재고
        
        if total_sales == 0 or pd.isna(total_sales):
            창고재고주수 = "판매0"
        else:
            weekly_sales = (total_sales / days_in_month) * 7
            if weekly_sales != 0:
                창고재고주수 = round(창고재고 / weekly_sales, 2)
            else:
                창고재고주수 = "판매0"
        
        results.append({
            "year": year,
            "month": month,
            "brand": brand,
            "중분류": 중분류,
            "소분류": 소분류,
            "전체재고주수": 전체재고주수,
            "대리상재고주수": 대리상재고주수,
            "창고재고주수": 창고재고주수,
            "월일수": days_in_month,
            "전체재고금액": total_stock,
            "대리상재고금액": agency_stock,
            "직영재고금액": or_stock,
            "전체판매금액": total_sales,
            "대리상판매금액": frs_sales,
            "직영판매금액": or_sales
        })
    
    return pd.DataFrame(results)


def preprocess_all(brand: str, n_weeks: int = 25) -> pd.DataFrame:
    """
    전체 전처리 프로세스 실행
    """
    if brand not in TARGET_BRANDS:
        raise ValueError(f"브랜드는 {TARGET_BRANDS} 중 하나여야 합니다.")
    
    years = set()
    months = set()
    
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
    
    for file_path in OR_STOCK_PATH.glob("*.csv"):
        try:
            parts = file_path.stem.split(".")
            if len(parts) == 2:
                year = int(parts[0])
                month = int(parts[1])
                years.add(year)
                months.add((year, month))
        except:
            continue
    
    for file_path in SALES_PATH.glob("*.csv"):
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
        print(f"처리 중: {year}년 {month}월 - {brand}")
        
        stock_agency = load_stock_agency_chunked(year, month)
        stock_or = load_stock_or_chunked(year, month)
        sales = load_sales_chunked(year, month)
        
        if not stock_agency.empty:
            stock_agency = stock_agency[stock_agency["brand"] == brand].copy()
        if not stock_or.empty:
            stock_or = stock_or[stock_or["brand"] == brand].copy()
        if not sales.empty:
            sales = sales[sales["brand"] == brand].copy()
        
        result = compute_stock_weeks(stock_agency, stock_or, sales, n_weeks)
        
        if not result.empty:
            all_results.append(result)
        
        del stock_agency, stock_or, sales, result
    
    if not all_results:
        return pd.DataFrame()
    
    return pd.concat(all_results, ignore_index=True)


def export_json(df: pd.DataFrame, output_path: str = "stock_weeks_result.json"):
    """
    결과를 JSON 형태로 출력
    항상 1~12월 전체 월 키를 생성하며, 데이터가 없는 월은 기본값으로 채움
    """
    if df.empty:
        print("출력할 데이터가 없습니다.")
        return
    
    def create_default_month_data(year: int, month: int) -> dict:
        days = get_days_in_month(year, month)
        return {
            "전체재고주수": None,
            "대리상재고주수": None,
            "창고재고주수": None,
            "기초데이터": {
                "월일수": days,
                "전체재고금액": 0,
                "대리상재고금액": 0,
                "직영재고금액": 0,
                "전체판매금액": 0,
                "대리상판매금액": 0,
                "직영판매금액": 0,
            },
        }
    
    subcategory_data_map = {}
    subcategory_base_data_map = {}
    category_base_agg = {}
    
    for _, row in df.iterrows():
        year = int(row["year"])
        month = int(row["month"])
        중분류 = row["중분류"]
        소분류 = row["소분류"]
        
        기초데이터 = {
            "월일수": int(row.get("월일수", get_days_in_month(year, month))),
            "전체재고금액": float(row.get("전체재고금액", 0)),
            "대리상재고금액": float(row.get("대리상재고금액", 0)),
            "직영재고금액": float(row.get("직영재고금액", 0)),
            "전체판매금액": float(row.get("전체판매금액", 0)),
            "대리상판매금액": float(row.get("대리상판매금액", 0)),
            "직영판매금액": float(row.get("직영판매금액", 0)),
        }
        
        sub_value = {
            "전체재고주수": row["전체재고주수"],
            "대리상재고주수": row["대리상재고주수"],
            "창고재고주수": row["창고재고주수"],
            "기초데이터": 기초데이터
        }
        
        sub_key = (중분류, 소분류, year, month)
        subcategory_data_map[sub_key] = sub_value
        subcategory_base_data_map[sub_key] = 기초데이터
        
        cat_key = (중분류, year, month)
        if cat_key not in category_base_agg:
            category_base_agg[cat_key] = {
                "월일수": 기초데이터["월일수"],
                "전체재고금액": 0.0,
                "대리상재고금액": 0.0,
                "직영재고금액": 0.0,
                "전체판매금액": 0.0,
                "대리상판매금액": 0.0,
                "직영판매금액": 0.0,
            }
        
        category_base_agg[cat_key]["전체재고금액"] += 기초데이터["전체재고금액"]
        category_base_agg[cat_key]["대리상재고금액"] += 기초데이터["대리상재고금액"]
        category_base_agg[cat_key]["직영재고금액"] += 기초데이터["직영재고금액"]
        category_base_agg[cat_key]["전체판매금액"] += 기초데이터["전체판매금액"]
        category_base_agg[cat_key]["대리상판매금액"] += 기초데이터["대리상판매금액"]
        category_base_agg[cat_key]["직영판매금액"] += 기초데이터["직영판매금액"]
    
    category_data_map = {}
    for cat_key, base_data in category_base_agg.items():
        중분류, year, month = cat_key
        year = int(year)
        month = int(month)
        
        days_in_month = base_data["월일수"]
        total_stock = base_data["전체재고금액"]
        agency_stock = base_data["대리상재고금액"]
        or_stock = base_data["직영재고금액"]
        total_sales = base_data["전체판매금액"]
        frs_sales = base_data["대리상판매금액"]
        or_sales = base_data["직영판매금액"]
        
        전체재고주수 = None
        대리상재고주수 = None
        창고재고주수 = None
        
        if total_sales == 0 or pd.isna(total_sales):
            전체재고주수 = "판매0"
        else:
            weekly_sales = (total_sales / days_in_month) * 7
            if weekly_sales != 0:
                전체재고주수 = round(total_stock / weekly_sales, 2)
            else:
                전체재고주수 = "판매0"
        
        if frs_sales == 0 or pd.isna(frs_sales):
            대리상재고주수 = "판매0"
        else:
            frs_weekly_sales = (frs_sales / days_in_month) * 7
            if frs_weekly_sales != 0:
                대리상재고주수 = round(agency_stock / frs_weekly_sales, 2)
            else:
                대리상재고주수 = "판매0"
        
        n_weeks_default = 25
        if or_sales == 0 or pd.isna(or_sales):
            or_weekly_sales = 0
        else:
            or_weekly_sales = (or_sales / days_in_month) * 7
        
        직영판매예정재고 = or_weekly_sales * n_weeks_default
        창고재고 = or_stock - 직영판매예정재고
        
        if total_sales == 0 or pd.isna(total_sales):
            창고재고주수 = "판매0"
        else:
            weekly_sales = (total_sales / days_in_month) * 7
            if weekly_sales != 0:
                창고재고주수 = round(창고재고 / weekly_sales, 2)
            else:
                창고재고주수 = "판매0"
        
        category_data_map[cat_key] = {
            "전체재고주수": 전체재고주수,
            "대리상재고주수": 대리상재고주수,
            "창고재고주수": 창고재고주수,
            "기초데이터": base_data
        }
    
    years = sorted(set(int(row["year"]) for _, row in df.iterrows()))
    categories = sorted(set(row["중분류"] for _, row in df.iterrows()))
    subcategories_by_category = defaultdict(set)
    for _, row in df.iterrows():
        subcategories_by_category[row["중분류"]].add(row["소분류"])
    
    result_dict = {}
    
    for 중분류 in categories:
        result_dict[중분류] = {}
        
        for year in years:
            year_str = str(year)
            year_result = {}
            
            for month in range(1, 13):
                month_str = str(month)
                year_result[month_str] = create_default_month_data(year, month)
                
                key = (중분류, year, month)
                if key in category_data_map:
                    year_result[month_str] = category_data_map[key]
            
            result_dict[중분류][year_str] = year_result
        
        if 중분류 in subcategories_by_category:
            result_dict[중분류]["소분류"] = {}
            
            for 소분류 in sorted(subcategories_by_category[중분류]):
                result_dict[중분류]["소분류"][소분류] = {}
                
                for year in years:
                    year_str = str(year)
                    year_result = {}
                    
                    for month in range(1, 13):
                        month_str = str(month)
                        year_result[month_str] = create_default_month_data(year, month)
                        
                        sub_key = (중분류, 소분류, year, month)
                        if sub_key in subcategory_data_map:
                            year_result[month_str] = subcategory_data_map[sub_key]
                        elif sub_key in subcategory_base_data_map:
                            year_result[month_str]["기초데이터"] = subcategory_base_data_map[sub_key]
                    
                    result_dict[중분류]["소분류"][소분류][year_str] = year_result
    
    if result_dict:
        first_category = list(result_dict.keys())[0]
        if result_dict[first_category]:
            first_year = list(result_dict[first_category].keys())[0]
            if first_year != "소분류":
                months_in_result = list(result_dict[first_category][first_year].keys())
                print(f"[디버그] {first_category} / {first_year}년의 월 키: {sorted(months_in_result)}")
                if len(months_in_result) == 12:
                    print(f"[디버그] ✓ 1~12월 모든 키가 존재합니다.")
                else:
                    print(f"[경고] 월 키가 12개가 아닙니다: {len(months_in_result)}개")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result_dict, f, ensure_ascii=False, indent=2)
    
    print(f"결과가 {output_path}에 저장되었습니다.")
    print(f"  - 각 연도별로 1~12월 전체 월 키가 생성됩니다.")
    print(f"  - 데이터가 없는 월은 기본값(null 및 기초데이터 0)으로 채워집니다.")


if __name__ == "__main__":
    """
    사용 방법:
    1. python preprocess_stock_weeks.py 실행
    2. 각 브랜드별로 JSON 파일이 public/data/ 폴더에 자동으로 생성됩니다:
       - public/data/stock_weeks_MLB.json
       - public/data/stock_weeks_MLB_KIDS.json
       - public/data/stock_weeks_DISCOVERY.json
    """
    for brand in TARGET_BRANDS:
        print(f"\n{'='*50}")
        print(f"{brand} 브랜드 처리 시작")
        print(f"{'='*50}\n")
        
        result_df = preprocess_all(brand, n_weeks=25)
        
        if not result_df.empty:
            output_file = DATA_DIR / f"stock_weeks_{brand.replace(' ', '_')}.json"
            export_json(result_df, str(output_file))
            print(f"\n{brand} 처리 완료: {len(result_df)}건")
            print(f"생성된 파일: {output_file}")
            print(f"  → public/data 폴더에 저장되었습니다.")
        else:
            print(f"\n{brand} 처리 완료: 데이터 없음")
