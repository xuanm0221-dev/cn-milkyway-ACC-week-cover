/**
 * 소분류명칭.csv 파일을 읽어서 subcategory-names.json으로 변환하는 스크립트
 * 
 * 사용법:
 * node scripts/convert-subcategory-csv.js
 * 
 * CSV 파일 경로: C:\2.대시보드(파일)\재고주수\소분류명칭.csv
 * 출력 파일: public/data/subcategory-names.json
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join('C:', '2.대시보드(파일)', '재고주수', '소분류명칭.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'subcategory-names.json');
const OUTPUT_TS_PATH = path.join(__dirname, '..', 'utils', 'subcategory-names.ts');

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return {};
  
  // 첫 번째 줄이 헤더인지 확인
  const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const codeIndex = header.indexOf('소분류');
  const nameIndex = header.indexOf('소분류 명칭');
  
  if (codeIndex === -1 || nameIndex === -1) {
    throw new Error('CSV 파일에 "소분류" 또는 "소분류 명칭" 컬럼이 없습니다.');
  }
  
  const map = {};
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const code = values[codeIndex]?.trim().toUpperCase();
    const name = values[nameIndex]?.trim();
    
    if (!code) continue; // 코드가 없으면 스킵
    if (!name) continue; // 명칭이 비어 있으면 스킵 (나중에 기본값 "없음" 사용)
    
    map[code] = name;
  }
  
  return map;
}

function generateTypeScriptFile(map) {
  const entries = Object.entries(map)
    .map(([code, name]) => `  "${code}": "${name}",`)
    .join('\n');
  
  return `/**
 * 소분류 코드와 한글 명칭 매핑
 * 이 파일은 scripts/convert-subcategory-csv.js에 의해 자동 생성됩니다.
 * CSV 파일을 수정한 후 스크립트를 다시 실행하세요.
 */
export type SubcategoryNameMap = Record<string, string>;

// 소분류 코드와 한글 명칭 매핑
export const subcategoryNameMap: SubcategoryNameMap = {
${entries}
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
  return \`\${normalized}(\${name})\`;
}
`;
}

try {
  // CSV 파일 읽기
  if (!fs.existsSync(CSV_PATH)) {
    console.warn(`⚠️  CSV 파일을 찾을 수 없습니다: ${CSV_PATH}`);
    console.warn('기본 빈 매핑 객체를 생성합니다.');
    const emptyMap = {};
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(emptyMap, null, 2), 'utf-8');
    fs.writeFileSync(OUTPUT_TS_PATH, generateTypeScriptFile(emptyMap), 'utf-8');
    console.log('✅ 빈 매핑 파일이 생성되었습니다.');
    process.exit(0);
  }
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const map = parseCSV(csvContent);
  
  // 출력 디렉토리 생성
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // JSON 파일로 저장
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(map, null, 2), 'utf-8');
  console.log(`✅ JSON 파일이 생성되었습니다: ${OUTPUT_PATH}`);
  
  // TypeScript 파일로 저장
  const tsContent = generateTypeScriptFile(map);
  fs.writeFileSync(OUTPUT_TS_PATH, tsContent, 'utf-8');
  console.log(`✅ TypeScript 파일이 생성되었습니다: ${OUTPUT_TS_PATH}`);
  console.log(`✅ 총 ${Object.keys(map).length}개의 소분류 매핑이 생성되었습니다.`);
  
  // 매핑 샘플 출력 (디버깅용)
  const sample = Object.entries(map).slice(0, 10);
  console.log('📋 매핑 샘플 (처음 10개):');
  sample.forEach(([code, name]) => {
    console.log(`   ${code}: ${name}`);
  });
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}

