# APIScope - Chrome Web Store submission kit

Everything below is copy-paste ready for the Web Store developer dashboard.
Plain text is used because the store description fields do not render Markdown.

## Account / cost

One-time USD 5 developer registration fee, per account (not per item, not per
update). Updates are free. Privacy policy URL is required because the extension
uses permissions that can access page data.

Privacy policy URL: host store/PRIVACY.md at a public URL, for example
https://github.com/monkshark/apiscope/blob/main/store/PRIVACY.md

---

## Single purpose (dashboard field)

APIScope captures a web page's API requests in the DevTools panel and lets a
developer search, mask, convert, diff, and replay them. Every feature serves this
one purpose: working with the inspected page's own network requests.

---

## Summary (max 132 chars)

EN: Capture, mask, convert, replay, and intercept a page's API calls in a DevTools panel. Local-only, minimal permissions.

KO: DevTools 패널에서 페이지의 API 호출을 캡처·마스킹·변환·재현·가로채기. 완전 로컬, 최소 권한.

---

## Detailed description (EN)

APIScope turns the browser DevTools into a workbench for a page's API traffic. It
reads requests through the official chrome.devtools API, so it does not intercept
the network and asks for almost no permissions.

Capture and browse
- A dedicated APIScope tab inside DevTools (F12)
- Live capture of XHR and fetch in a virtualized list
- Filters: regex URL, method, status class, hide static assets, full-text body search
- Collapsible JSON tree for request and response bodies

Mask and share safely
- Auto masking of Authorization, Cookie, and token-like headers and query params
- Body PII masking: credit card numbers (Luhn checked), emails, JWTs, bearer tokens
- Placeholder mode swaps secrets for $AUTH_TOKEN or {{AUTH_TOKEN}} so a shared
  command still runs without leaking the real token

Convert and document
- Convert to cURL, HTTPie, and Postman Collection
- Auto-generate Markdown endpoint docs
- Round-trip export and import of Postman, HAR, and re-importable session JSON

Replay and test
- Edit and resend a captured request through the inspected page's own session,
  with no extra permissions and no CORS issues
- Reusable {{variables}}, request diff, and an Intruder-style fuzzer for authorized
  wargames and CTF only

Tools
- A standalone full-tab viewer for HAR and session files
- A Decode side panel (JWT, Base64, URL, Hex, UUID, timestamp) with a right-click
  "Decode selection" and an Alt+Shift+D shortcut
- An optional interceptor that pauses, edits, and forwards in-flight requests

Privacy
- Fully local. No backend, no analytics, no third-party requests. The only outbound
  request is a version check against the public GitHub Releases API, which sends no
  user data.

## Detailed description (KO)

APIScope는 브라우저 DevTools를 페이지 API 트래픽 작업대로 바꿔 줍니다. 공식 chrome.devtools
API로만 요청을 읽기 때문에 네트워크를 가로채지 않고 권한도 거의 요구하지 않습니다.

수집과 탐색
- DevTools(F12) 안의 전용 APIScope 탭
- XHR / fetch 실시간 수집, 가상 스크롤 목록
- 필터: 정규식 URL, 메서드, 상태코드, 정적자원 숨김, 본문 전문 검색
- 요청 / 응답 본문 접이식 JSON 트리

안전한 마스킹과 공유
- Authorization, Cookie, 토큰류 헤더 및 쿼리 파라미터 자동 마스킹
- 본문 민감정보 마스킹: 신용카드(Luhn 검증), 이메일, JWT, Bearer 토큰
- 플레이스홀더 모드로 비밀값을 $AUTH_TOKEN / {{AUTH_TOKEN}} 자리로 바꿔, 진짜 토큰
  노출 없이도 공유한 명령이 그대로 실행됨

변환과 문서화
- cURL, HTTPie, Postman Collection 변환
- 마크다운 엔드포인트 문서 자동 생성
- Postman, HAR, 재import 가능한 세션 JSON 양방향 export / import

재현과 테스트
- 캡처한 요청을 보고 있는 페이지의 세션으로 그대로 재전송 (추가 권한·CORS 없음)
- 재사용 {{변수}}, 요청 diff, 인가된 워게임 / CTF 전용 Intruder형 퍼저

