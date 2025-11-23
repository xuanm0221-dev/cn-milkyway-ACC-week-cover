# 재고주수 대시보드

Next.js + TypeScript + TailwindCSS로 구현된 재고주수 히트맵 대시보드입니다.

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 데이터 준비

1. Python 전처리 스크립트(`preprocess_stock_weeks.py`)를 실행하여 JSON 파일을 생성합니다.
   ```bash
   python preprocess_stock_weeks.py
   ```
   
2. 생성된 JSON 파일을 `public/data/` 폴더에 저장합니다:
   - `stock_weeks_MLB.json` → `MLB_result.json`으로 이름 변경
   - `stock_weeks_MLB_KIDS.json` → `MLB_KIDS_result.json`으로 이름 변경
   - `stock_weeks_DISCOVERY.json` → `DISCOVERY_result.json`으로 이름 변경

**참고**: 생성된 JSON 파일은 각 연도별로 **1~12월 전체 월 키**가 항상 포함됩니다.
- 데이터가 있는 월: 실제 집계 값
- 데이터가 없는 월: 기본값(null 및 기초데이터 0)

3. 소분류 명칭 CSV 변환 (선택사항):
   - 소분류 코드를 한글 명칭과 함께 표시하려면 `C:\2.대시보드(파일)\재고주수\소분류명칭.csv` 파일이 필요합니다.
   - CSV 파일 형식: `code,name` (예: `CV,캔버스화`)
   - 변환 스크립트 실행:
     ```bash
     npm run convert-subcategory
     ```
   - 이 스크립트는 CSV를 읽어서 `utils/subcategory-names.ts` 파일을 자동 생성합니다.
   - 대시보드에서 소분류 코드가 `CV(캔버스화)` 형식으로 표시됩니다.

## 프로젝트 구조

```
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx             # 메인 페이지 (브랜드 탭)
│   └── globals.css          # 전역 스타일
├── components/
│   └── StockWeeksHeatmap.tsx # 히트맵 컴포넌트
├── types/
│   └── stock-weeks.ts       # TypeScript 타입 정의
├── utils/
│   └── color-helper.ts      # 색상 헬퍼 함수
└── public/
    └── data/                # JSON 데이터 파일
```

## 주요 기능

- 브랜드별 탭 전환 (MLB, MLB KIDS, DISCOVERY)
- 중분류별 히트맵 테이블 (슈즈, 모자, 가방, 기타악세)
- 연도별/월별 재고주수 표시
- 색상 기반 히트맵 (재고주수 구간별 색상)
- 소분류 드릴다운 기능

## 색상 규칙

- 회색: 데이터 없음 또는 "판매0"
- 연한 초록: 0~10주
- 초록: 10~20주
- 노랑: 20~40주
- 주황: 40~60주
- 빨강: 60주 이상
- 보라: 음수 (반품)

