"use client";

import React, { useState, useEffect } from "react";
import StockWeeksHeatmap from "@/components/StockWeeksHeatmap";
import OperationStockHeatmap from "@/components/OperationStockHeatmap";
import { StockWeeksData, Brand } from "@/types/stock-weeks";
import { OperationStockWeeksData } from "@/types/operation-stock-weeks";
import { useLanguageStore } from "@/lib/store/language-store";
import { useT } from "@/lib/i18n";

/**
 * MLB 브랜드 상세 페이지 컴포넌트
 */
export default function MLBPage() {
  const [data, setData] = useState<StockWeeksData | null>(null);
  const [operationData, setOperationData] = useState<OperationStockWeeksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nWeeks, setNWeeks] = useState<number>(25);
  const { language, setLanguage } = useLanguageStore();
  const t = useT();

  const selectedBrand: Brand = "MLB";

  /**
   * JSON 데이터 로드 (동적 import 사용)
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("[MLB Page] 데이터 로딩 시작...");
        
        // 동적 import로 JSON 파일 로드
        const [mlbDataModule, mlbOperationDataModule] = await Promise.all([
          import("@/data/stock_weeks_MLB.json"),
          import("@/data/stock_weeks_MLB_operation.json"),
        ]);

        console.log("[MLB Page] MLB 데이터 로드 완료:", mlbDataModule.default ? "OK" : "FAIL");
        console.log("[MLB Page] 운영기준 데이터 로드 완료:", mlbOperationDataModule.default ? "OK" : "FAIL");

        setData(mlbDataModule.default as StockWeeksData);
        setOperationData(mlbOperationDataModule.default as OperationStockWeeksData);
        
        console.log("[MLB Page] 데이터 설정 완료");
      } catch (err) {
        console.error("[MLB Page] 데이터 로드 실패:", err);
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        setData(null);
        setOperationData(null);
      } finally {
        setLoading(false);
        console.log("[MLB Page] 로딩 상태 해제");
      }
    };

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 1. 큰 제목 섹션 */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center">
          <div className="inline-block">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              MLB 악세사리 재고분석
            </h1>
            <div className="mt-2 h-1 w-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400" />
          </div>
        </div>
      </section>

      {/* 에러 메시지 표시 */}
      {error && (
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">데이터 로드 오류</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-2">브라우저 콘솔(F12)에서 자세한 오류 내용을 확인하세요.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 소분류별 히트맵 영역 */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 font-medium">데이터 로딩 중...</div>
            <div className="text-gray-400 text-sm">잠시만 기다려주세요</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">데이터를 불러올 수 없습니다.</div>
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
            <div className="text-gray-500">데이터가 없습니다.</div>
          </div>
        )}
      </div>

      {/* 3. 운영기준별 히트맵 영역 */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 font-medium">운영기준 데이터 로딩 중...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">운영기준 데이터를 불러올 수 없습니다.</div>
          </div>
        ) : operationData ? (
          <OperationStockHeatmap
            data={operationData}
            brand={selectedBrand}
          />
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">운영기준 데이터가 없습니다.</div>
          </div>
        )}
      </div>
    </main>
  );
}


