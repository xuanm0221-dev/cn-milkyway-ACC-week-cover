"use client";

import React, { useState, useEffect } from "react";
import StockWeeksHeatmap from "@/components/StockWeeksHeatmap";
import OperationStockHeatmap from "@/components/OperationStockHeatmap";
import { StockWeeksData, Brand } from "@/types/stock-weeks";
import { OperationStockWeeksData } from "@/types/operation-stock-weeks";
import { useLanguageStore } from "@/lib/store/language-store";
import { useT } from "@/lib/i18n";

// JSON 데이터 import
import KidsData from "@/data/stock_weeks_MLB_KIDS.json";
import KidsOperationData from "@/data/stock_weeks_MLB_KIDS_operation.json";

/**
 * MLB KIDS 브랜드 상세 페이지 컴포넌트
 */
export default function KidsPage() {
  const [data, setData] = useState<StockWeeksData | null>(null);
  const [operationData, setOperationData] = useState<OperationStockWeeksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nWeeks, setNWeeks] = useState<number>(25);
  const { language, setLanguage } = useLanguageStore();
  const t = useT();

  const selectedBrand: Brand = "MLB KIDS";

  /**
   * JSON 데이터 로드
   */
  useEffect(() => {
    setLoading(true);
    try {
      setData(KidsData as StockWeeksData);
      setOperationData(KidsOperationData as OperationStockWeeksData);
    } catch (error) {
      console.error("Error loading data:", error);
      setData(null);
      setOperationData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 1. 큰 제목 섹션 */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center">
          <div className="inline-block">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              MLB KIDS 악세사리 재고분석
            </h1>
            <div className="mt-2 h-1 w-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400" />
          </div>
        </div>
      </section>

      {/* 2. 소분류별 히트맵 영역 */}
      <div className="w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">{t("common.loading")}</div>
          </div>
        ) : data ? (
          <StockWeeksHeatmap
            data={data}
            brand={selectedBrand}
            nWeeks={nWeeks}
            onNWeeksChange={setNWeeks}
            showHomeButton={true}
          />
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">{t("common.error")}</div>
          </div>
        )}
      </div>

      {/* 3. 운영기준별 히트맵 영역 */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">{t("common.loading")}</div>
          </div>
        ) : operationData ? (
          <OperationStockHeatmap
            data={operationData}
            brand={selectedBrand}
          />
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">운영기준 데이터를 불러올 수 없습니다.</div>
          </div>
        )}
      </div>
    </main>
  );
}


