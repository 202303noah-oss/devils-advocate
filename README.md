# 악마의 변호인 — 웹 배포 패키지

로그인 없이, 무료로, 계속 열어둘 수 있는 버전입니다. (Google Gemini 무료 API를 사용합니다)

## 폴더 구성
```
index.html       ← 화면 (프론트엔드)
*.jsx            ← 화면 컴포넌트 (character/screens/app/devil-api/tweaks-panel/simulate)
character*.png, character_spin.gif  ← 캐릭터 이미지
api/
└── judge.js     ← Gemini를 호출하는 서버 (백엔드, API 키를 안전하게 숨겨줌)
uploads/         ← 이전에 업로드해둔 원본 이미지 (참고용, 화면에서 직접 쓰이진 않음)
README.md        ← 이 파일
```

## 배포 순서 (Vercel 기준, 전부 무료)

### 1. Gemini 무료 API 키 발급
1. https://aistudio.google.com 접속 → 구글 계정으로 로그인
2. 왼쪽 메뉴에서 "Get API key" 클릭 → "Create API key" 클릭
3. 발급된 키를 복사해둡니다 (신용카드 필요 없음)

### 2. Vercel 프로젝트 연결
1. https://vercel.com 접속 → GitHub 계정으로 로그인 (무료)
2. "Add New… → Project" 클릭 → 이 저장소(`devils-advocate`) 선택 → Import
3. Framework Preset은 "Other"로 두면 됩니다 (별도 빌드 없음, Root Directory도 그대로 두면 됩니다)

### 3. 환경변수 설정
**배포하기 전에** "Environment Variables" 항목에 아래를 추가:
- Name: `GEMINI_API_KEY`
- Value: (1단계에서 복사한 키 붙여넣기)

### 4. 배포
"Deploy" 클릭. 몇 분 후 `https://프로젝트이름.vercel.app` 같은 주소가 생성됩니다. 이 링크를 그대로 공유하면 됩니다 — 로그인 없이 누구나 바로 사용할 수 있어요.

## 확인 방법
배포된 링크에 접속해서 기획 초안을 입력하고 "기획 깨기 시작"을 눌러보세요. 잠시 후 신호등 카드와 피드백이 뜨면 정상 작동하는 것입니다.

## 나중에 수정하고 싶다면
- **판정 기준/캐릭터 톤을 바꾸고 싶을 때**: `api/judge.js` 안의 `SYSTEM_PROMPT` 내용을 수정
- **화면 디자인을 바꾸고 싶을 때**: `index.html`의 `<style>` 부분, 또는 각 `.jsx` 파일 수정
- 수정 후 GitHub에 다시 푸시하면 Vercel이 자동으로 재배포합니다

## 비용
Gemini 무료 티어 한도(하루 요청 수) 안에서는 완전 무료입니다. 포트폴리오 용도로 하루 몇~몇십 명이 써보는 수준이면 한도에 걸릴 일은 거의 없습니다.

## 개발자용 메모
- `index.html`은 빌드 과정 없이 React + Babel(브라우저 내 변환)을 CDN에서 그대로 불러옵니다. 디자인 프로토타입과 동일한 방식입니다.
- 화면 하단 왼쪽의 `01 입력 / 02 검증 / 03 결과` 스위처와 우측 하단 Tweaks 패널은 원래 디자인에 포함되어 있던 개발용 도구로, 요청에 따라 그대로 남겨두었습니다. 실제 서비스로 공개하기 전에 제거하고 싶다면 `app.jsx`에서 해당 블록만 지우면 됩니다.
- 파일 첨부는 파일 이름만 API로 전달되고 본문 텍스트는 읽지 않습니다 (원본 디자인과 동일).
