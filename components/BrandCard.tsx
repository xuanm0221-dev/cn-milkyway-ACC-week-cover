"use client";

import React, { useMemo } from "react";
import { StockWeeksData, Brand, CATEGORY_ORDER, BaseData } from "@/types/stock-weeks";
import { calcWeeksFromBase } from "@/utils/calc-weeks";
import { useT } from "@/lib/i18n";
import Link from "next/link";

interface BrandCardProps {
  brand: Brand;
  data: StockWeeksData;
  nWeeks: number;
  selectedYear?: string;
  selectedMonth?: number;
}

interface BrandSummary {
  currentWeeks: number | null;
  prevWeeks: number | null;
  currentEndingStock: number; // 원 단위
  prevEndingStock: number; // 원 단위
  currentSales: number; // 원 단위
  prevSales: number; // 원 단위
  categoryData: {
    [category: string]: {
      currentWeeks: number | null;
      prevWeeks: number | null;
      currentEndingStock: number;
      prevEndingStock: number;
      currentSales: number;
      prevSales: number;
    };
  };
}

/**
 * 숫자를 백만원 단위로 포맷팅 (천 단위 구분자 포함)
 */
const formatM = (value: number): string => {
  const valueM = value / 1_000_000;
  return valueM.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
};

/**
 * 재고주수를 포맷팅 (소수점 1자리)
 */
const formatWeeks = (value: number | null): string => {
  if (value === null || isNaN(value)) return "-";
  return `${value.toFixed(1)}주`;
};

/**
 * 재고주수를 포맷팅 (정수, 주수만)
 */
const formatWeeksOnly = (value: number | null): string => {
  if (value === null || isNaN(value)) return "-";
  return `${Math.round(value)}주`;
};

/**
 * 퍼센트를 포맷팅 (소수점 없이, 천 단위 구분자 포함)
 */
const formatPercent = (value: number | null): string => {
  if (value === null || isNaN(value) || value === 0) return "-";
  const roundedValue = Math.round(value);
  return `${roundedValue.toLocaleString('ko-KR')}%`;
};

/**
 * 브랜드 카드 컴포넌트
 */
