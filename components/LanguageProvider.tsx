"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/lib/store/language-store";

/**
 * 언어에 따라 body의 data-lang 속성을 설정하는 컴포넌트
 */
export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    // body에 data-lang 속성 추가
    document.body.setAttribute("data-lang", language);
    // html lang 속성도 업데이트
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  return <>{children}</>;
}