도구
- HAR / 세션 파일용 독립 전체 탭 뷰어
- Decode 사이드패널 (JWT, Base64, URL, Hex, UUID, timestamp) + 우클릭
  "Decode selection" + Alt+Shift+D 단축키
- 진행 중 요청을 멈추고 수정해 보내는 선택적 인터셉터

개인정보
- 완전 로컬. 백엔드·분석·제3자 요청 없음. 유일한 외부 요청은 공개 GitHub Releases API
  버전 확인뿐이며 사용자 데이터를 보내지 않습니다.

---

## Permission justifications (dashboard fields)

storage
  Stores user settings locally: masking keys, response-rewrite rules, saved
  variables, and the cached update-check result. Local only; nothing is transmitted.

tabs
  Opens the standalone viewer in a new tab and targets the active tab for the
  "Decode selection" keyboard shortcut. No browsing history is read or stored.

scripting
  On the Alt+Shift+D shortcut only, reads the current text selection
  (window.getSelection) on the active tab to send it to the decoder side panel.

sidePanel
  Hosts the Decode tool (JWT, Base64, URL, Hex, UUID, timestamp) in the side panel.

contextMenus
  Adds a right-click "Decode selection" item that sends the selected text to the
  decoder side panel.

alarms
  Schedules a once-a-day background check for a newer version via the GitHub
  Releases API. No user data is sent.

debugger
  Powers the optional interceptor. It attaches the Chrome DevTools Protocol Fetch
  domain to the single tab the user explicitly chooses, only while the user has the
  interceptor open, to pause, edit, and forward in-flight requests (a Burp-style
  flow). It detaches when the interceptor window closes. It is never attached
  silently or in the background.

host permissions (<all_urls>)
  The extension works on whatever site the developer is inspecting, which is not
  known in advance. The content scripts that apply user-defined response-rewrite
  rules run at document_start so they can override fetch/XHR before page scripts,
  and the interceptor must be able to attach to any inspected tab. No host is
  contacted by the developer; access is used only to operate on the page the user
  is actively inspecting.

Remote code
  No. The extension executes no remotely hosted code. The resend feature runs a
  fixed code string inside the inspected page via inspectedWindow.eval; that code
  is bundled in the extension, not downloaded. The only network fetch is a JSON
  read of the GitHub Releases API for the version number.

Are you using the activeTab permission
  No.

---

## Data usage disclosures (Privacy practices tab)

What user data do you collect: none.
- Personally identifiable information: No
- Health information: No
- Financial and payment information: No
- Authentication information: No (tokens stay on the device and are never sent to
  the developer)
- Personal communications: No
- Location: No
- Web history: No
- User activity: No
- Website content: No

Certifications (check all three):
- I do not sell or transfer user data to third parties, outside of the approved
  use cases
- I do not use or transfer user data for purposes that are unrelated to my item's
  single purpose
- I do not use or transfer user data to determine creditworthiness or for lending
  purposes

Note: the GitHub version check is an outbound request that transmits no user data,
so no data-collection category applies.

---

## Listing assets

Required
- Icon 128x128: icons/icon-128.png (already in the project)
- At least 1 screenshot, 1280x800 or 640x400 PNG/JPEG. Up to 5 recommended.

Suggested screenshots (1280x800)
1. DevTools panel with a captured request list and the JSON tree open
2. Masking on: a header with Authorization shown as Bearer ***MASKED***, plus the
   safe/raw share toggle in the export menu
3. Convert menu showing a cURL output with a {{AUTH_TOKEN}} placeholder
4. The interceptor pausing a request with editable headers/body
5. The Decode side panel decoding a JWT

Optional
- Small promo tile 440x280
- The README banner (assets/banner.svg) can be rasterized for promo use

Category: Developer Tools
Language: English plus Korean (the UI ships both)

---

## Pre-submit checklist

- Bump version if needed; current is 1.2.0
- Build: npm run build, then zip the dist folder for upload
- Host PRIVACY.md and paste its URL into the privacy policy field
- Fill single purpose, permission justifications, and data disclosures above
- Upload icon and screenshots
- Expect extra review time due to the debugger and <all_urls> permissions
