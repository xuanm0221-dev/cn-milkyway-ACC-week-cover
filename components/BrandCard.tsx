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
 * 숫자를 천 단위로 포맷팅 (천 단위 구분자 포함, K 단위)
 */
const formatK = (value: number): string => {
  const valueK = value / 1_000;
  return valueK.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
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
        hoverColor: "#1f2d7a",
        bgColor: "bg-blue-50",
        textColor: "text-white",
        borderColor: "border-blue-200",
        icon: "M",
        accBox1: "bg-gradient-to-br from-sky-50 to-indigo-50",
        accBox2: "bg-gradient-to-br from-indigo-50 to-purple-50",
        totalRowBg: "bg-blue-50",
        totalRowBorder: "#2A3DA3",
      };
    } else if (brand === "MLB KIDS") {
      return {
        primaryColor: "#F7C948",
        hoverColor: "#e6b835",
        bgColor: "bg-amber-50",
        textColor: "text-white",
        borderColor: "border-amber-200",
        icon: "I",
        accBox1: "bg-gradient-to-br from-amber-50 to-yellow-50",
        accBox2: "bg-gradient-to-br from-yellow-50 to-orange-50",
        totalRowBg: "bg-amber-50",
        totalRowBorder: "#F7C948",
      };
    } else {
      return {
        primaryColor: "#3BAF7D",
        hoverColor: "#2d8f65",
        bgColor: "bg-emerald-50",
        textColor: "text-white",
        borderColor: "border-emerald-200",
        icon: "X",
        accBox1: "bg-gradient-to-br from-emerald-50 to-green-50",
        accBox2: "bg-gradient-to-br from-green-50 to-teal-50",
        totalRowBg: "bg-emerald-50",
        totalRowBorder: "#3BAF7D",
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

  // 매출/재고 퍼센트 계산 (YOY)
  const salesPercent = salesYOY ? Math.round(salesYOY) : null;
  const stockPercent = endingStockYOY ? Math.round(endingStockYOY) : null;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-7">
      {/* 1. 카드 상단 영역: 브랜드 아이콘 + KPI 뱃지 */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* 브랜드 아이콘 */}
          <div
            className="rounded-xl w-[60px] h-[60px] flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: brandStyle.primaryColor }}
          >
            {brandStyle.icon}
          </div>
          {/* 브랜드명 + KPI */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{brand}</h2>
            <div className="flex items-center gap-2 mt-1">
              {/* 매출 뱃지 */}
              <div className="rounded-lg px-2.5 py-1 bg-green-100">
                <span className="text-xs font-semibold text-teal-600">
                  매출 {salesPercent !== null ? `${salesPercent}%` : "-"}
                </span>
              </div>
              {/* 재고 뱃지 */}
              <div className="rounded-lg px-2.5 py-1 bg-blue-50">
                <span className="text-xs font-semibold text-blue-600">
                  재고 {stockPercent !== null ? `${stockPercent}%` : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 당년 / 전년 / 개선 영역 */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-purple-50 border-4 border-slate-200 p-4 mt-4">
        <div className="grid grid-cols-3 gap-0">
          {/* 당년 */}
          <div className="pr-4 border-r border-slate-200 text-center">
            <div className="text-xs text-slate-500 mb-1">당년</div>
            <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
              <span>{brandSummary.currentWeeks !== null ? brandSummary.currentWeeks.toFixed(1) : "-"}</span>
              {brandSummary.currentWeeks !== null && <span className="text-xs text-slate-500 font-normal">주</span>}
            </div>
          </div>
          {/* 전년 */}
          <div className="px-4 border-r border-slate-200 text-center">
            <div className="text-xs text-slate-500 mb-1">전년</div>
            <div className="text-2xl font-bold text-slate-700 flex items-center justify-center gap-1">
              <span>{brandSummary.prevWeeks !== null ? brandSummary.prevWeeks.toFixed(1) : "-"}</span>
              {brandSummary.prevWeeks !== null && <span className="text-xs text-slate-500 font-normal">주</span>}
            </div>
          </div>
          {/* 개선/악화 */}
          <div className="pl-4 text-center">
            <div className={`text-xs mb-1 ${
              deltaWeeks === null
                ? "text-slate-400"
                : deltaWeeks < 0
                ? "text-green-600"
                : "text-red-600"
            }`}>
              {deltaWeeks === null ? "-" : deltaWeeks < 0 ? "개선" : "악화"}
            </div>
            <div
              className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                deltaWeeks === null
                  ? "text-slate-400"
                  : deltaWeeks < 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              <span>
                {deltaWeeks === null
                  ? "-"
                  : deltaWeeks < 0
                  ? `△${Math.abs(deltaWeeks).toFixed(1)}`
                  : `+${deltaWeeks.toFixed(1)}`}
              </span>
              {deltaWeeks !== null && (
                <span className={`text-xs font-normal ${
                  deltaWeeks < 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  주
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ACC 기말재고 / ACC 판매액 작은 카드 2개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        {/* ACC 기말재고 */}
        <div className={`rounded-2xl p-4 ${brandStyle.accBox1} border-4 border-slate-200 shadow-sm text-center`}>
          <div className="text-xs text-slate-500 mb-1">ACC 기말재고</div>
          <div className="text-lg font-semibold text-slate-900">
            {formatK(brandSummary.currentEndingStock)}K
          </div>
        </div>
        {/* ACC 판매액 */}
        <div className={`rounded-2xl p-4 ${brandStyle.accBox2} border-4 border-slate-200 shadow-sm text-center`}>
          <div className="text-xs text-slate-500 mb-1">ACC 판매액</div>
          <div className="text-lg font-semibold text-slate-900">
            {formatK(brandSummary.currentSales)}K
          </div>
        </div>
      </div>

      {/* 4. ACC 재고 상세보기 테이블 */}
      <div className="mt-6">
        <div className="text-sm font-bold text-slate-600 mb-2">
          • ACC 재고 상세보기 (주)
        </div>
        {/* 헤더 행 */}
        <div className="grid grid-cols-[minmax(60px,1.1fr)_minmax(90px,1.2fr)_minmax(90px,1.2fr)_minmax(70px,0.9fr)] text-xs font-bold text-slate-700 bg-slate-100 rounded-xl px-3 py-2 mt-4 mb-2">
          <div>항목</div>
          <div className="text-right">당년</div>
          <div className="text-right">전년</div>
          <div className="text-right">YOY</div>
        </div>
        <div className="space-y-2">
          {["ALL", ...CATEGORY_ORDER].map((categoryKey) => {
            if (categoryKey === "ALL") {
              const catDeltaWeeks = deltaWeeks;
              const catYOY = endingStockYOY;
              return (
                <div
                  key={categoryKey}
                  className={`grid grid-cols-[minmax(60px,1.1fr)_minmax(90px,1.2fr)_minmax(90px,1.2fr)_minmax(70px,0.9fr)] items-center gap-2 rounded-2xl ${brandStyle.totalRowBg} border-2 px-3 py-2 mb-2`}
                  style={{ borderColor: brandStyle.totalRowBorder }}
                >
                  <div className="text-xs font-bold text-slate-900">{t("categories.all")}</div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{formatK(brandSummary.currentEndingStock)}K</div>
                    <div className="text-sm font-bold text-blue-600">{formatWeeks(brandSummary.currentWeeks)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{formatK(brandSummary.prevEndingStock)}K</div>
                    <div className="text-sm font-bold text-blue-600">{formatWeeks(brandSummary.prevWeeks)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${
                      catYOY === null
                        ? "text-slate-400"
                        : catYOY >= 100
                        ? "text-red-500"
                        : "text-emerald-600"
                    }`}>
                      {formatPercent(catYOY)}
                    </div>
                    <div
                      className={`text-[11px] ${
                        catDeltaWeeks === null
                          ? "text-slate-400"
                          : catDeltaWeeks >= 0
                          ? "text-red-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {catDeltaWeeks === null
                        ? "-"
                        : catDeltaWeeks >= 0
                        ? `+${catDeltaWeeks.toFixed(1)}주`
                        : `△${Math.abs(catDeltaWeeks).toFixed(1)}주`}
                    </div>
                  </div>
                </div>
              );
            }

            const catData = brandSummary.categoryData[categoryKey];
            if (!catData) return null;

            const catDeltaWeeks = catData.currentWeeks !== null && catData.prevWeeks !== null
              ? catData.currentWeeks - catData.prevWeeks
              : null;
            const catYOY = getCategoryYOY(catData);
            const categoryDisplayName = categoryKey === "Acc_etc" ? "기타" : getCategoryName(categoryKey);

            return (
              <div
                key={categoryKey}
                className="grid grid-cols-[minmax(60px,1.1fr)_minmax(90px,1.2fr)_minmax(90px,1.2fr)_minmax(70px,0.9fr)] items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 mb-2"
              >
                <div className="text-xs font-bold text-slate-900">{categoryDisplayName}</div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{formatK(catData.currentEndingStock)}K</div>
                  <div className="text-sm font-bold text-blue-600">{formatWeeks(catData.currentWeeks)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">{formatK(catData.prevEndingStock)}K</div>
                  <div className="text-sm font-bold text-blue-600">{formatWeeks(catData.prevWeeks)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${
                    catYOY === null
                      ? "text-slate-400"
                      : catYOY >= 100
                      ? "text-red-500"
                      : "text-emerald-600"
                  }`}>
                    {formatPercent(catYOY)}
                  </div>
                  <div
                    className={`text-[11px] ${
                      catDeltaWeeks === null
                        ? "text-slate-400"
                        : catDeltaWeeks >= 0
                        ? "text-red-500"
                        : "text-emerald-600"
                    }`}
                  >
                    {catDeltaWeeks === null
                      ? "-"
                      : catDeltaWeeks >= 0
                      ? `+${catDeltaWeeks.toFixed(1)}주`
                      : `${catDeltaWeeks.toFixed(1)}주`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 하단 "전체 대시보드 보기" 버튼 */}
      <div className="mt-6">
        <Link
          href={getBrandPath(brand)}
          className="block rounded-2xl py-3.5 px-3 text-sm font-semibold text-white text-center transition-colors hover:opacity-90"
          style={{ 
            backgroundColor: brandStyle.primaryColor,
          }}
        >
          전체 대시보드 보기
        </Link>
      </div>
    </div>
  );
}

