// 콘텐츠 컬렉션 스키마. 구조와 이유는 docs/ARCHITECTURE.md §2 "콘텐츠 구조".
// 항목 하나의 스키마로는 여러 항목에 걸친 규칙(언어 짝, 대표 프로젝트 수, 주력 기술 수 등)을
// 검사할 수 없으므로, 그 규칙은 src/lib/content.ts가 조회할 때 검사한다.
// 알 수 없는 필드는 오타일 가능성이 높으므로 strictObject로 막는다.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 한 줄을 넘을 수 있는 제목·소개 문구. 일본어는 문절 단위로 나눈 배열로 쓰고,
 * 화면은 문절마다 줄바꿈 단위로 출력한다(docs/DESIGN.md §2 타이포그래피). 영어는 문자열이다.
 */
const phrases = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]);

/** 원고를 받기 전의 임시 값이면 true. 배포 전에 모두 false여야 한다(docs/CONTENT.md). */
const placeholder = z.boolean();

/** 언어 공통 값. 언어마다 다르게 보여야 하면(예: 임시 표식) { ja, en }으로 쓴다. */
const localizable = z.union([
  z.string().min(1),
  z.strictObject({ ja: z.string().min(1), en: z.string().min(1) }),
]);

// 언어별 1건: src/content/profile/<ja|en>.yaml
const profile = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/profile' }),
  schema: z.strictObject({
    placeholder,
    name: z.string().min(1),
    role: z.string().min(1),
    tagline: phrases,
    /** Home의 <meta name="description"> */
    description: z.string().min(1),
  }),
});

// 언어 공통 1건: src/content/skills.yaml. 배열 순서가 화면 순서다.
const skills = defineCollection({
  loader: glob({ pattern: 'skills.yaml', base: './src/content' }),
  schema: z.strictObject({
    categories: z
      .array(
        z.strictObject({
          id: z.string().regex(/^[a-z0-9-]+$/),
          name: z.strictObject({
            ja: z.string().min(1),
            en: z.string().min(1),
          }),
          items: z
            .array(
              z.strictObject({
                placeholder,
                name: localizable,
                primary: z.boolean().default(false),
                /** 있으면 Home 핵심 기술에 이 순서로 표시한다. */
                homeOrder: z.number().int().positive().optional(),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  }),
});

// 언어별: src/content/projects/<ja|en>/<slug>.yaml. 같은 slug가 두 언어에 모두 있어야 한다.
const projects = defineCollection({
  loader: glob({ pattern: '*/*.yaml', base: './src/content/projects' }),
  schema: z.strictObject({
    placeholder,
    title: phrases,
    summary: z.string().min(1),
    /** 날짜 타입이 아닌 표기 문자열. 예: 2023.04 – 2025.03 */
    period: z.string().min(1),
    role: z.string().min(1),
    highlights: z.array(z.string().min(1)).min(1).max(2),
    tech: z.array(z.string().min(1)).min(1),
    /** 있으면 Home 대표 프로젝트에 이 순서로 표시한다. */
    featuredOrder: z.number().int().positive().optional(),
  }),
});

export const collections = { profile, skills, projects };
