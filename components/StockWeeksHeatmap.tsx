"use client";

import React, { useState } from "react";
import { StockWeeksData, Brand, CATEGORY_NAMES, CATEGORY_ORDER, MonthData } from "@/types/stock-weeks";
import { getCellColor, getHeatmapClass, formatWeeksValue } from "@/utils/color-helper";
import { calcWeeksFromBase, WeeksKind } from "@/utils/calc-weeks";
import { formatSubcategoryLabel } from "@/utils/subcategory-names";
import InventoryMonthlySummaryCard from "@/components/inventory/InventoryMonthlySummaryCard";
import InventorySummaryCards from "@/components/inventory/InventorySummaryCards";
import { useT, formatNumber } from "@/lib/i18n";
import { useLanguageStore } from "@/lib/store/language-store";
import Link from "next/link";

interface StockWeeksHeatmapProps {
  data: StockWeeksData;
  brand: Brand;
  nWeeks: number;
  onNWeeksChange?: (nWeeks: number) => void;
  // 브랜드 선택 탭 (메인 페이지에서만 사용)
  brands?: Brand[];
  selectedBrand?: Brand;
  onBrandChange?: (brand: Brand) => void;
  // 홈 버튼 표시 여부 (브랜드별 상세 페이지에서만 사용)
  showHomeButton?: boolean;
}

/**
 * 재고주수 히트맵 컴포넌트
 */
