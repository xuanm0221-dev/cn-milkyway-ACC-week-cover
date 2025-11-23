/**
 * 히트맵 셀 색상 결정 헬퍼 함수
 */

/**
 * 재고주수 값에 따른 히트맵 배경색 클래스 반환 (새로운 스타일)
 * @param value - 재고주수 값 (숫자, "판매0", null)
 * @returns Tailwind CSS 배경색 클래스
 */
export function getHeatmapClass(value: number | string | null | undefined): string {
  // null이거나 데이터가 없으면 기본 흰색
  if (value == null || value === undefined) {
    return "bg-white";
  }

  // "판매0" 문자열이면 연한 회색
  if (value === "판매0") {
    return "bg-slate-50 text-slate-400";
  }

  // 숫자로 변환
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // NaN이면 기본 흰색
  if (Number.isNaN(numValue)) {
    return "bg-white";
  }

  // 0주 또는 음수: 연한 회색
  if (numValue <= 0) {
    return "bg-slate-50 text-slate-400";
  }

  // 구간별 색상
  if (numValue < 20) {
    return "bg-emerald-50"; // 낮은 주수: 연한 초록
  }
  if (numValue < 30) {
    return "bg-emerald-100"; // 보통: 초록
  }
  if (numValue < 40) {
    return "bg-yellow-100"; // 다소 높은 값: 노랑
  }
  if (numValue < 50) {
    return "bg-orange-100"; // 높은 값: 주황
  }
  return "bg-red-100"; // 매우 높은 값: 연한 빨강
}

/**
 * 재고주수 값에 따른 Tailwind CSS 배경색 클래스 반환 (기존 함수, 하위 호환성 유지)
 * @param value - 재고주수 값 (숫자, "판매0", null)
 * @returns Tailwind CSS 배경색 클래스
 */
export function getCellColor(value: number | string | null): string {
  return getHeatmapClass(value);
}

/**
 * 재고주수 값을 표시용 텍스트로 변환
 * @param value - 재고주수 값
 * @param t - i18n 번역 함수 (옵션)
 * @returns 표시용 텍스트
 */
export function formatWeeksValue(value: number | string | null, t?: (key: string) => string): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (value === "판매0") {
    return t ? t("common.noSales") : "판매0";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "-";
  }

  // 소수점 없이 반올림하여 표시
  const weeks = t ? t("common.weeks") : "주";
  return `${Math.round(numValue)}${weeks}`;
}

