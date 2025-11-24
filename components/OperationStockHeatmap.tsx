"use client";

import React, { useState, useMemo } from "react";
import {
  OperationStockWeeksData,
  OperationMonthData,
  OPERATION_CATEGORY_NAMES,
  OPERATION_CATEGORY_ORDER,
} from "@/types/operation-stock-weeks";
import { getHeatmapClass, formatWeeksValue } from "@/utils/color-helper";
import { useT } from "@/lib/i18n";

interface OperationStockHeatmapProps {
  data: OperationStockWeeksData;
  brand: string;
}

/**
 * 운영기준별 재고주수 히트맵 컴포넌트
 */
export default function OperationStockHeatmap({
  data,
  brand,
}: OperationStockHeatmapProps) {
  const t = useT();
  const [selectedCategory, setSelectedCategory] = useState<string>("Shoes");

  // 선택된 카테고리의 데이터 가져오기
  const categoryData = data[selectedCategory] || {};

  // 운영기준 목록 (알파벳 순 정렬)
  const operations = useMemo(() => {
    const ops = Object.keys(categoryData);
    return ops.sort((a, b) => {
      // "运营基准없음"을 맨 아래로
      if (a === "运营基准없음") return 1;
      if (b === "运营基准없음") return -1;
      return a.localeCompare(b);
    });
  }, [categoryData]);

  // 연도 목록 추출
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    operations.forEach((op) => {
      const opData = categoryData[op];
      if (opData) {
        Object.keys(opData).forEach((year) => {
          if (/^\d{4}$/.test(year)) {
            yearsSet.add(year);
          }
        });
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [categoryData, operations]);

  // 선택된 연도 (최신 연도)
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || "2025");

  // 월 목록 (1~12)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 카테고리명 가져오기
  const getCategoryName = (key: string): string => {
    if (key === "Shoes") return t("categories.shoes");
    if (key === "Headwear") return t("categories.headwear");
    if (key === "Bag") return t("categories.bag");
    if (key === "Acc_etc") return t("categories.acc_etc");
    return OPERATION_CATEGORY_NAMES[key] || key;
  };

  // 월별 재고주수 값 가져오기
  const getWeeksValue = (
    operation: string,
    month: number
  ): OperationMonthData | null => {
    const opData = categoryData[operation];
    if (!opData) return null;

    const yearData = opData[selectedYear];
    if (!yearData) return null;

    return yearData[String(month)] || null;
  };

  // 브랜드별 색상
  const getBrandColor = (): string => {
    if (brand === "MLB") return "bg-blue-600";
    if (brand === "MLB KIDS") return "bg-amber-500";
    if (brand === "DISCOVERY") return "bg-emerald-600";
    return "bg-slate-600";
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.08)] p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {brand} {t("categories.accessories")} 운영기준별 재고주수 히트맵
        </h2>
        <p className="text-sm text-slate-600">
          운영기준별 월별 재고주수를 시각화하여 표시합니다.
        </p>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {OPERATION_CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? `${getBrandColor()} text-white`
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {getCategoryName(cat)}
          </button>
        ))}
      </div>

      {/* 연도 선택 */}
      {years.length > 1 && (
        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 mr-3">
            연도:
          </label>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 rounded-md text-sm font-medium mr-2 transition-colors ${
                selectedYear === year
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* 히트맵 테이블 */}
      {operations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-100 border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-800">
                  운영기준
                </th>
                {months.map((month) => (
                  <th
                    key={month}
                    className="border border-slate-300 px-3 py-3 text-center text-sm font-semibold text-slate-800 bg-slate-100"
                  >
                    {month}월
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={operation} className="hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {operation === "运营基准없음" ? "운영기준없음" : operation}
                  </td>
                  {months.map((month) => {
                    const monthData = getWeeksValue(operation, month);
                    const weeksValue = monthData?.stock_weeks;
                    const isOutlier = monthData?.is_outlier_100wks || false;

                    // 색상 클래스
                    const colorClass = getHeatmapClass(weeksValue);

                    // 100주 이상 경고 스타일
                    const outlierStyle = isOutlier
                      ? "ring-2 ring-rose-500 ring-inset"
                      : "";

                    return (
                      <td
                        key={month}
                        className={`border border-slate-200 px-3 py-3 text-center text-sm ${colorClass} ${outlierStyle} relative group`}
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-semibold ${
                              isOutlier ? "text-rose-900" : ""
                            }`}
                          >
                            {formatWeeksValue(weeksValue, t)}
                          </span>
                          {isOutlier && (
                            <span className="text-xs text-rose-700 font-medium">
                              ⚠️
                            </span>
                          )}
                        </div>

                        {/* 툴팁 */}
                        {monthData && (
                          <div className="absolute hidden group-hover:block z-20 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full whitespace-nowrap shadow-lg">
                            <div>재고주수: {formatWeeksValue(weeksValue, t)}</div>
                            <div>
                              재고금액:{" "}
                              {(monthData.total_stock / 1_000_000).toFixed(1)}M
                            </div>
                            <div>
                              판매금액:{" "}
                              {(monthData.total_sales / 1_000_000).toFixed(1)}M
                            </div>
                            {isOutlier && (
                              <div className="text-rose-300 font-semibold">
                                ⚠️ 100주 이상
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          해당 카테고리에 데이터가 없습니다.
        </div>
      )}

      {/* 범례 */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <span className="text-slate-600 font-medium">
            {t("summary.stockWeeks")}:
          </span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-200 rounded border border-slate-300"></div>
            <span className="text-slate-600">{t("legend.weeks0")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded border border-slate-300"></div>
            <span className="text-slate-600">{t("legend.weeks1to19")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-100 rounded border border-slate-300"></div>
            <span className="text-slate-600">{t("legend.weeks20to29")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-100 rounded border border-slate-300"></div>
            <span className="text-slate-600">{t("legend.weeks30to39")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 rounded border border-slate-300"></div>
            <span className="text-slate-600">{t("legend.weeks40to49")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-300 rounded border border-slate-300"></div>
            <span className="text-slate-600">{t("legend.weeks50plus")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-300 rounded border-2 border-rose-500"></div>
            <span className="text-slate-600">100주 이상 (경고)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