export default function StockWeeksHeatmap({ 
  data, 
  brand, 
  nWeeks,
  onNWeeksChange,
  brands,
  selectedBrand,
  onBrandChange,
  showHomeButton = false
}: StockWeeksHeatmapProps) {
  const t = useT();
  const { language, setLanguage } = useLanguageStore();
  
  // 중분류 탭 선택 상태 ("전체" | "Shoes" | "Headwear" | "Bag" | "Acc_etc")
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  
  // 각 카테고리별 소분류 보기 상태 관리 (key: 카테고리명)
  const [showSubcategoryDetail, setShowSubcategoryDetail] = useState<Record<string, boolean>>({});
  
  // 각 카테고리별 선택된 소분류 상태 관리 (key: 카테고리명)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Record<string, string>>({});
  
  // 각 카테고리별 접기/펼치기 상태 관리 (key: 카테고리명, 기본값: false = 접힘)
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  // 월 배열 (1~12월)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // 탭 옵션 정의
  const categoryTabs = [
    { key: "전체", label: t("categories.all") },
    { key: "Shoes", label: t("categories.shoes") },
    { key: "Headwear", label: t("categories.headwear") },
    { key: "Bag", label: t("categories.bag") },
    { key: "Acc_etc", label: t("categories.acc_etc") },
  ];

  /**
   * 중분류별로 연도 목록 추출 (2023년 제외)
   */
  const getYearsForCategory = (categoryData: any): string[] => {
    const years: string[] = [];
    for (const key in categoryData) {
      if (key !== "소분류" && /^\d{4}$/.test(key) && key !== "2023") {
        years.push(key);
      }
    }
    return years.sort((a, b) => b.localeCompare(a)); // 내림차순 정렬
  };


  /**
   * 소분류 데이터가 있는지 확인
   */
  const hasSubCategories = (categoryData: any): boolean => {
    return categoryData?.소분류 && Object.keys(categoryData.소분류).length > 0;
  };

  /**
   * 월 데이터에서 재고주수 값 가져오기 (기초데이터 기반 재계산)
   */
  const getWeeksValue = (monthData: MonthData | undefined, kind: WeeksKind): number | string | null => {
    if (!monthData) {
      return null;
    }

    // 기초데이터가 있으면 재계산
    if (monthData.기초데이터) {
      return calcWeeksFromBase(monthData.기초데이터, kind, nWeeks);
    }

    // 기초데이터가 없으면 기존 값 사용 (하위 호환성)
    if (kind === "전체재고주수") {
      return monthData.전체재고주수;
    } else if (kind === "대리상재고주수") {
      return monthData.대리상재고주수;
    } else if (kind === "창고재고주수") {
      return monthData.창고재고주수;
    }

    return null;
  };

  /**
   * 소분류 비교 섹션 컴포넌트 (공통)
   */
  const SubcategoryCompareSection = ({ 
    categoryData, 
    categoryName,
    categoryKey,
    selectedSubcategory,
    onSubcategoryChange
  }: { 
    categoryData: any; 
    categoryName: string;
    categoryKey: string;
    selectedSubcategory: string;
    onSubcategoryChange: (subcategory: string) => void;
  }) => {
    const years = getYearsForCategory(categoryData);
    const subcategories = categoryData?.소분류 ? Object.keys(categoryData.소분류).sort() : [];
    
    if (subcategories.length === 0) {
      return null;
    }

    // 필터링된 소분류 목록
    const filteredSubcategories = selectedSubcategory === "ALL" 
      ? subcategories 
      : [selectedSubcategory];

    // 소분류별 테이블 렌더링 함수
    const renderSubcategoryTable = (subCategory: string) => {
      return (
        <div key={subCategory} className="mb-6">
          <h4 className="font-medium mb-2 text-gray-700">{formatSubcategoryLabel(subCategory)}</h4>
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-700 text-left min-w-[200px] border-b border-gray-300">
                      소분류
                    </th>
                    {months.map((month) => (
                      <th
                        key={month}
                        className="px-3 py-2.5 text-xs font-semibold text-gray-700 text-center min-w-[80px] border-b border-gray-300"
                      >
                        {month}월
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {years.map((year) => {
                    const subData = categoryData.소분류[subCategory];
                    const subYearData = subData?.[year] || {};

                    return (
                      <React.Fragment key={`${subCategory}_${year}`}>
                        {/* 전체재고주수 행 */}
                        <tr className="bg-slate-50">
                          <td className="px-3 py-2.5 text-sm font-semibold text-slate-900 border-b border-slate-100">
                            {formatSubcategoryLabel(subCategory)}({year}{t("common.year")})
                          </td>
                          {months.map((month) => {
                            const monthData = subYearData[String(month)];
                            const value = getWeeksValue(monthData, "전체재고주수");
                            return (
                              <td
                                key={month}
                                className={`px-3 py-2 text-xs text-center border-b border-slate-100 transition-all hover:brightness-105 ${getHeatmapClass(value)}`}
                              >
                                {formatWeeksValue(value, t)}
                              </td>
                            );
                          })}
                        </tr>
                        {/* 대리상 행 */}
                        <tr className="bg-white">
                          <td className="px-3 py-2 text-xs text-slate-600 pl-8 border-b border-slate-100">
                            - {t("heatmapTable.agency")}
                          </td>
                          {months.map((month) => {
                            const monthData = subYearData[String(month)];
                            const value = getWeeksValue(monthData, "대리상재고주수");
                            return (
                              <td
                                key={month}
                                className={`px-3 py-2 text-xs text-center border-b border-slate-100 transition-all hover:brightness-105 ${getHeatmapClass(value)}`}
                              >
                                {formatWeeksValue(value, t)}
                              </td>
                            );
                          })}
                        </tr>
                        {/* 창고재고 행 */}
                        <tr className="bg-white">
                          <td className="px-3 py-2 text-xs text-slate-600 pl-8 border-b border-slate-100">
                            - {t("heatmapTable.warehouse")}
                          </td>
                          {months.map((month) => {
                            const monthData = subYearData[String(month)];
                            const value = getWeeksValue(monthData, "창고재고주수");
                            return (
                              <td
                                key={month}
                                className="px-3 py-2 text-xs text-center border-b border-slate-100 bg-white"
                              >
                                {formatWeeksValue(value, t)}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{categoryName} 소분류 비교</h3>
          
          {/* 소분류 선택 탭 */}
          <div className="inline-flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => onSubcategoryChange("ALL")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedSubcategory === "ALL"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              전체
            </button>
            {subcategories.map((subCategory: string) => (
              <button
                key={subCategory}
                onClick={() => onSubcategoryChange(subCategory)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedSubcategory === subCategory
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {formatSubcategoryLabel(subCategory)}
              </button>
            ))}
          </div>
        </div>

        {/* 소분류 테이블 렌더링 */}
        {filteredSubcategories.map((subCategory) => renderSubcategoryTable(subCategory))}
      </div>
    );
  };

  /**
   * 아이템 아이콘 가져오기 (SUMMARY와 동일)
   */
  const getItemIcon = (itemKey: string) => {
    switch (itemKey) {
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

  /**
   * 아이템 재고 섹션 컴포넌트 (공통)
   */
  const ItemInventorySection = ({ 
    categoryKey,
    categoryName,
    categoryData,
    showLegend = false,
    isOverallView = false,
    brandMainColor
  }: {
    categoryKey: string;
    categoryName: string;
    categoryData: any;
    showLegend?: boolean;
    isOverallView?: boolean;
    brandMainColor?: string;
  }) => {
    const years = getYearsForCategory(categoryData);
    const hasSub = hasSubCategories(categoryData) && !isOverallView;
    
    // 이 카테고리의 소분류 보기 상태
    const showDetail = showSubcategoryDetail[categoryKey] || false;
    const selectedSub = selectedSubcategory[categoryKey] || "ALL";
    
    // 이 카테고리의 접기/펼치기 상태 (기본값: false = 접힘)
    const expanded = isExpanded[categoryKey] === true; // undefined일 때 false로 처리
    
    // 접기/펼치기 토글
    const toggleExpand = () => {
      setIsExpanded(prev => ({
        ...prev,
        [categoryKey]: !expanded
      }));
    };

    // 소분류 보기 토글
    const toggleSubcategoryDetail = () => {
      setShowSubcategoryDetail(prev => ({
        ...prev,
        [categoryKey]: !prev[categoryKey]
      }));
    };

    // 소분류 선택 변경
    const handleSubcategoryChange = (subcategory: string) => {
      setSelectedSubcategory(prev => ({
        ...prev,
        [categoryKey]: subcategory
      }));
    };

    return (
      <div className="mb-8">
        {/* 제목 줄 - 범례만 표시 */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getItemIcon(categoryKey)}</span>
            <h2 className="text-xl font-bold">{categoryName}</h2>
          </div>
          {/* 히트맵 색상 범례 (첫 번째 섹션에만 표시) */}
          {showLegend && (
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-600 font-medium">{t("summary.stockWeeks")}:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded"></div>
                  <span className="text-slate-600">{t("legend.weeks0")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-emerald-50 border border-slate-200 rounded"></div>
                  <span className="text-slate-600">{t("legend.weeks1to19")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-emerald-100 border border-slate-200 rounded"></div>
                  <span className="text-slate-600">{t("legend.weeks20to29")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-yellow-100 border border-slate-200 rounded"></div>
                  <span className="text-slate-600">{t("legend.weeks30to39")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-orange-100 border border-slate-200 rounded"></div>
                  <span className="text-slate-600">{t("legend.weeks40to49")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-red-100 border border-slate-200 rounded"></div>
                  <span className="text-slate-600">{t("legend.weeks50plus")}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 메인 히트맵 테이블 */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-900">
                  <th className="px-3 py-2.5 text-xs font-semibold text-white text-left min-w-[200px] border-b border-slate-700">
                    아이템
                  </th>
                  {months.map((month) => (
                    <th
                      key={month}
                      className="px-3 py-2.5 text-xs font-semibold text-white text-center min-w-[80px] border-b border-slate-700"
                    >
                      {month}월
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 증감 계산 헬퍼 함수 */}
                {(() => {
                  const calculateDelta = (currentValue: number | string | null, prevValue: number | string | null): number | null => {
                    // 숫자로 변환
                    const currentNum = typeof currentValue === 'number' ? currentValue : null;
                    const prevNum = typeof prevValue === 'number' ? prevValue : null;
                    
                    if (currentNum === null || prevNum === null) return null;
                    if (isNaN(currentNum) || isNaN(prevNum)) return null;
                    
                    return currentNum - prevNum;
                  };

                  // 증감 포맷팅 헬퍼 함수
                  const formatDelta = (delta: number | null): string => {
                    if (delta === null) return "-";
                    if (delta === 0) return "0주";
                    const absDelta = Math.abs(delta);
                    const sign = delta > 0 ? "+" : "△";
                    return `${sign}${Math.round(absDelta)}주`;
                  };

                  // 전년도 데이터 (첫 번째와 두 번째 연도 비교)
                  const currentYear = years[0];
                  const prevYear = years.length > 1 ? years[1] : null;
                  const currentYearData = currentYear ? categoryData[currentYear] || {} : {};
                  const prevYearData = prevYear ? categoryData[prevYear] || {} : null;

                  return (
                    <>
                      {/* 모든 연도 행 먼저 렌더링 */}
                      {years.map((year) => {
                        const yearData = categoryData[year] || {};

                        return (
                          <React.Fragment key={year}>
                            {/* 연도 행 */}
                            <tr className="bg-slate-50">
                              <td className="px-3 py-2.5 text-sm font-bold text-slate-900 border-b border-slate-100">
                                {categoryName}({year}{t("common.year")})
                              </td>
                              {months.map((month) => {
                                const monthData = yearData[String(month)];
                                const value = getWeeksValue(monthData, "전체재고주수");
                                return (
                                  <td
                                    key={month}
                                    className={`px-3 py-2 text-xs text-center border-b border-slate-100 transition-all hover:brightness-105 ${getHeatmapClass(value)}`}
                                  >
                                    {formatWeeksValue(value, t)}
                                  </td>
                                );
                              })}
                            </tr>
                            {/* 대리상 행 - 접기/펼치기 상태에 따라 표시 */}
                            {expanded && (
                              <tr className="bg-white">
                                <td className="px-3 py-2 text-xs text-slate-600 pl-8 border-b border-slate-100">
                                  - {t("heatmapTable.agency")}
                                </td>
                                {months.map((month) => {
                                  const monthData = yearData[String(month)];
                                  const value = getWeeksValue(monthData, "대리상재고주수");
                                  return (
                                    <td
                                      key={month}
                                      className={`px-3 py-2 text-xs text-center border-b border-slate-100 transition-all hover:brightness-105 ${getHeatmapClass(value)}`}
                                    >
                                      {formatWeeksValue(value, t)}
                                    </td>
                                  );
                                })}
                              </tr>
                            )}
                            {/* 창고재고 행 - 접기/펼치기 상태에 따라 표시 */}
                            {expanded && (
                              <tr className="bg-white">
                                <td className="px-3 py-2 text-xs text-slate-600 pl-8 border-b border-slate-100">
                                  - {t("heatmapTable.warehouse")}
                                </td>
                                {months.map((month) => {
                                  const monthData = yearData[String(month)];
                                  const value = getWeeksValue(monthData, "창고재고주수");
                                  return (
                                    <td
                                      key={month}
                                      className="px-3 py-2 text-xs text-center border-b border-slate-100 bg-white"
                                    >
                                      {formatWeeksValue(value, t)}
                                    </td>
                                  );
                                })}
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      
                      {/* 전년대비 행들 (전체 탭 또는 개별 아이템 탭일 때) */}
                      {prevYearData && (
                        <>
                          {/* 전년대비(전체) - 접었을 때도 항상 표시 */}
                          <tr className="bg-blue-50">
                            <td className="px-3 py-2 text-xs text-slate-600 pl-8 border-b border-slate-100 font-bold">
                              - {t("heatmapTable.yoyTotal")}
                            </td>
                            {months.map((month) => {
                              const monthData = currentYearData[String(month)];
                              const prevMonthData = prevYearData[String(month)];
                              const currentValue = getWeeksValue(monthData, "전체재고주수");
                              const prevValue = getWeeksValue(prevMonthData, "전체재고주수");
                              const delta = calculateDelta(
                                typeof currentValue === 'number' ? currentValue : null,
                                typeof prevValue === 'number' ? prevValue : null
                              );
                              return (
                                <td
                                  key={month}
                                  className="px-3 py-2 text-xs text-center border-b border-slate-100 bg-blue-50"
                                >
                                  {formatDelta(delta)}
                                </td>
                              );
                            })}
                          </tr>
                          {/* 전년대비(대리상) - 접기/펼치기 상태에 따라 표시 */}
                          {expanded && (
                            <tr className="bg-blue-50">
                              <td className="px-3 py-2 text-xs text-slate-600 pl-8 border-b border-slate-100 font-medium">
                                - {t("heatmapTable.yoyAgency")}
                              </td>
                              {months.map((month) => {
                                const monthData = currentYearData[String(month)];
                                const prevMonthData = prevYearData[String(month)];
                                const currentValue = getWeeksValue(monthData, "대리상재고주수");
                                const prevValue = getWeeksValue(prevMonthData, "대리상재고주수");
                                const delta = calculateDelta(
                                  typeof currentValue === 'number' ? currentValue : null,
                                  typeof prevValue === 'number' ? prevValue : null
                                );
                                return (
                                  <td
                                    key={month}
                                    className="px-3 py-2 text-xs text-center border-b border-slate-100 bg-blue-50"
                                  >
                                    {formatDelta(delta)}
                                  </td>
                                );
                              })}
                            </tr>
                          )}
                          {/* 전년대비(창고재고) - 접기/펼치기 상태에 따라 표시 */}
                          {expanded && (
                            <tr className="bg-blue-50">
                              <td className="px-3 py-2 text-xs text-slate-600 pl-8 border-b border-slate-100 font-medium">
                                - {t("heatmapTable.yoyWarehouse")}
                              </td>
                              {months.map((month) => {
                                const monthData = currentYearData[String(month)];
                                const prevMonthData = prevYearData[String(month)];
                                const currentValue = getWeeksValue(monthData, "창고재고주수");
                                const prevValue = getWeeksValue(prevMonthData, "창고재고주수");
                                const delta = calculateDelta(
                                  typeof currentValue === 'number' ? currentValue : null,
                                  typeof prevValue === 'number' ? prevValue : null
                                );
                                return (
                                  <td
                                    key={month}
                                    className="px-3 py-2 text-xs text-center border-b border-slate-100 bg-blue-50"
                                  >
                                    {formatDelta(delta)}
                                  </td>
                                );
                              })}
                            </tr>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* 소분류 비교 섹션 - 토글 버튼으로 제어 */}
        {hasSub && showDetail && (
          <SubcategoryCompareSection 
            categoryData={categoryData} 
            categoryName={categoryName}
            categoryKey={categoryKey}
            selectedSubcategory={selectedSub}
            onSubcategoryChange={handleSubcategoryChange}
          />
        )}
      </div>
    );
  };

  // 필터링된 카테고리 목록
  const categoriesToRender = selectedCategory === "전체" 
    ? CATEGORY_ORDER 
    : [selectedCategory];

  // 브랜드별 색상 설정
  const getBrandColors = () => {
    if (brand === "MLB") {
      return {
        mainColor: "#1e3a8a", // 밝은 네이비/블루
        tabColor: {
          selected: "bg-[#1e3a8a] text-white",
          unselected: "text-[#1e3a8a]",
          container: "bg-blue-50",
        },
      };
    } else if (brand === "MLB KIDS") {
      return {
        mainColor: "#fbbf24", // 노란색/앰버
        tabColor: {
          selected: "bg-[#fbbf24] text-slate-900",
          unselected: "text-amber-700",
          container: "bg-amber-50",
        },
      };
    } else if (brand === "DISCOVERY") {
      return {
        mainColor: "#10b981", // 에메랄드 그린
        tabColor: {
          selected: "bg-[#10b981] text-white",
          unselected: "text-emerald-700",
          container: "bg-emerald-50",
        },
      };
    }
    return {
      mainColor: "#6b7280",
      tabColor: {
        selected: "bg-gray-500 text-white",
        unselected: "text-gray-700",
        container: "bg-gray-50",
      },
    };
  };

  const brandColors = getBrandColors();
  
  // 기준월 선택 상태 (SUMMARY 카드와 공유)
  const [selectedMonth, setSelectedMonth] = React.useState<number>(() => {
    // 가장 최근 데이터가 있는 월 찾기
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
    const currentYear = sortedYears[0] || "2025";
    
    let latestMonth = 1;
    CATEGORY_ORDER.forEach((category) => {
      const categoryData = data[category];
      if (categoryData) {
        const currentYearData = categoryData[currentYear];
        if (currentYearData) {
          for (let month = 12; month >= 1; month--) {
            const monthData = currentYearData[String(month)];

            const totalStockAmount =
              typeof monthData?.기초데이터?.전체재고금액 === "number"
                ? monthData.기초데이터.전체재고금액
                : 0;

            if (totalStockAmount > 0) {
              latestMonth = Math.max(latestMonth, month);
              break;
            }
          }
        }
      }
    });
    return latestMonth;
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* 브랜드 선택 탭 + 아이템 선택 탭 */}
      <div className="bg-white rounded-xl shadow-sm px-6 py-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 브랜드 선택 탭 (메인 페이지에서만 표시) */}
          {brands && selectedBrand && onBrandChange && (
            <div className="flex space-x-1">
              {brands.map((b) => {
                const getBrandColor = (brandName: Brand) => {
                  if (brandName === "MLB") {
                    return {
                      selected: "text-white",
                      unselected: "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    };
                  } else if (brandName === "MLB KIDS") {
                    return {
                      selected: "text-slate-900",
                      unselected: "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    };
                  } else if (brandName === "DISCOVERY") {
                    return {
                      selected: "text-white",
                      unselected: "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    };
                  }
                  return {
                    selected: "bg-gray-600 text-white",
                    unselected: "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  };
                };

                const colors = getBrandColor(b);
                const getSelectedBg = (brandName: Brand) => {
                  if (brandName === "MLB") return "bg-[#1e3a8a]";
                  if (brandName === "MLB KIDS") return "bg-[#fbbf24]";
                  if (brandName === "DISCOVERY") return "bg-[#10b981]";
                  return "bg-gray-600";
                };

                return (
                  <button
                    key={b}
                    onClick={() => onBrandChange(b)}
                    className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                      selectedBrand === b
                        ? `${getSelectedBg(b)} ${colors.selected}`
                        : colors.unselected
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          )}

          {/* 중분류 탭 */}
          <div className={`inline-flex ${brandColors.tabColor.container} p-1 rounded-lg`}>
            {categoryTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  selectedCategory === tab.key
                    ? `${brandColors.tabColor.selected} shadow-sm`
                    : `${brandColors.tabColor.unselected} hover:opacity-80`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 언어 선택 토글 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setLanguage("ko")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                language === "ko"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              한국어
            </button>
            <button
              onClick={() => setLanguage("zh")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                language === "zh"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              中文
            </button>
          </div>

          {/* 직영 판매예정 주수 입력 - DISCOVERY일 때는 브랜드 네비게이션 버튼 앞에 배치 */}
          {onNWeeksChange && brand === "DISCOVERY" && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="nWeeks"
                className="text-sm font-semibold text-slate-700"
              >
                {t("page.directSalesForecastWeeks")}:
              </label>
              <div className="relative">
                <input
                  id="nWeeks"
                  type="number"
                  min={1}
                  max={100}
                  value={nWeeks}
                  onChange={(e) => onNWeeksChange(Number(e.target.value))}
                  className="w-24 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 pointer-events-none">
                  {t("common.weeks")}
                </span>
              </div>
            </div>
          )}

          {/* 브랜드 네비게이션 버튼 (브랜드별 상세 페이지에서만 표시) */}
          {showHomeButton && (
            <div className="flex items-center gap-2">
              {/* 다른 브랜드로 이동 버튼 */}
              {brand !== "MLB" && (
                <Link
                  href="/mlb"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1e3a8a] text-white hover:bg-[#1e40af] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  MLB
                </Link>
              )}
              {brand !== "MLB KIDS" && (
                <Link
                  href="/kids"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#fbbf24] text-slate-900 hover:bg-[#f59e0b] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  MLB KIDS
                </Link>
              )}
              {brand !== "DISCOVERY" && (
                <Link
                  href="/discovery"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#10b981] text-white hover:bg-[#059669] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  DISCOVERY
                </Link>
              )}
              
              {/* 홈 대시보드 버튼 */}
              <Link
                href="/home"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {t("common.home") || "홈"}
              </Link>
            </div>
          )}

          {/* 직영 판매예정 주수 입력 - DISCOVERY가 아닐 때는 브랜드 네비게이션 버튼 뒤에 배치 */}
          {onNWeeksChange && brand !== "DISCOVERY" && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="nWeeks"
                className="text-sm font-semibold text-slate-700"
              >
                {t("page.directSalesForecastWeeks")}:
              </label>
              <div className="relative">
                <input
                  id="nWeeks"
                  type="number"
                  min={1}
                  max={100}
                  value={nWeeks}
                  onChange={(e) => onNWeeksChange(Number(e.target.value))}
                  className="w-24 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 pointer-events-none">
                  {t("common.weeks")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 섹션 1: 아이템별 SUMMARY 카드 */}
      <section className="mt-6 md:mt-8 rounded-2xl bg-white shadow-sm px-5 py-4 md:px-6 md:py-5 mb-6 space-y-4">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-2">
          <div 
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: brandColors.mainColor }}
          >
            1
          </div>
          <h2 className="text-base md:text-lg font-semibold text-slate-900">
            {brand} {t("heatmap.inventorySummary")}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">{t("heatmap.baseMonth")}:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}{t("common.month")}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 섹션 내용: SUMMARY 카드 그리드 */}
        <div>
          <InventorySummaryCards
            data={data}
            brand={brand}
            nWeeks={nWeeks}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </section>
      
      {/* 섹션 2 & 3: 차트와 히트맵을 가로로 배치 */}
      <div className="mt-6 md:mt-8 flex gap-6 items-start">
        {/* 좌측: 섹션 2 - 월별 요약 카드 (차트) */}
        <section className="flex-1 min-w-0 rounded-2xl bg-white shadow-sm px-5 py-4 md:px-6 md:py-5 mb-6 space-y-4">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2">
            <div 
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: brandColors.mainColor }}
            >
              2
            </div>
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                {brand} {categoryTabs.find(t => t.key === selectedCategory)?.label || t("common.all")} {t("heatmap.monthlyInventorySales")}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {t("heatmap.description")}
              </p>
            </div>
          </div>
          
          {/* 섹션 내용: 차트 + YOY 표 */}
          <div>
            <InventoryMonthlySummaryCard
              data={data}
              brand={brand}
              selectedCategory={selectedCategory}
              nWeeks={nWeeks}
            />
          </div>
        </section>

        {/* 우측: 섹션 3 - 히트맵 영역 */}
        <section className="flex-1 min-w-0 rounded-2xl bg-white shadow-sm px-5 py-4 md:px-6 md:py-5 mb-6 space-y-4">
          {/* 섹션 헤더 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: brandColors.mainColor }}
              >
                3
              </div>
              <div className="flex-1 flex items-center gap-3">
                <h2 className="text-base md:text-lg font-semibold text-slate-900">
                  {brand} {categoryTabs.find(t => t.key === selectedCategory)?.label || t("common.all")} {t("heatmap.heatmapTitle")}
                </h2>
                {/* 전체 탭일 때: 접기/펼치기 버튼 (4개 아이템 동시 적용) */}
                {selectedCategory === "전체" && (() => {
                  // 첫 번째 카테고리의 접기/펼치기 상태를 기준으로 사용
                  const firstCategory = categoriesToRender[0];
                  const firstCategoryKey = firstCategory;
                  const expanded = isExpanded[firstCategoryKey] === true;
                  
                  return (
                    <button
                      onClick={() => {
                        // 모든 카테고리에 동시에 적용
                        const newExpanded = !expanded;
                        const newState: Record<string, boolean> = {};
                        categoriesToRender.forEach(cat => {
                          newState[cat] = newExpanded;
                        });
                        setIsExpanded(prev => ({ ...prev, ...newState }));
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                    >
                      {expanded ? t("common.collapse") : t("common.expand")}
                    </button>
                  );
                })()}
                {/* 소분류 보기 버튼 및 펼치기 버튼 (개별 아이템 선택 시) */}
                {selectedCategory !== "전체" && categoriesToRender.length > 0 && (() => {
                  const firstCategory = categoriesToRender[0];
                  const firstCategoryData = data[firstCategory];
                  const hasSub = firstCategoryData && hasSubCategories(firstCategoryData);
                  const firstCategoryKey = firstCategory;
                  const showDetail = showSubcategoryDetail[firstCategoryKey] || false;
                  const expanded = isExpanded[firstCategoryKey] === true;
                  
                  return (
                    <div className="flex items-center gap-2">
                      {/* 소분류 보기 버튼 */}
                      {hasSub && (
                        <button
                          onClick={() => {
                            setShowSubcategoryDetail(prev => ({
                              ...prev,
                              [firstCategoryKey]: !prev[firstCategoryKey]
                            }));
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                        >
                          {t("common.subcategoryView")}
                        </button>
                      )}
                      {/* 펼치기 버튼 */}
                      <button
                        onClick={() => {
                          setIsExpanded(prev => ({
                            ...prev,
                            [firstCategoryKey]: !expanded
                          }));
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                      >
                        {expanded ? t("common.collapse") : t("common.expand")}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
            <p className="text-xs md:text-sm text-slate-500 ml-8">
              {t("heatmap.heatmapDescription")}
            </p>
          </div>
          
          {/* 섹션 내용: 히트맵 + 소분류 비교 */}
          <div>
            {categoriesToRender.map((category, index) => {
              if (data[category]) {
                const categoryName = CATEGORY_NAMES[category] || category;
                return (
                  <ItemInventorySection
                    key={category}
                    categoryKey={category}
                    categoryName={categoryName}
                    categoryData={data[category]}
                    showLegend={index === 0}
                    isOverallView={selectedCategory === "전체"}
                    brandMainColor={brandColors.mainColor}
                  />
                );
              }
              return null;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
