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
    /**
     * About의 이력서 PDF 링크. 파일이 있을 때만 쓴다(없으면 생략). file은 public/ 기준
     * 사이트 내부 경로이며, 경로·파일 존재는 src/lib/content.ts가 검사한다.
     */
    resumes: z
      .array(
        z.strictObject({
          label: z.string().min(1),
          file: z.string().min(1),
        }),
      )
      .max(2)
      .optional(),
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

/**
 * 担当工程 id. 화면 이름은 UI 문구(src/i18n/ui.ts의 project.phase.*)이고,
 * 표시 순서는 콘텐츠 파일의 순서와 무관하게 이 배열 순서로 고정한다(docs/tasks/T06-projects.md).
 */
export const PHASES = [
  'requirements',
  'design',
  'development',
  'testing',
  'operation',
] as const;

/** 상세의 課題·設計 절: 본문 문단 + 요점 목록(선택). */
const detailText = z.strictObject({
  body: z.string().min(1),
  points: z.array(z.string().min(1)).min(1).max(4).optional(),
});

/** 라벨과 값 한 쌍. 상세의 結果 지표, 技術 항목에 쓴다. */
const labeledValue = z.strictObject({
  label: z.string().min(1),
  value: z.string().min(1),
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
    /** 있으면 Home 대표 프로젝트에 이 순서로 표시한다. Projects 목록에서도 먼저 나온다. */
    featuredOrder: z.number().int().positive().optional(),
    /** 대표가 아닌 프로젝트의 목록 순서. featuredOrder가 없는 항목에만 쓴다(src/lib/content.ts 검사). */
    order: z.number().int().positive().optional(),
    /** 担当工程. 같은 값은 한 번만 쓴다. */
    phases: z
      .array(z.enum(PHASES))
      .min(1)
      .max(PHASES.length)
      .refine((phases) => new Set(phases).size === phases.length, {
        message: 'phases(担当工程)에 같은 값이 두 번 이상 나온다',
      }),
    /** 상세 개요의 「チーム」 값. 없으면 그 칸을 출력하지 않는다. */
    team: z.string().min(1).optional(),
    /** 상세 課題: 어떤 시스템의 어떤 문제였나, 규모 */
    challenge: detailText,
    /** 상세 設計: 선택한 구조와 이유, 대안, 본인 역할 범위 */
    design: detailText,
    /** 상세 結果: 지표(측정 조건 포함)와 보충 문단. 둘 중 하나 이상 */
    result: z
      .strictObject({
        metrics: z.array(labeledValue).min(1).max(4).optional(),
        body: z.string().min(1).optional(),
      })
      .refine((result) => result.metrics || result.body, {
        message: 'result에는 metrics와 body 중 하나 이상이 필요하다',
      }),
    /** 상세 技術: 분류별 기술과 선정 이유 */
    techDetails: z.array(labeledValue).min(1).max(5),
  }),
});

// 언어별: src/content/career/<ja|en>/<slug>.yaml. 같은 slug가 두 언어에 모두 있어야 한다.
const career = defineCollection({
  loader: glob({ pattern: '*/*.yaml', base: './src/content/career' }),
  schema: z.strictObject({
    placeholder,
    company: z.string().min(1),
    /** 날짜 타입이 아닌 표기 문자열. 예: 2023.04 – 現在 */
    period: z.string().min(1),
    role: z.string().min(1),
    highlights: z.array(z.string().min(1)).min(1).max(3),
    /** 화면 순서. 1이 최신이다. 같은 slug는 언어마다 같은 값이어야 한다. */
    order: z.number().int().positive(),
    /** 현재 재직 중이면 true. 타임라인의 점을 채워 표시한다. */
    current: z.boolean().default(false),
  }),
});

// 언어 공통 1건: src/content/certifications.yaml. 배열 순서가 화면 순서다.
const certifications = defineCollection({
  loader: glob({ pattern: 'certifications.yaml', base: './src/content' }),
  schema: z.strictObject({
    items: z.array(
      z.discriminatedUnion('status', [
        z.strictObject({
          status: z.literal('acquired'),
          placeholder,
          name: localizable,
          /** 취득 연월. 날짜 타입이 아닌 표기 문자열(YYYY.MM, 임시 값은 20XX.XX) */
          acquired: z.string().min(1),
        }),
        z.strictObject({
          status: z.literal('studying'),
          placeholder,
          name: localizable,
        }),
      ]),
    ),
  }),
});

export const collections = {
  profile,
  skills,
  projects,
  career,
  certifications,
};
