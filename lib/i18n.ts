import { useLanguageStore } from "./store/language-store";
import koTranslations from "@/i18n/ko.json";
import zhTranslations from "@/i18n/zh.json";

type TranslationKey = 
  | keyof typeof koTranslations.common
  | `brands.${keyof typeof koTranslations.brands}`
  | `categories.${keyof typeof koTranslations.categories}`
  | `page.${keyof typeof koTranslations.page}`
  | `heatmap.${keyof typeof koTranslations.heatmap}`
  | `summary.${keyof typeof koTranslations.summary}`
  | `heatmapTable.${keyof typeof koTranslations.heatmapTable}`
  | `chart.${keyof typeof koTranslations.chart}`
  | `monthlyTable.${keyof typeof koTranslations.monthlyTable}`
  | `legend.${keyof typeof koTranslations.legend}`;

const translations = {
  ko: koTranslations,
  zh: zhTranslations,
};

/**
 * i18n 번역 함수
 * @param key - 번역 키 (예: "common.loading", "categories.shoes")
 * @returns 번역된 문자열
 */
export function t(key: string): string {
  const language = useLanguageStore.getState().language;
  const translation = translations[language];
  
  const keys = key.split(".");
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      // 키를 찾을 수 없으면 키 자체를 반환
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return typeof value === "string" ? value : key;
}

/**
 * 숫자 포맷팅 (언어별)
 * @param value - 포맷팅할 숫자
 * @param locale - 로케일 (기본값: 현재 언어)
 * @returns 포맷팅된 문자열
 */
export function formatNumber(value: number): string {
  const language = useLanguageStore.getState().language;
  const locale = language === "ko" ? "ko-KR" : "zh-CN";
  return value.toLocaleString(locale);
}

/**
 * React Hook 버전의 t() 함수
 */
export function useT() {
  const language = useLanguageStore((state) => state.language);
  
  return (key: string): string => {
    const translation = translations[language];
    const keys = key.split(".");
    let value: any = translation;
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return typeof value === "string" ? value : key;
  };
}

