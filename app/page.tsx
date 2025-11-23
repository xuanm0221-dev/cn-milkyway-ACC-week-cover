"use client";

import React, { useState, useEffect } from "react";
import StockWeeksHeatmap from "@/components/StockWeeksHeatmap";
import { StockWeeksData, Brand } from "@/types/stock-weeks";
import { useLanguageStore } from "@/lib/store/language-store";
import { useT } from "@/lib/i18n";

// JSON 데이터 import (public/data 폴더에 있는 파일)
import MLBData from "@/data/stock_weeks_MLB.json";
import KidsData from "@/data/stock_weeks_MLB_KIDS.json";
import DscData from "@/data/stock_weeks_DISCOVERY.json";

/**
 * 메인 페이지 컴포넌트
 */
export default function Home() {
  const [selectedBrand, setSelectedBrand] = useState<Brand>("MLB");
  const [data, setData] = useState<StockWeeksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nWeeks, setNWeeks] = useState<number>(25);
  const { language, setLanguage } = useLanguageStore();
  const t = useT();

  const brands: Brand[] = ["MLB", "MLB KIDS", "DISCOVERY"];

  /**
   * 브랜드별 JSON 데이터 로드
   */
  useEffect(() => {
    setLoading(true);
    try {
      // import된 JSON 데이터 사용
      let jsonData: StockWeeksData | null = null;
      
      if (selectedBrand === "MLB") {
        jsonData = MLBData as StockWeeksData;
      } else if (selectedBrand === "MLB KIDS") {
        jsonData = KidsData as StockWeeksData;
      } else if (selectedBrand === "DISCOVERY") {
        jsonData = DscData as StockWeeksData;
      }
      
      setData(jsonData);
    } catch (error) {
      console.error("Error loading data:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedBrand]);


  return (
    <main className="min-h-screen bg-gray-50">
      {/* 브랜드 탭 및 N주 입력 */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
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
            {/* 브랜드 탭 */}
            <div className="flex space-x-1">
              {brands.map((brand) => {
                // 브랜드별 색상 설정
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

                const colors = getBrandColor(brand);
                // 브랜드별 배경색 (선택됨)
                const getSelectedBg = (brandName: Brand) => {
                  if (brandName === "MLB") {
                    return "bg-[#1e3a8a]";
                  } else if (brandName === "MLB KIDS") {
                    return "bg-[#fbbf24]";
                  } else if (brandName === "DISCOVERY") {
                    return "bg-[#10b981]";
                  }
                  return "bg-gray-600";
                };
                
                return (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                      selectedBrand === brand
                        ? `${getSelectedBg(brand)} ${colors.selected}`
                        : colors.unselected
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
            
            {/* 직영 판매예정 주수 입력 */}
            <div className="flex items-center gap-3">
              <label htmlFor="nWeeks" className="text-sm font-semibold text-slate-700">
                {t("page.directSalesForecastWeeks")}:
              </label>
              <div className="relative">
                <input
                  id="nWeeks"
                  type="number"
                  min="1"
                  max="100"
                  value={nWeeks}
                  onChange={(e) => setNWeeks(Number(e.target.value))}
                  className="w-24 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 pointer-events-none">
                  {t("common.weeks")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 히트맵 영역 */}
      <div className="w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">{t("common.loading")}</div>
          </div>
        ) : data ? (
          <StockWeeksHeatmap data={data} brand={selectedBrand} nWeeks={nWeeks} />
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">{t("common.error")}</div>
          </div>
        )}
      </div>
    </main>
  );
}

