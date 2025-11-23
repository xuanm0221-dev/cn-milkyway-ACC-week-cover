"use client";

import React, { useMemo } from "react";
import { StockWeeksData, CATEGORY_ORDER, CATEGORY_NAMES } from "@/types/stock-weeks";
import { calcWeeksFromBase } from "@/utils/calc-weeks";

interface InventorySummaryCardsProps {
  data: StockWeeksData;
  brand: string;
  nWeeks: number;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
}

interface ItemSummary {
  itemName: string;
  itemKey: string;
  currentWeeks: number | null;
  prevWeeks: number | null;
  currentEndingStock: number; // 원 단위
  prevEndingStock: number; // 원 단위
  currentSales: number; // 원 단위
  prevSales: number; // 원 단위
}

/**
 * 숫자를 M 단위로 포맷팅 (백만 단위)
 */
const formatM = (value: number): string => {
  const valueM = value / 1_000_000;
  return `${valueM.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}M`;
};

/**
 * 재고주수를 포맷팅
 */
const formatWeeks = (value: number | null): string => {
  if (value === null || isNaN(value)) return "-";
  return `${value.toFixed(1)}주`;
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
 * 아이템별 SUMMARY 카드 컴포넌트
 */
export default function InventorySummaryCards({
  data,
  brand,
  nWeeks,
  selectedMonth,
  onMonthChange,
}: InventorySummaryCardsProps) {
  // 기준 연도와 전년도 추출
  const { currentYear, prevYear } = useMemo(() => {
    const years = new Set<string>();
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
    return {
      currentYear: sortedYears[0] || "2025",
      prevYear: sortedYears[1] || "2024",
    };
  }, [data]);


  // 각 아이템별 데이터 집계 (선택된 월 기준)
  const itemSummaries = useMemo(() => {
    const summaries: ItemSummary[] = [];

    // 전체(ALL) 데이터 집계를 위한 변수
    let totalCurrentEndingStock = 0;
    let totalPrevEndingStock = 0;
    let totalCurrentSales = 0;
    let totalPrevSales = 0;
    let totalCurrentBaseData = {
      월일수: 0,
      전체재고금액: 0,
      대리상재고금액: 0,
      직영재고금액: 0,
      전체판매금액: 0,
      대리상판매금액: 0,
      직영판매금액: 0,
    };
    let totalPrevBaseData = {
      월일수: 0,
      전체재고금액: 0,
      대리상재고금액: 0,
      직영재고금액: 0,
      전체판매금액: 0,
      대리상판매금액: 0,
      직영판매금액: 0,
    };

    CATEGORY_ORDER.forEach((categoryKey) => {
      const categoryData = data[categoryKey];
      if (!categoryData) return;

      const itemName = CATEGORY_NAMES[categoryKey] || categoryKey;
      let currentWeeks: number | null = null;
      let prevWeeks: number | null = null;
      let currentEndingStock = 0;
      let prevEndingStock = 0;
      let currentSales = 0;
      let prevSales = 0;

      // 현재 연도 데이터 (선택된 월)
      const currentYearData = categoryData[currentYear];
      if (currentYearData) {
        const monthData = currentYearData[String(selectedMonth)];
        if (monthData?.기초데이터) {
          // 기말재고: 선택된 월의 월말 재고금액
          currentEndingStock = monthData.기초데이터.전체재고금액 || 0;
          
          // 판매액: 선택된 월의 당월 판매매출
          currentSales = monthData.기초데이터.전체판매금액 || 0;

          // 재고주수 계산
          const weeks = calcWeeksFromBase(
            monthData.기초데이터,
            "전체재고주수",
            nWeeks
          );
          if (typeof weeks === "number" && !isNaN(weeks)) {
            currentWeeks = weeks;
          }
        }
      }

      // 전년도 데이터 (선택된 월)
      const prevYearData = categoryData[prevYear];
      if (prevYearData) {
        const monthData = prevYearData[String(selectedMonth)];
        if (monthData?.기초데이터) {
          // 기말재고: 선택된 월의 월말 재고금액
          prevEndingStock = monthData.기초데이터.전체재고금액 || 0;
          
          // 판매액: 선택된 월의 당월 판매매출
          prevSales = monthData.기초데이터.전체판매금액 || 0;

          // 재고주수 계산
          const weeks = calcWeeksFromBase(
            monthData.기초데이터,
            "전체재고주수",
            nWeeks
          );
          if (typeof weeks === "number" && !isNaN(weeks)) {
            prevWeeks = weeks;
          }
        }
      }

      summaries.push({
        itemName,
        itemKey: categoryKey,
        currentWeeks,
        prevWeeks,
        currentEndingStock,
        prevEndingStock,
        currentSales,
        prevSales,
      });

      // 전체 합산을 위한 데이터 누적 (이미 가져온 currentYearData와 prevYearData 재사용)
      // 현재 연도 데이터
      if (currentYearData) {
        const monthData = currentYearData[String(selectedMonth)];
        if (monthData?.기초데이터) {
          totalCurrentEndingStock += monthData.기초데이터.전체재고금액 || 0;
          totalCurrentSales += monthData.기초데이터.전체판매금액 || 0;
          
          // 기초데이터 합산 (월일수는 첫 번째 아이템의 값 사용)
          if (totalCurrentBaseData.월일수 === 0) {
            totalCurrentBaseData.월일수 = monthData.기초데이터.월일수 || 0;
          }
          totalCurrentBaseData.전체재고금액 += monthData.기초데이터.전체재고금액 || 0;
          totalCurrentBaseData.대리상재고금액 += monthData.기초데이터.대리상재고금액 || 0;
          totalCurrentBaseData.직영재고금액 += monthData.기초데이터.직영재고금액 || 0;
          totalCurrentBaseData.전체판매금액 += monthData.기초데이터.전체판매금액 || 0;
          totalCurrentBaseData.대리상판매금액 += monthData.기초데이터.대리상판매금액 || 0;
          totalCurrentBaseData.직영판매금액 += monthData.기초데이터.직영판매금액 || 0;
        }
      }

      // 전년도 데이터
      if (prevYearData) {
        const monthData = prevYearData[String(selectedMonth)];
        if (monthData?.기초데이터) {
          totalPrevEndingStock += monthData.기초데이터.전체재고금액 || 0;
          totalPrevSales += monthData.기초데이터.전체판매금액 || 0;
          
          // 기초데이터 합산
          if (totalPrevBaseData.월일수 === 0) {
            totalPrevBaseData.월일수 = monthData.기초데이터.월일수 || 0;
          }
          totalPrevBaseData.전체재고금액 += monthData.기초데이터.전체재고금액 || 0;
          totalPrevBaseData.대리상재고금액 += monthData.기초데이터.대리상재고금액 || 0;
          totalPrevBaseData.직영재고금액 += monthData.기초데이터.직영재고금액 || 0;
          totalPrevBaseData.전체판매금액 += monthData.기초데이터.전체판매금액 || 0;
          totalPrevBaseData.대리상판매금액 += monthData.기초데이터.대리상판매금액 || 0;
          totalPrevBaseData.직영판매금액 += monthData.기초데이터.직영판매금액 || 0;
        }
      }
    });

    // 전체(ALL) 재고주수 계산
    let allCurrentWeeks: number | null = null;
    let allPrevWeeks: number | null = null;

    if (totalCurrentBaseData.월일수 > 0) {
      const weeks = calcWeeksFromBase(
        totalCurrentBaseData,
        "전체재고주수",
        nWeeks
      );
      if (typeof weeks === "number" && !isNaN(weeks)) {
        allCurrentWeeks = weeks;
      }
    }

    if (totalPrevBaseData.월일수 > 0) {
      const weeks = calcWeeksFromBase(
        totalPrevBaseData,
        "전체재고주수",
        nWeeks
      );
      if (typeof weeks === "number" && !isNaN(weeks)) {
        allPrevWeeks = weeks;
      }
    }

    // 전체(ALL) 카드를 맨 앞에 추가
    const allSummary: ItemSummary = {
      itemName: "전체",
      itemKey: "ALL",
      currentWeeks: allCurrentWeeks,
      prevWeeks: allPrevWeeks,
      currentEndingStock: totalCurrentEndingStock,
      prevEndingStock: totalPrevEndingStock,
      currentSales: totalCurrentSales,
      prevSales: totalPrevSales,
    };
    summaries.unshift(allSummary);

    return summaries;
  }, [data, currentYear, prevYear, nWeeks, selectedMonth]);

  // 아이템 아이콘 (간단한 텍스트 아이콘으로 대체)
  const getItemIcon = (itemKey: string) => {
    switch (itemKey) {
      case "ALL":
        return "📊";
      case "Shoes":
        return "👟";
      case "Headwear":
        return "🧢";
      case "Bag":
        return "👜";
      case "Acc_etc":
        return "⭐";
      default:
        return "📦";
    }
  };

  // 브랜드별 연한 배경색 가져오기
  const getBrandLightBgColor = (): string => {
    if (brand === "MLB") {
      return "bg-blue-50"; // #1e3a8a의 연한 버전
    } else if (brand === "MLB KIDS") {
      return "bg-amber-50"; // #fbbf24의 연한 버전
    } else if (brand === "DISCOVERY") {
      return "bg-emerald-50"; // #10b981의 연한 버전
    }
    return "bg-slate-50"; // 기본값
  };

  return (
    <div>
      {/* 카드 그리드 */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
      {itemSummaries.map((item) => {
        // YOY 계산
        const deltaWeeks = item.currentWeeks !== null && item.prevWeeks !== null
          ? item.currentWeeks - item.prevWeeks
          : null;
        const endingStockYOY = item.prevEndingStock > 0
          ? (item.currentEndingStock / item.prevEndingStock) * 100
          : null;
        const salesYOY = item.prevSales > 0
          ? (item.currentSales / item.prevSales) * 100
          : null;

        // "전체" 카드에만 브랜드별 연한 배경색 적용
        const isAllCard = item.itemKey === "ALL";
        const cardBgClass = isAllCard 
          ? `${getBrandLightBgColor()} border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] p-5`
          : "bg-white border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] p-5";

        return (
          <div
            key={item.itemKey}
            className={cardBgClass}
          >
            {/* 아이템명 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{getItemIcon(item.itemKey)}</span>
              <h3 className="text-base font-semibold text-slate-900">
                {item.itemName}
              </h3>
            </div>

            {/* 헤더 */}
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-2 pb-2 border-b border-slate-100">
              <div className="w-12"></div>
              <div className="flex-1 text-right">재고주수</div>
              <div className="flex-1 text-right">기말재고(M)</div>
              <div className="flex-1 text-right">판매액(M)</div>
            </div>

            {/* 데이터 테이블 */}
            <div className="space-y-2">
              {/* 당년 행 */}
              <div className="flex items-center gap-3 text-xs">
                <div className="w-12 text-slate-500">당년</div>
                <div className="flex-1 text-sm md:text-base font-semibold text-slate-900 text-right">
                  {formatWeeks(item.currentWeeks)}
                </div>
                <div className="flex-1 text-sm md:text-base font-semibold text-slate-900 text-right">
                  {formatM(item.currentEndingStock)}
                </div>
                <div className="flex-1 text-sm md:text-base font-semibold text-slate-900 text-right">
                  {formatM(item.currentSales)}
                </div>
              </div>

              {/* 전년 행 */}
              <div className="flex items-center gap-3 text-xs">
                <div className="w-12 text-slate-500">전년</div>
                <div className="flex-1 text-sm md:text-base font-semibold text-slate-900 text-right">
                  {formatWeeks(item.prevWeeks)}
                </div>
                <div className="flex-1 text-sm md:text-base font-semibold text-slate-900 text-right">
                  {formatM(item.prevEndingStock)}
                </div>
                <div className="flex-1 text-sm md:text-base font-semibold text-slate-900 text-right">
                  {formatM(item.prevSales)}
                </div>
              </div>

              {/* YOY 행 */}
              <div className="flex items-center gap-3 text-xs pt-2 border-t border-slate-100">
                <div className="w-12 text-slate-500">YOY</div>
                <div className={`flex-1 text-sm md:text-base font-semibold text-right ${
                  deltaWeeks === null
                    ? "text-slate-400"
                    : deltaWeeks > 0
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}>
                  {deltaWeeks === null
                    ? "-"
                    : deltaWeeks < 0
                    ? `△${Math.abs(deltaWeeks).toFixed(1)}주`
                    : `${deltaWeeks > 0 ? "+" : ""}${deltaWeeks.toFixed(1)}주`}
                </div>
                <div className="flex-1 text-sm md:text-base font-semibold text-slate-900 text-right">
                  {formatPercent(endingStockYOY)}
                </div>
                <div className="flex-1 text-sm md:text-base font-semibold text-slate-900 text-right">
                  {formatPercent(salesYOY)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