export default function BrandCard({ brand, data, nWeeks, selectedYear, selectedMonth }: BrandCardProps) {
  const t = useT();

  // 기준 연도와 전년도 추출
  const { currentYear, prevYear, latestMonth } = useMemo(() => {
    const years = new Set<string>();
    let latestMonth = 1;
    
    CATEGORY_ORDER.forEach((category) => {
      if (data[category]) {
        Object.keys(data[category]).forEach((key) => {
          if (/^\d{4}$/.test(key) && key !== "2023" && key !== "소분류") {
            years.add(key);
          }
        });
      }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
    // selectedYear가 있으면 사용, 없으면 최신 연도
    const currentYear = selectedYear || sortedYears[0] || "2025";
    // 전년도는 선택된 연도보다 1년 전
    const currentYearNum = parseInt(currentYear);
    const prevYear = String(currentYearNum - 1);

    // selectedMonth가 있으면 사용, 없으면 최신 월 찾기
    if (selectedMonth) {
      latestMonth = selectedMonth;
    } else {
      // 최신 월 찾기 (재고금액이 0보다 큰 가장 최근 월)
      for (let month = 12; month >= 1; month--) {
        let hasData = false;
        for (const category of CATEGORY_ORDER) {
          const categoryData = data[category];
          if (categoryData && categoryData[currentYear]) {
            const monthData = categoryData[currentYear][String(month)];
            if (monthData?.기초데이터) {
              const totalStockAmount =
                typeof monthData.기초데이터.전체재고금액 === "number"
                  ? monthData.기초데이터.전체재고금액
                  : 0;
              if (totalStockAmount > 0) {
                hasData = true;
                break;
              }
            }
          }
        }
        if (hasData) {
          latestMonth = month;
          break;
        }
      }
    }

    return { currentYear, prevYear, latestMonth };
  }, [data, selectedYear, selectedMonth]);

  // 브랜드별 데이터 집계
  const brandSummary = useMemo((): BrandSummary => {
    let totalCurrentEndingStock = 0;
    let totalPrevEndingStock = 0;
    let totalCurrentSales = 0;
    let totalPrevSales = 0;
    let totalCurrentBaseData: BaseData = {
      월일수: 0,
      전체재고금액: 0,
      대리상재고금액: 0,
      직영재고금액: 0,
      전체판매금액: 0,
      대리상판매금액: 0,
      직영판매금액: 0,
    };
    let totalPrevBaseData: BaseData = {
      월일수: 0,
      전체재고금액: 0,
      대리상재고금액: 0,
      직영재고금액: 0,
      전체판매금액: 0,
      대리상판매금액: 0,
      직영판매금액: 0,
    };

    const categoryData: BrandSummary["categoryData"] = {};

    CATEGORY_ORDER.forEach((categoryKey) => {
      const categoryDataItem = data[categoryKey];
      if (!categoryDataItem) return;

      let currentEndingStock = 0;
      let prevEndingStock = 0;
      let currentSales = 0;
      let prevSales = 0;
      let currentBaseData: BaseData = {
        월일수: 0,
        전체재고금액: 0,
        대리상재고금액: 0,
        직영재고금액: 0,
        전체판매금액: 0,
        대리상판매금액: 0,
        직영판매금액: 0,
      };
      let prevBaseData: BaseData = {
        월일수: 0,
        전체재고금액: 0,
        대리상재고금액: 0,
        직영재고금액: 0,
        전체판매금액: 0,
        대리상판매금액: 0,
        직영판매금액: 0,
      };

      // 현재 연도 데이터
      const currentYearData = categoryDataItem[currentYear];
      if (currentYearData) {
        const monthData = currentYearData[String(latestMonth)];
        if (monthData?.기초데이터) {
          const baseData = monthData.기초데이터 &&
            typeof monthData.기초데이터 === "object" &&
            "월일수" in monthData.기초데이터 &&
            !Array.isArray(monthData.기초데이터)
            ? (monthData.기초데이터 as BaseData)
            : undefined;

          if (baseData) {
            currentEndingStock = baseData.전체재고금액 || 0;
            currentSales = baseData.전체판매금액 || 0;
            currentBaseData = { ...baseData };
          }
        }
      }

      // 전년도 데이터
      const prevYearData = categoryDataItem[prevYear];
      if (prevYearData) {
        const monthData = prevYearData[String(latestMonth)];
        if (monthData?.기초데이터) {
          const baseData = monthData.기초데이터 &&
            typeof monthData.기초데이터 === "object" &&
            "월일수" in monthData.기초데이터 &&
            !Array.isArray(monthData.기초데이터)
            ? (monthData.기초데이터 as BaseData)
            : undefined;

          if (baseData) {
            prevEndingStock = baseData.전체재고금액 || 0;
            prevSales = baseData.전체판매금액 || 0;
            prevBaseData = { ...baseData };
          }
        }
      }

      // 재고주수 계산
      const currentWeeks = calcWeeksFromBase(
        currentBaseData.월일수 > 0 ? currentBaseData : undefined,
        "전체재고주수",
        nWeeks
      );
      const prevWeeks = calcWeeksFromBase(
        prevBaseData.월일수 > 0 ? prevBaseData : undefined,
        "전체재고주수",
        nWeeks
      );

      categoryData[categoryKey] = {
        currentWeeks: typeof currentWeeks === "number" ? currentWeeks : null,
        prevWeeks: typeof prevWeeks === "number" ? prevWeeks : null,
        currentEndingStock,
        prevEndingStock,
        currentSales,
        prevSales,
      };

      // 전체 합산
      totalCurrentEndingStock += currentEndingStock;
      totalPrevEndingStock += prevEndingStock;
      totalCurrentSales += currentSales;
      totalPrevSales += prevSales;

      if (totalCurrentBaseData.월일수 === 0 && currentBaseData.월일수 > 0) {
        totalCurrentBaseData.월일수 = currentBaseData.월일수;
      }
      totalCurrentBaseData.전체재고금액 += currentBaseData.전체재고금액;
      totalCurrentBaseData.대리상재고금액 += currentBaseData.대리상재고금액;
      totalCurrentBaseData.직영재고금액 += currentBaseData.직영재고금액;
      totalCurrentBaseData.전체판매금액 += currentBaseData.전체판매금액;
      totalCurrentBaseData.대리상판매금액 += currentBaseData.대리상판매금액;
      totalCurrentBaseData.직영판매금액 += currentBaseData.직영판매금액;

      if (totalPrevBaseData.월일수 === 0 && prevBaseData.월일수 > 0) {
        totalPrevBaseData.월일수 = prevBaseData.월일수;
      }
      totalPrevBaseData.전체재고금액 += prevBaseData.전체재고금액;
      totalPrevBaseData.대리상재고금액 += prevBaseData.대리상재고금액;
      totalPrevBaseData.직영재고금액 += prevBaseData.직영재고금액;
      totalPrevBaseData.전체판매금액 += prevBaseData.전체판매금액;
      totalPrevBaseData.대리상판매금액 += prevBaseData.대리상판매금액;
      totalPrevBaseData.직영판매금액 += prevBaseData.직영판매금액;
    });

    // 전체 재고주수 계산
    const totalCurrentWeeks = calcWeeksFromBase(
      totalCurrentBaseData.월일수 > 0 ? totalCurrentBaseData : undefined,
      "전체재고주수",
      nWeeks
    );
    const totalPrevWeeks = calcWeeksFromBase(
      totalPrevBaseData.월일수 > 0 ? totalPrevBaseData : undefined,
      "전체재고주수",
      nWeeks
    );

    return {
      currentWeeks: typeof totalCurrentWeeks === "number" ? totalCurrentWeeks : null,
      prevWeeks: typeof totalPrevWeeks === "number" ? totalPrevWeeks : null,
      currentEndingStock: totalCurrentEndingStock,
      prevEndingStock: totalPrevEndingStock,
      currentSales: totalCurrentSales,
      prevSales: totalPrevSales,
      categoryData,
    };
  }, [data, currentYear, prevYear, latestMonth, nWeeks]);

  // YOY 계산
  const deltaWeeks = brandSummary.currentWeeks !== null && brandSummary.prevWeeks !== null
    ? brandSummary.currentWeeks - brandSummary.prevWeeks
    : null;
  const endingStockYOY = brandSummary.prevEndingStock > 0
    ? (brandSummary.currentEndingStock / brandSummary.prevEndingStock) * 100
    : null;
  const salesYOY = brandSummary.prevSales > 0
    ? (brandSummary.currentSales / brandSummary.prevSales) * 100
    : null;

  // 브랜드별 스타일
  const getBrandStyle = () => {
    if (brand === "MLB") {
      return {
        primaryColor: "#2A3DA3",
        bgColor: "bg-blue-50",
        textColor: "text-white",
        borderColor: "border-blue-200",
        icon: "M",
      };
    } else if (brand === "MLB KIDS") {
      return {
        primaryColor: "#F7C948",
        bgColor: "bg-amber-50",
        textColor: "text-white",
        borderColor: "border-amber-200",
        icon: "I",
      };
    } else {
      return {
        primaryColor: "#3BAF7D",
        bgColor: "bg-emerald-50",
        textColor: "text-white",
        borderColor: "border-emerald-200",
        icon: "X",
      };
    }
  };

  const brandStyle = getBrandStyle();

  // 카테고리명 가져오기
  const getCategoryName = (key: string): string => {
    if (key === "Shoes") return t("categories.shoes");
    if (key === "Headwear") return t("categories.headwear");
    if (key === "Bag") return t("categories.bag");
    if (key === "Acc_etc") return t("categories.acc_etc");
    return key;
  };

  // 브랜드별 상세 페이지 경로
  const getBrandPath = (brandName: Brand): string => {
    if (brandName === "MLB") return "/mlb";
    if (brandName === "MLB KIDS") return "/kids";
    if (brandName === "DISCOVERY") return "/discovery";
    return "/";
  };

  // 카테고리별 YOY 계산
  const getCategoryYOY = (catData: BrandSummary["categoryData"][string]) => {
    if (!catData || catData.prevEndingStock === 0) return null;
    return (catData.currentEndingStock / catData.prevEndingStock) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* 브랜드 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
          style={{ backgroundColor: brandStyle.primaryColor }}
        >
          {brandStyle.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">{brand}</h2>
          <div className="flex gap-4 mt-1">
            <div className="text-sm">
              <span className="text-slate-500">매출 </span>
              <span className="font-semibold text-slate-900">{formatPercent(salesYOY)}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">재고 </span>
              <span className="font-semibold text-slate-900">{formatPercent(endingStockYOY)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 재고주수 요약 */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-600">{t("summary.currentYear")}</span>
          <span className="text-base font-semibold text-slate-900">
            {formatWeeks(brandSummary.currentWeeks)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-600">{t("summary.prevYear")}</span>
          <span className="text-base font-semibold text-slate-900">
            {formatWeeks(brandSummary.prevWeeks)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-semibold ${
            deltaWeeks === null
              ? "text-slate-400"
              : deltaWeeks < 0
              ? "text-blue-600"
              : "text-rose-600"
          }`}>
            {deltaWeeks === null ? "-" : deltaWeeks < 0 ? "개선" : "악화"}
          </span>
          <span
            className={`text-base font-semibold ${
              deltaWeeks === null
                ? "text-slate-400"
                : deltaWeeks < 0
                ? "text-blue-600"
                : "text-rose-600"
            }`}
          >
            {deltaWeeks === null
              ? "-"
              : deltaWeeks < 0
              ? `${deltaWeeks.toFixed(1)}주`
              : `+${deltaWeeks.toFixed(1)}주`}
          </span>
        </div>
      </div>

      {/* ACC 재무 요약 */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-600">ACC 기말재고</span>
          <span className="text-base font-semibold text-slate-900">
            {formatM(brandSummary.currentEndingStock)}M
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">ACC 판매액</span>
          <span className="text-base font-semibold text-slate-900">
            {formatM(brandSummary.currentSales)}M
          </span>
        </div>
      </div>

      {/* ACC 재고 상세보기 테이블 */}
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-700 mb-3">
          • ACC 재고 상세보기 (M, 주)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-600 font-medium"></th>
                <th className="text-right py-2 text-slate-600 font-medium">{t("summary.currentYear")}</th>
                <th className="text-right py-2 text-slate-600 font-medium">{t("summary.prevYear")}</th>
                <th className="text-right py-2 text-slate-600 font-medium">YOY</th>
              </tr>
            </thead>
            <tbody>
              {["ALL", ...CATEGORY_ORDER].map((categoryKey) => {
                if (categoryKey === "ALL") {
                  const catDeltaWeeks = deltaWeeks;
                  const catYOY = endingStockYOY;
                  return (
                    <tr key={categoryKey} className="border-b border-slate-100">
                      <td className="py-2 text-slate-900 font-medium">{t("categories.all")}</td>
                      <td className="py-2 text-right text-slate-900">
                        {formatM(brandSummary.currentEndingStock)} ({formatWeeks(brandSummary.currentWeeks)})
                      </td>
                      <td className="py-2 text-right text-slate-900">
                        {formatM(brandSummary.prevEndingStock)} ({formatWeeks(brandSummary.prevWeeks)})
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-slate-900">{formatPercent(catYOY)} </span>
                        <span
                          className={`font-semibold ${
                            catDeltaWeeks === null
                              ? "text-slate-400"
                              : catDeltaWeeks < 0
                              ? "text-blue-600"
                              : "text-rose-600"
                          }`}
                        >
                          {catDeltaWeeks === null
                            ? "-"
                            : catDeltaWeeks < 0
                            ? `(${catDeltaWeeks.toFixed(1)}주)`
                            : `(+${catDeltaWeeks.toFixed(1)}주)`}
                        </span>
                      </td>
                    </tr>
                  );
                }

                const catData = brandSummary.categoryData[categoryKey];
                if (!catData) return null;

                const catDeltaWeeks = catData.currentWeeks !== null && catData.prevWeeks !== null
                  ? catData.currentWeeks - catData.prevWeeks
                  : null;
                const catYOY = getCategoryYOY(catData);
                const categoryDisplayName = categoryKey === "Acc_etc" ? "기타 ACC" : getCategoryName(categoryKey);

                return (
                  <tr key={categoryKey} className="border-b border-slate-100">
                    <td className="py-2 text-slate-900 font-medium">{categoryDisplayName}</td>
                    <td className="py-2 text-right text-slate-900">
                      {formatM(catData.currentEndingStock)} ({formatWeeks(catData.currentWeeks)})
                    </td>
                    <td className="py-2 text-right text-slate-900">
                      {formatM(catData.prevEndingStock)} ({formatWeeks(catData.prevWeeks)})
                    </td>
                    <td className="py-2 text-right">
                      <span className="text-slate-900">{formatPercent(catYOY)} </span>
                      <span
                        className={`font-semibold ${
                          catDeltaWeeks === null
                            ? "text-slate-400"
                            : catDeltaWeeks < 0
                            ? "text-blue-600"
                            : "text-rose-600"
                        }`}
                      >
                        {catDeltaWeeks === null
                          ? "-"
                          : catDeltaWeeks < 0
                          ? `(${catDeltaWeeks.toFixed(1)}주)`
                          : `(+${catDeltaWeeks.toFixed(1)}주)`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 전체 대시보드 보기 버튼 */}
      <Link
        href={getBrandPath(brand)}
        className={`block w-full text-center py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90`}
        style={{ backgroundColor: brandStyle.primaryColor }}
      >
        전체 대시보드 보기
      </Link>
    </div>
  );
}

