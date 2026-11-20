# 오행의 집 노을마을 시제품

화의 섬 한 곳에서 들판 산책과 기념물 수집를 시험하는 1인용 브라우저 게임입니다. 붉은 잔디와 손그림 풍경은 게임 안에서 그립니다. 외부 라이브러리와 계정 없이 실행됩니다. 운영 버전의 다섯 섬, 다른 기기 간 채팅과 클라우드 저장은 별도 기획서의 개발 단계에 있습니다.

## 처음 실행할 때

1. ZIP을 풀어 `index.html`을 엽니다. 같은 폴더에 `assets/`, `css/`, `js/`가 있어야 합니다.
2. PC에서는 방향키나 WASD로 걷고 Shift로 달립니다. 모바일에서는 오른쪽 원을 드래그하거나 땅을 탭합니다.
3. 산책 수첩에서 기념물을 고르면 그곳까지 이동합니다. 다가간 뒤 행동 버튼이나 E로 수집합니다.
4. 저장 데이터는 같은 브라우저에 남습니다. 실제 테스트는 배포한 동일 주소에서 진행하세요. 새 기기에는 로컬 저장이 이어지지 않습니다.

## GitHub에 넣는 두 가지 위치

새 저장소에서 이 게임이 첫 화면이라면 압축을 풀고 index.html이 보이는 폴더를 엽니다. GitHub의 Add file → Upload files에서 **그 안의 내용**을 함께 올립니다. 파일 업로드 순서는 자유입니다.

```text
index.html
assets/
  character/  # 걷기 프레임 4장, 정면·후면·측면 이미지
  terrain/    # 하늘·원경·섬·땅·모래·해변 마스크
  fonts/      # 글꼴과 라이선스
css/village.css
js/
  assets.js   # 모든 게임 그림의 상대 경로
  coast.js    # 섬 해안선과 서쪽 절벽의 이동 경계 데이터
  world.js    # 장소·경로 탐색
  scene.js    # 원근 야외 화면과 캐릭터 보행
  landscape.js # 붉은 잔디 마을과 입체 캐릭터 그리기
  game.js     # 터치·키보드·수집·저장
README.md
```

기존 ‘오행의 집’ 사이트에 추가하려면 압축을 푼 폴더 이름을 **village**로 바꾼 뒤, 그 폴더 자체를 기존 Pages 발행 폴더에 올립니다. 기존 메인 페이지에는 다음 링크를 넣을 수 있습니다.

```html
<a href="./village/">화의 섬 노을마을 산책하기</a>
```

기존 발행 위치가 main / (root)이면 village/index.html, main / docs이면 docs/village/index.html입니다. 두 경우 모두 방문 주소는 기존 Pages 주소 끝에 village/를 붙입니다. 이미 운영 중인 사이트의 Pages 설정을 바꿀 필요는 없습니다.

새 저장소의 예시는 Settings → Pages → Deploy from a branch → main → /(root) → Save입니다. 배포 후 Settings → Pages → Visit site로 엽니다. 링크가 아직 보이지 않으면 Actions에서 Pages 작업이 성공했는지 봅니다. 단일 파일 배포를 선택하면 별도로 받은 독립 실행 HTML 하나를 해당 위치에 index.html로 올려도 됩니다.

GitHub Pages 공식 문서
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## 마을 그림과 조작을 수정할 때

js/landscape.js는 붉은 잔디, 마을 소품, 고정 사선 카메라와 캐릭터를 그립니다. js/coast.js에서 해안선을, js/world.js에서 장소와 이동 판정을 관리합니다. 모바일 오른쪽 조이스틱과 달리기 버튼 간격은 css/village.css에서 바꿀 수 있습니다.
