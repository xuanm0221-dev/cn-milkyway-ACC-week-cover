/**
 * 운영기준별 재고주수 데이터 타입 정의
 */

// 월별 데이터
export interface OperationMonthData {
  stock_weeks: number | null;
  is_outlier_100wks: boolean;
  total_stock: number;
  total_sales: number;
}

// 연도별 데이터
export type OperationYearData = Record<string, OperationMonthData>; // key: "1", "2", ..., "12"

// 운영기준별 데이터
export interface OperationData {
  [year: string]: OperationYearData; // 예: { "2024": { "1": {...}, "2": {...} } }
}

// 중분류별 데이터 구조
export interface OperationCategoryData {
  [operation: string]: OperationData; // 운영기준별 데이터
}

// 전체 JSON 구조
export interface OperationStockWeeksData {
  [category: string]: OperationCategoryData; // 중분류별 데이터
}

// 중분류 매핑
export const OPERATION_CATEGORY_NAMES: Record<string, string> = {
  Shoes: "신발",
  Headwear: "모자",
  Bag: "가방",
  Acc_etc: "기타",
};

// 중분류 순서
export const OPERATION_CATEGORY_ORDER = ["Shoes", "Headwear", "Bag", "Acc_etc"];

