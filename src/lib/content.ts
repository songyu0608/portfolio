// 콘텐츠 조회와 여러 항목에 걸친 규칙 검사. 페이지는 getCollection을 직접 쓰지 않고 이 함수들을 쓴다.
// 규칙을 어기면 어긴 규칙을 모두 적은 오류를 던져 빌드를 멈춘다(docs/ARCHITECTURE.md §2 "콘텐츠 구조").
import { getCollection, type CollectionEntry } from 'astro:content';
import { locales, type Locale } from '../i18n/ui';

export type Profile = CollectionEntry<'profile'>['data'];
export type Skill =
  CollectionEntry<'skills'>['data']['categories'][number]['items'][number];
export type Project = CollectionEntry<'projects'>['data'] & { slug: string };
/** 이름을 한 언어로 정한 기술. */
export type LocalizedSkill = Omit<Skill, 'name'> & { name: string };

export interface HomeContent {
  profile: Profile;
  /** Home 핵심 기술. homeOrder 순서. */
  skills: LocalizedSkill[];
  /** Home 대표 프로젝트. featuredOrder 순서. */
  projects: Project[];
}

// docs/CONTENT.md "기술 스택 표기 규칙", docs/PLAN.md §3
const FEATURED_PROJECTS = { min: 2, max: 3 };
const HOME_SKILLS = { min: 3, max: 6 };
const PRIMARY_SKILLS = { min: 2, max: 4, perCategory: 2 };

const isLocale = (value: string): value is Locale =>
  (locales as string[]).includes(value);

/** 언어 공통 문자열 또는 언어별 값({ ja, en })에서 그 언어의 값을 고른다. */
export const localize = (
  value: string | Record<Locale, string>,
  locale: Locale,
): string => (typeof value === 'string' ? value : value[locale]);

const outOfRange = (
  count: number,
  { min, max }: { min: number; max: number },
) => count < min || count > max;

