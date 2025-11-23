"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { StockWeeksData, CATEGORY_ORDER, CATEGORY_NAMES } from "@/types/stock-weeks";

interface InventoryMonthlySummaryCardProps {
  data: StockWeeksData;
  brand: string;
  selectedCategory: string; // "전체" | "Shoes" | "Headwear" | "Bag" | "Acc_etc"
  nWeeks: number;
}

interface MonthlyData {
  month: number;
  monthLabel: string;
  stockAmountCurrent: number; // 백만 단위
  stockAmountPrev: number; // 백만 단위
  salesAmountCurrent: number; // 백만 단위
  salesAmountPrev: number; // 백만 단위
  weeksCurrent: number | null;
  salesYOY: number | null; // %
  stockYOY: number | null; // %
}

/**
 * 월별 재고 & 판매매출 & 재고주수 요약 카드 컴포넌트
 */
export default function InventoryMonthlySummaryCard({
  data,
  brand,
  selectedCategory,
  nWeeks,
}: InventoryMonthlySummaryCardProps) {
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

  // 월별 데이터 집계
  const monthlyData = useMemo(() => {
    const result: MonthlyData[] = [];
    const categoriesToUse =
      selectedCategory === "전체"
        ? CATEGORY_ORDER
        : [selectedCategory];

    // 1~12월 순회
    for (let month = 1; month <= 12; month++) {
      let stockAmountCurrent = 0;
      let stockAmountPrev = 0;
      let salesAmountCurrent = 0;
      let salesAmountPrev = 0;
      let weeksCurrent: number | null = null;

      // 선택된 카테고리들 합산
      categoriesToUse.forEach((category) => {
        const categoryData = data[category];
        if (!categoryData) return;

        // 현재 연도 데이터
        const currentYearData = categoryData[currentYear];
        if (currentYearData) {
          const monthData = currentYearData[String(month)];
          if (monthData?.기초데이터) {
            stockAmountCurrent += monthData.기초데이터.전체재고금액 || 0;
            salesAmountCurrent += monthData.기초데이터.전체판매금액 || 0;

          }
        }

        // 전년도 데이터
        const prevYearData = categoryData[prevYear];
        if (prevYearData) {
          const monthData = prevYearData[String(month)];
          if (monthData?.기초데이터) {
            stockAmountPrev += monthData.기초데이터.전체재고금액 || 0;
            salesAmountPrev += monthData.기초데이터.전체판매금액 || 0;
          }
        }
      });

      // 재고주수는 전체 재고/전체 판매로 다시 계산 (여러 카테고리 합산 시)
      if (stockAmountCurrent > 0 && salesAmountCurrent > 0) {
        // 해당 월의 일수 계산
        const daysInMonth = new Date(
          parseInt(currentYear),
          month,
          0
        ).getDate();
        const weeklySales = (salesAmountCurrent / daysInMonth) * 7;
        if (weeklySales > 0) {
          weeksCurrent = stockAmountCurrent / weeklySales;
        }
      }

      // YOY 계산
      const salesYOY =
        salesAmountPrev > 0
          ? (salesAmountCurrent / salesAmountPrev) * 100
          : null;
      const stockYOY =
        stockAmountPrev > 0
          ? (stockAmountCurrent / stockAmountPrev) * 100
          : null;

      // 데이터가 하나라도 있으면 추가
      if (
        stockAmountCurrent > 0 ||
        stockAmountPrev > 0 ||
        salesAmountCurrent > 0 ||
        salesAmountPrev > 0
      ) {
        result.push({
          month,
          monthLabel: `${month}월`,
          stockAmountCurrent: stockAmountCurrent / 1_000_000, // 백만 단위
          stockAmountPrev: stockAmountPrev / 1_000_000, // 백만 단위
          salesAmountCurrent: salesAmountCurrent / 1_000_000, // 백만 단위
          salesAmountPrev: salesAmountPrev / 1_000_000, // 백만 단위
          weeksCurrent: weeksCurrent ? Math.round(weeksCurrent * 10) / 10 : null,
          salesYOY: salesYOY ? Math.round(salesYOY * 10) / 10 : null,
          stockYOY: stockYOY ? Math.round(stockYOY * 10) / 10 : null,
        });
      }
    }

    return result;
  }, [data, selectedCategory, currentYear, prevYear, nWeeks]);

  // 카테고리명
  const categoryLabel =
    selectedCategory === "전체"
      ? "전체"
      : CATEGORY_NAMES[selectedCategory] || selectedCategory;

  return (
    <div className="p-6">

      {/* 차트 */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12, fill: "#64748b" }}
              stroke="#cbd5e1"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#64748b" }}
              stroke="#cbd5e1"
              tickFormatter={(value) => `${value.toLocaleString('ko-KR')}M`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#64748b" }}
              stroke="#cbd5e1"
              tickFormatter={(value) => `${value}주`}
            />
            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === "재고주수") {
                  return [`${value}주`, name];
                }
                // 재고와 판매매출은 K(천단위)로 표시, 천 단위 구분자 포함
                // value는 백만 단위이므로, K로 표시하려면 * 1000
                const valueInK = Math.round(Number(value) * 1000);
                const formattedValue = valueInK.toLocaleString('ko-KR');
                return [`${formattedValue}K`, name];
              }}
              labelStyle={{ color: "#1e293b", fontWeight: 600 }}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconSize={0}
              formatter={(value, entry) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      backgroundColor: entry.color,
                      borderRadius: '3px',
                    }}
                  />
                  <span>{value}</span>
                </span>
              )}
            />
            {/* 재고 막대 (큰 막대) */}
            <Bar
              yAxisId="left"
              dataKey="stockAmountCurrent"
              name="재고"
              fill="#1e40af"
              radius={[4, 4, 0, 0]}
            />
            {/* 판매매출 막대 (작은 막대) */}
            <Bar
              yAxisId="left"
              dataKey="salesAmountCurrent"
              name="판매매출"
              fill="#60a5fa"
              radius={[4, 4, 0, 0]}
            />
            {/* 재고주수 꺾은선 */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="weeksCurrent"
              name="재고주수"
              stroke="#9333ea"
              strokeWidth={2}
              dot={{ fill: "#9333ea", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* YOY 표 */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-300">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-800">
                구분
              </th>
              {monthlyData.map((item) => (
                <th
                  key={item.month}
                  className="px-3 py-2 text-center text-xs font-semibold text-slate-800"
                >
                  {item.month}월
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 재고주수 행 (당년도) - 연한 회색 배경 */}
            <tr className="border-b border-slate-100 bg-slate-50">
              <td className="px-4 py-2 text-sm font-medium text-slate-900">
                재고주수
              </td>
              {monthlyData.map((item) => (
                <td
                  key={`weeks-${item.month}`}
                  className="px-3 py-2 text-sm text-right text-slate-700 bg-slate-50"
                >
                  {item.weeksCurrent === null
                    ? "-"
                    : `${Math.round(item.weeksCurrent)}주`}
                </td>
              ))}
            </tr>
            {/* 판매매출(M) 행 (당년도) */}
            <tr className="border-b border-slate-100">
              <td className="px-4 py-2 text-sm font-medium text-slate-900">
                판매매출(M)
              </td>
              {monthlyData.map((item) => {
                // 이미 백만 단위이므로 그대로 사용
                return (
                  <td
                    key={`sales-current-${item.month}`}
                    className="px-3 py-2 text-sm text-right text-slate-700"
                  >
                    {item.salesAmountCurrent === 0 || !item.salesAmountCurrent
                      ? "-"
                      : `${Math.round(item.salesAmountCurrent).toLocaleString('ko-KR')}M`}
                  </td>
                );
              })}
            </tr>
            {/* 판매매출 YOY 행 - 연한 회색 배경 */}
            <tr className="border-b border-slate-100 bg-slate-50">
              <td className="px-4 py-2 text-sm font-medium text-slate-900">
                판매매출 YOY
              </td>
              {monthlyData.map((item) => (
                <td
                  key={`sales-yoy-${item.month}`}
                  className="px-3 py-2 text-sm text-right text-slate-700 bg-slate-50"
                >
                  {item.salesYOY === null
                    ? "-"
                    : `${Math.round(item.salesYOY)}%`}
                </td>
              ))}
            </tr>
            {/* 재고자산(M) 행 (당년도) */}
            <tr className="border-b border-slate-100">
              <td className="px-4 py-2 text-sm font-medium text-slate-900">
                재고자산(M)
              </td>
              {monthlyData.map((item) => {
                // 이미 백만 단위이므로 그대로 사용
                return (
                  <td
                    key={`stock-current-${item.month}`}
                    className="px-3 py-2 text-sm text-right text-slate-700"
                  >
                    {item.stockAmountCurrent === 0 || !item.stockAmountCurrent
                      ? "-"
                      : `${Math.round(item.stockAmountCurrent).toLocaleString('ko-KR')}M`}
                  </td>
                );
              })}
            </tr>
            {/* 재고자산 YOY 행 - 연한 회색 배경 */}
            <tr className="border-b border-slate-100 bg-slate-50">
              <td className="px-4 py-2 text-sm font-medium text-slate-900">
                재고자산 YOY
              </td>
              {monthlyData.map((item) => (
                <td
                  key={`stock-yoy-${item.month}`}
                  className="px-3 py-2 text-sm text-right text-slate-700 bg-slate-50"
                >
                  {item.stockYOY === null
                    ? "-"
                    : `${Math.round(item.stockYOY)}%`}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

