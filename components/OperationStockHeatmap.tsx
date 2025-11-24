"use client";

import React, { useState, useMemo } from "react";
import {
  OperationStockWeeksData,
  OperationMonthData,
  OPERATION_CATEGORY_NAMES,
  OPERATION_CATEGORY_ORDER,
  StockType,
  STOCK_TYPE_NAMES,
  STOCK_TYPE_ORDER,
} from "@/types/operation-stock-weeks";
import { getHeatmapClass, formatWeeksValue } from "@/utils/color-helper";
import { useT } from "@/lib/i18n";

interface OperationStockHeatmapProps {
  data: OperationStockWeeksData;
  brand: string;
}

/**
 * 운영기준별 재고주수 히트맵 컴포넌트 (단일 테이블 구조)
 */
export default function OperationStockHeatmap({
  data,
  brand,
}: OperationStockHeatmapProps) {
  const t = useT();
  const [selectedCategory, setSelectedCategory] = useState<string>("Shoes");
  const [selectedStockType, setSelectedStockType] = useState<StockType>("전체");

  const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // 선택된 카테고리의 데이터 가져오기
  const categoryData = data[selectedCategory] || {};

  // 실제 데이터에서 운영기준 목록 가져오기 (동적으로 추출)
  const operations = useMemo(() => {
    const ops = Object.keys(categoryData);
    // 정의된 순서대로 정렬
    const definedOps: string[] = ["26SS", "CARE", "DONE", "FOCUS", "INTRO", "OUTLET"];
    const sortedOps = definedOps.filter(op => ops.includes(op));
    const remainingOps = ops.filter(op => !definedOps.includes(op));
    return [...sortedOps, ...remainingOps];
  }, [categoryData]);

  // 재고주수 값 가져오기 헬퍼 함수
  const getStockWeeks = (
    year: number,
    month: number,
    operation: string
  ): OperationMonthData | null => {
    const opData = categoryData[operation];
    if (!opData) return null;

    const yearData = opData[String(year)];
    if (!yearData) return null;

    const monthData = yearData[String(month)];
    if (!monthData) return null;

    return monthData[selectedStockType] || null;
  };

  // 전년 대비 증감 계산
  const getYoYDiff = (
    operation: string,
    month: number
  ): { diff: number | null; is2025Missing: boolean; is2024Missing: boolean } => {
    const data2025 = getStockWeeks(2025, month, operation);
    const data2024 = getStockWeeks(2024, month, operation);

    const weeks2025 = data2025?.stock_weeks;
    const weeks2024 = data2024?.stock_weeks;

    if (weeks2025 == null || weeks2024 == null) {
      return {
        diff: null,
        is2025Missing: weeks2025 == null,
        is2024Missing: weeks2024 == null,
      };
    }

    return {
      diff: weeks2025 - weeks2024,
      is2025Missing: false,
      is2024Missing: false,
    };
  };

  // 증감 색상 클래스
  const getDiffColorClass = (diff: number | null): string => {
    if (diff === null) return "bg-slate-100";
    if (diff > 5) return "bg-red-200";
    if (diff > 2) return "bg-orange-200";
    if (diff > 0) return "bg-yellow-100";
    if (diff === 0) return "bg-slate-100";
    if (diff > -2) return "bg-green-100";
    if (diff > -5) return "bg-green-200";
    return "bg-green-300";
  };

  // 카테고리명 가져오기
  const getCategoryName = (key: string): string => {
    if (key === "Shoes") return t("categories.shoes");
    if (key === "Headwear") return t("categories.headwear");
    if (key === "Bag") return t("categories.bag");
    if (key === "Acc_etc") return t("categories.acc_etc");
    return OPERATION_CATEGORY_NAMES[key] || key;
  };

  // 브랜드별 색상
  const getBrandColor = (): string => {
    if (brand === "MLB") return "bg-blue-900"; // MLB 네이비 색상
    if (brand === "MLB KIDS") return "bg-amber-500";
    if (brand === "DISCOVERY") return "bg-emerald-600";
    return "bg-slate-600";
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.08)] p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <span className={`${getBrandColor()} text-white w-8 h-8 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0`}>
            4
          </span>
          {brand} 악세사리 운영기준별 재고주수 분석
        </h2>
        <p className="text-sm text-slate-600">
          운영기준별 월별 재고주수를 2025/2024/전년 대비 증감으로 비교합니다.
        </p>
      </div>

      {/* 필터 섹션 */}
      <div className="space-y-4 mb-6">
        {/* 아이템 탭 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            아이템 분류
          </label>
          <div className="flex gap-2 flex-wrap">
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
        </div>

        {/* 재고 구분 토글 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            재고 구분
          </label>
          <div className="flex gap-2 flex-wrap">
            {STOCK_TYPE_ORDER.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedStockType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStockType === type
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {STOCK_TYPE_NAMES[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 단일 통합 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          {/* 테이블 헤더 */}
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-slate-800 border border-slate-700 px-4 py-3 text-center text-sm font-semibold text-white">
                운영기준
              </th>
              {MONTHS.map((month) => (
                <th
                  key={month}
                  className="border border-slate-700 px-3 py-3 text-center text-sm font-semibold text-white bg-slate-800"
                >
                  {month}월
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* [1] 2025년 전체 재고주수 그룹 */}
            <tr>
              <th
                colSpan={13}
                className="bg-slate-100 border border-slate-300 px-4 py-3 text-left text-base font-bold text-slate-900"
              >
                2025년 전체 재고주수
              </th>
            </tr>
            {operations.map((operation) => (
              <tr key={`2025-${operation}`} className="hover:bg-slate-50">
                <td className="sticky left-0 z-10 bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                  {operation === "运营基准없음" ? "운영기준없음" : operation}
                </td>
                {MONTHS.map((month) => {
                  const monthData = getStockWeeks(2025, month, operation);
                  const weeksValue = monthData?.stock_weeks;
                  const isOutlier = monthData?.is_outlier_100wks || false;
                  const colorClass = getHeatmapClass(weeksValue);
                  const outlierStyle = isOutlier
                    ? "ring-2 ring-rose-500 ring-inset"
                    : "";

                  return (
                    <td
                      key={month}
                      className={`border border-slate-200 px-3 py-3 text-center text-sm ${colorClass} ${outlierStyle}`}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-semibold ${
                            isOutlier ? "text-rose-900" : ""
                          }`}
                        >
                          {formatWeeksValue(weeksValue ?? null, t)}
                        </span>
                        {isOutlier && (
                          <span className="text-xs text-rose-700 font-medium">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* [2] 2024년 전체 재고주수 그룹 */}
            <tr>
              <th
                colSpan={13}
                className="bg-slate-100 border border-slate-300 px-4 py-3 text-left text-base font-bold text-slate-900"
              >
                2024년 전체 재고주수
              </th>
            </tr>
            {operations.map((operation) => (
              <tr key={`2024-${operation}`} className="hover:bg-slate-50">
                <td className="sticky left-0 z-10 bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                  {operation === "运营基准없음" ? "운영기준없음" : operation}
                </td>
                {MONTHS.map((month) => {
                  const monthData = getStockWeeks(2024, month, operation);
                  const weeksValue = monthData?.stock_weeks;
                  const isOutlier = monthData?.is_outlier_100wks || false;
                  const colorClass = getHeatmapClass(weeksValue);
                  const outlierStyle = isOutlier
                    ? "ring-2 ring-rose-500 ring-inset"
                    : "";

                  return (
                    <td
                      key={month}
                      className={`border border-slate-200 px-3 py-3 text-center text-sm ${colorClass} ${outlierStyle}`}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-semibold ${
                            isOutlier ? "text-rose-900" : ""
                          }`}
                        >
                          {formatWeeksValue(weeksValue ?? null, t)}
                        </span>
                        {isOutlier && (
                          <span className="text-xs text-rose-700 font-medium">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* [3] 전년 대비 증감 그룹 */}
            <tr>
              <th
                colSpan={13}
                className="bg-amber-100 border border-slate-300 px-4 py-3 text-center text-base font-bold text-slate-900"
              >
                전년 대비 증감
              </th>
            </tr>
            {operations.map((operation) => (
              <tr key={`diff-${operation}`} className="hover:bg-slate-50">
                <td className="sticky left-0 z-10 bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                  {operation === "运营基准없음" ? "운영기준없음" : operation}
                </td>
                {MONTHS.map((month) => {
                  const { diff, is2025Missing, is2024Missing } = getYoYDiff(
                    operation,
                    month
                  );
                  const colorClass = getDiffColorClass(diff);

                  return (
                    <td
                      key={month}
                      className={`border border-slate-200 px-3 py-3 text-center text-sm font-bold ${colorClass}`}
                    >
                      {diff !== null
                        ? diff > 0
                          ? `+${diff.toFixed(1)}주`
                          : diff < 0
                          ? `${diff.toFixed(1)}주`
                          : "0주"
                        : is2025Missing && is2024Missing
                        ? "-"
                        : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="space-y-4">
          {/* 재고주수 범례 */}
          <div>
            <span className="text-sm text-slate-600 font-medium block mb-2">
              재고주수 색상:
            </span>
            <div className="flex flex-wrap gap-4 items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-200 rounded border border-slate-300"></div>
                <span className="text-slate-600">0주</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded border border-slate-300"></div>
                <span className="text-slate-600">1~19주</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-100 rounded border border-slate-300"></div>
                <span className="text-slate-600">20~29주</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded border border-slate-300"></div>
                <span className="text-slate-600">30~39주</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded border border-slate-300"></div>
                <span className="text-slate-600">40~49주</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-300 rounded border border-slate-300"></div>
                <span className="text-slate-600">50주 이상</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-300 rounded border-2 border-rose-500"></div>
                <span className="text-slate-600">100주 이상 (경고)</span>
              </div>
            </div>
          </div>

          {/* 증감 범례 */}
          <div>
            <span className="text-sm text-slate-600 font-medium block mb-2">
              전년 대비 증감 색상:
            </span>
            <div className="flex flex-wrap gap-4 items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-300 rounded border border-slate-300"></div>
                <span className="text-slate-600">크게 개선 (&lt; -5주)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-200 rounded border border-slate-300"></div>
                <span className="text-slate-600">개선 (-2~-5주)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded border border-slate-300"></div>
                <span className="text-slate-600">소폭 개선 (-2주 미만)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-100 rounded border border-slate-300"></div>
                <span className="text-slate-600">소폭 악화 (0~2주)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-200 rounded border border-slate-300"></div>
                <span className="text-slate-600">악화 (2~5주)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-200 rounded border border-slate-300"></div>
                <span className="text-slate-600">크게 악화 (&gt; 5주)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
