# APIScope Privacy Policy

Last updated: 2026-06-17

APIScope is a Chromium browser extension for developers that captures, masks,
converts, and replays a web page's API requests inside the DevTools panel.

## Summary

APIScope does not collect, store, sell, or transmit your personal data. Everything
the extension captures stays on your own device. There is no backend server, no
analytics, and no third-party tracking.

## What data the extension handles

All processing is local to your browser:

- Captured requests and responses are held in memory for the DevTools session and
  are discarded when the panel closes, unless you explicitly export them to a file
  that you save yourself.
- Settings such as masking keys, response-rewrite rules, and saved variables are
  stored locally through the browser `storage` API. They never leave your device.
- Files you import (HAR, Postman, session JSON) are read locally for display only.

## Data we do not collect

APIScope sends no captured traffic, request bodies, headers, tokens, or any other
content anywhere. The developer receives nothing.

## The only outbound network request

To tell you when a newer version is available, the extension makes a single read
request to the public GitHub Releases API:

  https://api.github.com/repos/monkshark/apiscope/releases/latest

This request retrieves the latest published version number. It sends no personal
data and no captured content. It carries only what any normal web request to GitHub
includes (for example your IP address, as seen by GitHub). You can read GitHub's
own privacy terms at https://docs.github.com/site-policy. The update check can be
ignored; it has no effect on captured data.

## Permissions

The extension requests the minimum permissions needed for its features. Each
permission is used only on your own device for the feature described in the store
listing, and never to gather data for the developer.

## Contact

Questions: justinchoo0814@gmail.com

---

# APIScope 개인정보 처리방침

최종 수정: 2026-06-17

APIScope는 웹 페이지의 API 요청을 브라우저 DevTools 패널 안에서 캡처·마스킹·변환·재현하는
개발자용 Chromium 확장 프로그램입니다.

## 요약

APIScope는 사용자의 개인정보를 수집·저장·판매·전송하지 않습니다. 확장이 캡처하는 모든 것은
사용자 기기 안에만 머뭅니다. 백엔드 서버도, 분석 도구도, 제3자 추적도 없습니다.

## 확장이 다루는 데이터

모든 처리는 브라우저 안에서 로컬로만 이뤄집니다.

- 캡처된 요청·응답은 DevTools 세션 동안 메모리에만 있다가 패널을 닫으면 사라집니다. 사용자가
  직접 파일로 내보내 저장하는 경우에만 남습니다.
- 마스킹 키, 응답 재작성 규칙, 저장한 변수 같은 설정은 브라우저 `storage` API로 로컬에만
  저장되며 기기를 벗어나지 않습니다.
- 사용자가 불러오는 파일(HAR, Postman, 세션 JSON)은 표시 목적으로 로컬에서만 읽습니다.

## 수집하지 않는 데이터

APIScope는 캡처한 트래픽, 요청 본문, 헤더, 토큰 등 어떤 내용도 외부로 보내지 않습니다.
개발자는 아무것도 받지 않습니다.

## 유일한 외부 네트워크 요청

새 버전이 나왔는지 알려주기 위해, 확장은 공개된 GitHub Releases API에 읽기 요청 하나만
보냅니다.

  https://api.github.com/repos/monkshark/apiscope/releases/latest

이 요청은 최신 버전 번호만 가져옵니다. 개인정보나 캡처 내용은 보내지 않으며, GitHub로 가는
일반 웹 요청에 포함되는 정보(예: GitHub가 보는 IP 주소)만 담깁니다. GitHub의 개인정보
약관은 https://docs.github.com/site-policy 에서 볼 수 있습니다. 업데이트 확인은 무시해도
되며 캡처된 데이터에 영향을 주지 않습니다.

## 권한

확장은 기능에 필요한 최소 권한만 요청합니다. 각 권한은 스토어 설명에 적힌 기능을 위해
사용자 기기 안에서만 쓰이며, 개발자를 위한 데이터 수집에는 절대 쓰이지 않습니다.

## 연락처

문의: justinchoo0814@gmail.com
