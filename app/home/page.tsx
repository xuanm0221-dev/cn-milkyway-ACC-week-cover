"use client";

import React, { useState, useEffect, useMemo } from "react";
import BrandCard from "@/components/BrandCard";
import { StockWeeksData, Brand, CATEGORY_ORDER } from "@/types/stock-weeks";
import { useLanguageStore } from "@/lib/store/language-store";
import { useT } from "@/lib/i18n";

// JSON 데이터 import
import MLBData from "@/data/stock_weeks_MLB.json";
import KidsData from "@/data/stock_weeks_MLB_KIDS.json";
import DscData from "@/data/stock_weeks_DISCOVERY.json";

/**
 * 홈 대시보드 페이지 컴포넌트
 */
export default function HomeDashboard() {
  const [mlbData, setMlbData] = useState<StockWeeksData | null>(null);
  const [kidsData, setKidsData] = useState<StockWeeksData | null>(null);
  const [discoveryData, setDiscoveryData] = useState<StockWeeksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nWeeks, setNWeeks] = useState<number>(25);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const { language, setLanguage } = useLanguageStore();
  const t = useT();

  const brands: Brand[] = ["MLB", "MLB KIDS", "DISCOVERY"];

  /**
   * 브랜드별 JSON 데이터 로드
   */
  useEffect(() => {
    setLoading(true);
    try {
      setMlbData(MLBData as StockWeeksData);
      setKidsData(KidsData as StockWeeksData);
      setDiscoveryData(DscData as StockWeeksData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 사용 가능한 연도 목록 추출
   */
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    
    [mlbData, kidsData, discoveryData].forEach((data) => {
      if (data) {
        CATEGORY_ORDER.forEach((category) => {
          if (data[category]) {
            Object.keys(data[category]).forEach((key) => {
              if (/^\d{4}$/.test(key) && key !== "2023" && key !== "소분류") {
                years.add(key);
              }
            });
          }
        });
      }
    });
    
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [mlbData, kidsData, discoveryData]);

  /**
   * 사용 가능한 월 목록 추출 (선택된 연도 기준)
   */
  const availableMonths = useMemo(() => {
    if (!selectedYear) return [];
    
    const months = new Set<number>();
    
    [mlbData, kidsData, discoveryData].forEach((data) => {
      if (data) {
        CATEGORY_ORDER.forEach((category) => {
          if (data[category] && data[category][selectedYear]) {
            Object.keys(data[category][selectedYear]).forEach((key) => {
              const month = parseInt(key);
              if (month >= 1 && month <= 12) {
                const monthData = data[category]?.[selectedYear]?.[key];
                if (monthData?.기초데이터) {
                  const totalStockAmount =
                    typeof monthData.기초데이터.전체재고금액 === "number"
                      ? monthData.기초데이터.전체재고금액
                      : 0;
                  if (totalStockAmount > 0) {
                    months.add(month);
                  }
                }
              }
            });
          }
        });
      }
    });
    
    return Array.from(months).sort((a, b) => b - a);
  }, [selectedYear, mlbData, kidsData, discoveryData]);

  /**
   * 초기 연도 및 월 설정 (최신 연도/월)
   */
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  /**
   * 연도 변경 시 월 초기화
   */
  useEffect(() => {
    if (availableMonths.length > 0 && selectedMonth === 0) {
      setSelectedMonth(availableMonths[0]);
    } else if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 1. 큰 제목 섹션 */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            악세사리 재고주수 대시보드
          </h1>
        </div>
      </section>

      {/* 2. 브랜드 선택 및 연도 선택 섹션 */}
      <section className="px-4 sm:px-6 lg:px-8 mt-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">브랜드 선택</h2>
            <p className="text-sm text-slate-600">
              분석할 브랜드를 클릭하여 상세 대시보드로 이동합니다
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="yearSelect" className="text-sm font-semibold text-slate-700">
              연도 선택:
            </label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth(0); // 월 초기화
              }}
              className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}{t("common.year")}
                </option>
              ))}
            </select>
            {selectedYear && availableMonths.length > 0 && (
              <>
                <label htmlFor="monthSelect" className="text-sm font-semibold text-slate-700">
                  월 선택:
                </label>
                <select
                  id="monthSelect"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300"
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}{t("common.month")}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. 브랜드 카드 그리드 */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">{t("common.loading")}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mlbData && selectedYear && selectedMonth > 0 && (
              <BrandCard brand="MLB" data={mlbData} nWeeks={nWeeks} selectedYear={selectedYear} selectedMonth={selectedMonth} />
            )}
            {kidsData && selectedYear && selectedMonth > 0 && (
              <BrandCard brand="MLB KIDS" data={kidsData} nWeeks={nWeeks} selectedYear={selectedYear} selectedMonth={selectedMonth} />
            )}
            {discoveryData && selectedYear && selectedMonth > 0 && (
              <BrandCard brand="DISCOVERY" data={discoveryData} nWeeks={nWeeks} selectedYear={selectedYear} selectedMonth={selectedMonth} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

