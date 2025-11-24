/**
 * 기초데이터로부터 재고주수 계산 헬퍼 함수
 */

import { BaseData } from "@/types/stock-weeks";

export type WeeksKind = "전체재고주수" | "대리상재고주수" | "창고재고주수";

/**
 * 기초데이터를 기반으로 재고주수를 계산
 * @param baseData - 기초데이터
 * @param kind - 계산할 재고주수 종류
 * @param nWeeks - 직영 판매예정 주수 (창고재고주수 계산 시 사용)
 * @returns 계산된 재고주수 값 (숫자 또는 "판매0" 또는 null)
 */
export function calcWeeksFromBase(
  baseData: BaseData | undefined,
  kind: WeeksKind,
  nWeeks: number = 25
): number | string | null {
  // baseData가 없으면 null 반환
  if (!baseData) {
    return null;
  }

  const {
    월일수,
    전체재고금액,
    대리상재고금액,
    직영재고금액,
    전체판매금액,
    대리상판매금액,
    직영판매금액,
  } = baseData;

  // 판매평균 계산
  const 전체판매평균 = (전체판매금액 / 월일수) * 7;
  const 대리상판매평균 = (대리상판매금액 / 월일수) * 7;
  const 직영판매평균 = (직영판매금액 / 월일수) * 7;

  // 전체재고주수 계산
  if (kind === "전체재고주수") {
    if (전체판매평균 === 0 || isNaN(전체판매평균)) {
      return "판매0";
    }
    return 전체재고금액 / 전체판매평균;
  }

  // 대리상재고주수 계산
  if (kind === "대리상재고주수") {
    if (대리상판매평균 === 0 || isNaN(대리상판매평균)) {
      return "판매0";
    }
    return 대리상재고금액 / 대리상판매평균;
  }

  // 창고재고주수 계산
  if (kind === "창고재고주수") {
    if (전체판매평균 === 0 || isNaN(전체판매평균)) {
      return "판매0";
    }
    const 직영판매예정재고 = 직영판매평균 * nWeeks;
    const 창고재고 = 직영재고금액 - 직영판매예정재고;
    return 창고재고 / 전체판매평균;
  }

  return null;
}