/** 같은 순서 값이 두 번 이상 나오면 그 값을 돌려준다. */
function duplicates(values: number[]): number[] {
  return [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
}

let placeholderReported = false;

async function loadContent() {
  const [profileEntries, skillEntries, projectEntries] = await Promise.all([
    getCollection('profile'),
    getCollection('skills'),
    getCollection('projects'),
  ]);
  const errors: string[] = [];

  // 프로필: 언어마다 1건
  const profiles = new Map<string, Profile>(
    profileEntries.map((entry) => [entry.id, entry.data]),
  );
  for (const id of profiles.keys()) {
    if (!isLocale(id)) {
      errors.push(
        `프로필: 알 수 없는 언어 파일 profile/${id}.yaml (가능: ${locales.join(', ')})`,
      );
    }
  }
  for (const locale of locales) {
    if (!profiles.has(locale))
      errors.push(`프로필: profile/${locale}.yaml이 없다`);
  }

  // 프로젝트: <언어>/<slug>, 같은 slug가 모든 언어에 있어야 한다
  const projects = Object.fromEntries(
    locales.map((l) => [l, [] as Project[]]),
  ) as Record<Locale, Project[]>;
  for (const entry of projectEntries) {
    const [locale, slug] = entry.id.split('/');
    if (!isLocale(locale) || !slug) {
      errors.push(
        `프로젝트: projects/${entry.id}.yaml — 언어 폴더(${locales.join(', ')}) 안에 있어야 한다`,
      );
      continue;
    }
    projects[locale].push({ ...entry.data, slug });
  }
  const slugs = new Set(locales.flatMap((l) => projects[l].map((p) => p.slug)));
  for (const slug of slugs) {
    const found = locales.map((l) => projects[l].find((p) => p.slug === slug));
    const missing = locales.filter((_, i) => !found[i]);
    if (missing.length > 0) {
      errors.push(
        `프로젝트: ${slug} — ${missing.map((l) => `${l}/${slug}.yaml`).join(', ')}이 없다`,
      );
      continue;
    }
    const orders = found.map((p) => p?.featuredOrder);
    if (new Set(orders).size > 1) {
      errors.push(
        `프로젝트: ${slug} — featuredOrder가 언어마다 다르다 (${locales.map((l, i) => `${l}: ${orders[i] ?? '없음'}`).join(', ')})`,
      );
    }
  }
  for (const locale of locales) {
    const featured = projects[locale].filter(
      (p) => p.featuredOrder !== undefined,
    );
    if (outOfRange(featured.length, FEATURED_PROJECTS)) {
      errors.push(
        `대표 프로젝트(featuredOrder가 있는 항목)는 ${FEATURED_PROJECTS.min}~${FEATURED_PROJECTS.max}개여야 한다: ${locale} ${featured.length}개`,
      );
    }
    const dup = duplicates(featured.map((p) => p.featuredOrder ?? 0));
    if (dup.length > 0)
      errors.push(
        `대표 프로젝트: ${locale}에서 featuredOrder ${dup.join(', ')}이 겹친다`,
      );
  }

  // 기술 스택: 언어 공통 1건
  const categories = skillEntries.flatMap((entry) => entry.data.categories);
  if (skillEntries.length === 0) errors.push('기술 스택: skills.yaml이 없다');
  const categoryIds = categories.map((c) => c.id);
  const dupIds = categoryIds.filter((id, i) => categoryIds.indexOf(id) !== i);
  if (dupIds.length > 0)
    errors.push(
      `기술 스택: 분류 id ${[...new Set(dupIds)].join(', ')}이 겹친다`,
    );

  const allSkills = categories.flatMap((c) => c.items);
  const homeSkills = allSkills.filter((s) => s.homeOrder !== undefined);
  if (outOfRange(homeSkills.length, HOME_SKILLS)) {
    errors.push(
      `Home 핵심 기술(homeOrder가 있는 항목)은 ${HOME_SKILLS.min}~${HOME_SKILLS.max}개여야 한다: ${homeSkills.length}개`,
    );
  }
  const dupHome = duplicates(homeSkills.map((s) => s.homeOrder ?? 0));
  if (dupHome.length > 0)
    errors.push(`Home 핵심 기술: homeOrder ${dupHome.join(', ')}이 겹친다`);

  const primary = allSkills.filter((s) => s.primary);
  const primaryOffHome = primary.filter((s) => s.homeOrder === undefined);
  if (primaryOffHome.length > 0) {
    errors.push(
      `주력 기술은 모두 Home 핵심 기술에 포함해야 한다(homeOrder 필요): ${primaryOffHome.map((s) => localize(s.name, 'ja')).join(', ')}`,
    );
  }
  if (outOfRange(primary.length, PRIMARY_SKILLS)) {
    errors.push(
      `주력 기술은 전체 ${PRIMARY_SKILLS.min}~${PRIMARY_SKILLS.max}개여야 한다: ${primary.length}개`,
    );
  }
  for (const category of categories) {
    const count = category.items.filter((s) => s.primary).length;
    if (count > PRIMARY_SKILLS.perCategory) {
      errors.push(
        `주력 기술은 분류당 0~${PRIMARY_SKILLS.perCategory}개여야 한다: ${category.id} ${count}개`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[content] 콘텐츠 규칙 위반 ${errors.length}건\n${errors.map((e) => `- ${e}`).join('\n')}`,
    );
  }

  // 배포 전 0건 확인용(docs/CONTENT.md "임시 문구 규칙"). 0건이어도 출력하고, 프로세스마다 한 번만 출력한다.
  if (!placeholderReported) {
    placeholderReported = true;
    const counts = {
      profile: [...profiles.values()].filter((p) => p.placeholder).length,
      skills: allSkills.filter((s) => s.placeholder).length,
      projects: locales.flatMap((l) => projects[l]).filter((p) => p.placeholder)
        .length,
    };
    const total = counts.profile + counts.skills + counts.projects;
    console.warn(
      `[content] placeholder entries: ${total} (profile ${counts.profile}, skills ${counts.skills}, projects ${counts.projects})`,
    );
  }

  return {
    profiles: profiles as Map<Locale, Profile>,
    projects,
    homeSkills,
  };
}

export async function getHomeContent(locale: Locale): Promise<HomeContent> {
  const content = await loadContent();
  const profile = content.profiles.get(locale);
  // loadContent가 모든 언어의 프로필이 있는지 검사했으므로 여기에 오지 않는다.
  if (!profile) throw new Error(`[content] 프로필 없음: ${locale}`);
  return {
    profile,
    skills: content.homeSkills
      .toSorted((a, b) => (a.homeOrder ?? 0) - (b.homeOrder ?? 0))
      .map((skill) => ({ ...skill, name: localize(skill.name, locale) })),
    projects: content.projects[locale]
      .filter((p) => p.featuredOrder !== undefined)
      .toSorted((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0)),
  };
}
