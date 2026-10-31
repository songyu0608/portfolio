# 파비콘·공유 이미지 (T13)

`public/`의 파비콘과 공유 이미지(OG)를 만드는 원본과 스크립트다. 만든 파일은 커밋하고, `pnpm build`에서는 만들지 않는다.
모양 규칙은 `docs/DESIGN.md` §10.

| 출력 | 원본 |
| --- | --- |
| `public/favicon.svg` | 직접 편집하는 원본(64×64 viewBox, 강조색 둥근 사각형 + 흰색 `c`를 선으로 그림. 글꼴에 기대지 않음) |
| `public/favicon.ico` (16·32·48px) | `public/favicon.svg` |
| `public/apple-touch-icon.png` (180×180, 불투명) | `public/favicon.svg`를 강조색 바탕 위에 그림 |
| `public/og/ja.png`, `public/og/en.png` (1200×630) | `scripts/brand/og.html` + 프로필 이름(`src/content/profile/<locale>.yaml`의 `name`) + `src/i18n/ui.ts`의 `site.ogImageLabel` |

## 다시 만들 때

다음을 바꾸면 다시 만든다.

- `public/favicon.svg`
- `scripts/brand/og.html`
- 프로필 이름
- `site.ogImageLabel`
- 강조색·배경색·글자색 토큰(`src/styles/tokens.css`)

```bash
node scripts/brand/build.mjs
```

- Node 24가 필요하다. `src/i18n/ui.ts`를 Node의 타입 제거(type stripping)로 바로 읽기 때문이다.
- Playwright(Chromium)가 필요하다. Playwright는 아직 프로젝트 의존성이 아니다. 단계 7(E2E)에서 devDependency로 들어오면 그것을 쓴다. 그 전에는 `require('playwright')`로 찾을 수 있는 곳에 설치되어 있어야 한다. 예: `npm i -g playwright` 후 `NODE_PATH`에 전역 `node_modules`를 넣고 `npx playwright install chromium`.
- 공유 이미지의 대체 텍스트(`og:image:alt`)는 `BaseLayout`이 같은 두 값(프로필 이름 + `site.ogImageLabel`)으로 만든다. 이미지 글자를 바꾸면 alt도 함께 바뀐다.
- 직함·한 줄 소개처럼 원고에서 바뀔 문구는 이미지에 넣지 않는다(`docs/tasks/T13-seo.md`).
