# 브랜드 자산

게시자는 yback, 제품명은 Fill Documents이다. 사용자는 이름을 크게 적는 방식보다 브랜드를 은근하게 담는 방향을 요청했고 다크 모드 자산도 요청했다.

최종 시안은 접힌 종이의 형태와 여백에 y를 암시하는 잉크색 심벌이다. 밝은 배경용과 어두운 배경용 PNG를 제공한다. `plugins/fill-documents/assets/`와 독립 스킬의 `assets/`에 같은 파일을 포함한다. 이미지 생성 도구의 기본 모드로 제작했으며, 원본 이미지를 리사이즈하거나 래스터 편집하지 않고 복사했다.

## 밝은 배경용 생성 프롬프트

> Use case: logo-brand. A quiet, premium symbol for a document utility by yback. The brand must be subtly encoded, never spelled out. Create a single original abstract folded-paper monogram: two or three broad interlocking strokes suggest the corner of a document, and their negative space only subtly hints at a lowercase y on a second glance. Do NOT draw a literal y glyph, do NOT write yback or any text, do NOT enclose it in a document outline or badge. One refined, balanced, compact geometric silhouette, suitable for a respected editorial publisher. Dark ink-navy solid shape on perfectly uniform warm ivory square background. No gold, no gradients, no textures, no shadows, no realism, no mockup, no decorative strokes. Very few elements; precise geometry; beautiful deliberate asymmetric fold balanced within a centered square composition; ample negative space. Legible as one distinctive mark at 32px. Output one square icon, not a brand board.

## 다크 모드 편집 프롬프트

밝은 자산을 참조 이미지로 사용했다.

> Create the dark-mode companion of the supplied abstract folded-paper brand symbol. Keep EXACTLY the same geometry, proportions, negative spaces, composition, and generous margins. Change only the color scheme: the existing dark ink-navy symbol becomes warm ivory; the existing ivory background becomes uniform very dark ink-navy. No text, no new marks, no gold, no textures, no shadow, no gradients. Flat crisp logo icon. One square PNG.
