/**
 * 소분류 코드와 한글 명칭 매핑
 * 이 파일은 scripts/convert-subcategory-csv.js에 의해 자동 생성됩니다.
 * CSV 파일을 수정한 후 스크립트를 다시 실행하세요.
 */
export type SubcategoryNameMap = Record<string, string>;

// 소분류 코드와 한글 명칭 매핑
export const subcategoryNameMap: SubcategoryNameMap = {
  "BG": "가방",
  "BK": "백팩",
  "BM": "버킷백",
  "BN": "비니",
  "BQ": "숄더백",
  "BS": "야구복",
  "BV": "베이비",
  "BW": "보스톤백",
  "CB": "여성 베레모",
  "CP": "운동모",
  "CR": "크로스백",
  "CV": "캔버스화",
  "DD": "데님원피스",
  "DJ": "다운점퍼",
  "DK": "진자켓",
  "DP": "진바지",
  "DR": "데님셔츠",
  "DS": "진스커트",
  "DV": "다운베스트",
  "ET": "기타",
  "FD": "폴라폴리스점퍼",
  "GL": "장갑",
  "HD": "후드티",
  "HH": "캐리어(하드케이스)",
  "HS": "힙색",
  "HT": "햇",
  "JA": "목걸이",
  "JB": "팔찌",
  "JC": "귀걸이",
  "JD": "반지",
  "JK": "방수자켓",
  "JP": "점퍼",
  "KC": "니트가디건",
  "KP": "니트풀오버",
  "KT": "니트",
  "LG": "레깅스",
  "LP": "슬리퍼",
  "MC": "메시캡",
  "MF": "머플러(스카프)",
  "MK": "마스크",
  "ML": "토시",
  "MT": "맨투맨",
  "MU": "뮬",
  "OP": "원피스",
  "OR": "쇼퍼백",
  "PD": "패딩",
  "PO": "파우치",
  "PQ": "폴로 티셔츠",
  "PT": "팬츠",
  "RN": "런닝화",
  "RS": "반팔티셔츠",
  "S1": "반팔티 & 스웨트팬츠",
  "S2": "맨투맨셋트",
  "S5": "트레이닝 세트",
  "S6": "나시티&반바지",
  "SC": "선캡",
  "SD": "샌들",
  "SH": "신발",
  "SK": "스커트",
  "SM": "우븐반바지",
  "SO": "양말",
  "SP": "반바지",
  "SQ": "아쿠아 슈즈",
  "SW": "스윔웨어",
  "SX": "스니커즈",
  "TK": "탱크탑",
  "TO": "나시",
  "TP": "트레이닝(하의)",
  "TR": "트레이닝(상의)",
  "TS": "반팔카라티셔츠",
  "TW": "타올",
  "VT": "베스트",
  "WB": "방한화",
  "WJ": "방풍자켓",
  "WM": "방한모",
  "WP": "우븐팬츠",
  "WR": "와이어캡",
  "WS": "우븐셔츠",
};

/**
 * 소분류 코드를 사람이 알아보기 쉬운 형식으로 변환
 * @param code 소분류 코드 (예: "CV")
 * @returns 포맷된 문자열 (예: "CV(캔버스화)" 또는 "CV(없음)")
 */
export function formatSubcategoryLabel(code: string | null | undefined): string {
  if (!code) return "";
  
  const normalized = code.trim().toUpperCase();
  const name = subcategoryNameMap[normalized] ?? "없음";
  return `${normalized}(${name})`;
}
