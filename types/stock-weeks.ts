/**
 * 재고주수 데이터 타입 정의
 */

// 기초데이터 타입
export interface BaseData {
  월일수: number;
  전체재고금액: number;
  대리상재고금액: number;
  직영재고금액: number;
  전체판매금액: number;
  대리상판매금액: number;
  직영판매금액: number;
}

// 월별 재고주수 데이터
export interface MonthData {
  전체재고주수: number | string | null;
  대리상재고주수: number | string | null;
  창고재고주수: number | string | null;
  기초데이터?: BaseData;
}

// 연도별 데이터
export type YearData = Record<string, MonthData>; // key: "1", "2", ..., "12"

// 소분류 데이터
export interface SubCategoryData {
  [year: string]: YearData; // 예: { "2024": { "1": {...}, "2": {...} } }
}

// 중분류별 데이터 구조
export interface CategoryData {
  [key: string]: YearData | { [subCategory: string]: SubCategoryData } | undefined; // 연도별 월 데이터 또는 소분류 블록
  소분류?: {
    [subCategory: string]: SubCategoryData;
  };
}

// 전체 JSON 구조
export interface StockWeeksData {
  [category: string]: CategoryData; // 중분류별 데이터
}

// 브랜드 타입
export type Brand = "MLB" | "MLB KIDS" | "DISCOVERY";

// 중분류 한글 매핑
export const CATEGORY_NAMES: Record<string, string> = {
  Shoes: "슈즈",
  Headwear: "모자",
  Bag: "가방",
  Acc_etc: "기타악세",
};

// 중분류 순서
export const CATEGORY_ORDER = ["Shoes", "Headwear", "Bag", "Acc_etc"];

