// 콘텐츠 조회와 여러 항목에 걸친 규칙 검사. 페이지는 getCollection을 직접 쓰지 않고 이 함수들을 쓴다.
// 규칙을 어기면 어긴 규칙을 모두 적은 오류를 던져 빌드를 멈춘다(docs/ARCHITECTURE.md §2 "콘텐츠 구조").
import { getCollection, type CollectionEntry } from 'astro:content';
import { publicDir } from 'astro:config/server';
import { CONTACT_LINKS, PHASES } from '../content.config';
import { locales, type Locale } from '../i18n/ui';

export type Profile = CollectionEntry<'profile'>['data'];
export type Skill =
  CollectionEntry<'skills'>['data']['categories'][number]['items'][number];
export type Project = CollectionEntry<'projects'>['data'] & { slug: string };
/** 担当工程 id. */
export type Phase = (typeof PHASES)[number];
/** 이름을 한 언어로 정한 기술. */
export type LocalizedSkill = Omit<Skill, 'name'> & { name: string };
export type CareerEntry = CollectionEntry<'career'>['data'] & { slug: string };
type Certification = CollectionEntry<'certifications'>['data']['items'][number];
/** 유니온의 각 타입에서 name을 한 언어 문자열로 바꾼다(Omit이 유니온을 합치지 않게 분배). */
type WithLocalizedName<T> = T extends unknown
  ? Omit<T, 'name'> & { name: string }
  : never;
/** 이름을 한 언어로 정한 자격증. status로 구분하며, 학습 중이면 acquired가 없다. */
export type LocalizedCertification = WithLocalizedName<Certification>;

/** About 기술 스택의 분류. 이름은 페이지 언어 값, nameEn은 일본어 페이지의 보조 표기용 영어 이름. */
export interface SkillCategory {
  id: string;
  name: string;
  nameEn: string;
  skills: LocalizedSkill[];
}

export interface HomeContent {
  profile: Profile;
  /** Home 핵심 기술. homeOrder 순서. */
  skills: LocalizedSkill[];
  /** Home 대표 프로젝트. featuredOrder 순서. */
  projects: Project[];
}

export interface ProjectsContent {
  /** 대표 프로젝트. featuredOrder 순서. */
  featured: Project[];
  /** 대표가 아닌 프로젝트. order 순서. */
  others: Project[];
}

/** 상세 페이지 하단 이전·다음 링크에 쓰는 프로젝트 요약. */
export type ProjectLink = Pick<Project, 'slug' | 'title'>;

/** 프로젝트 상세 페이지 하나. 이전·다음은 목록 표시 순서를 따르고 끝과 처음이 이어진다. */
export interface ProjectPage {
  project: Project;
  /** 전체가 2건이면 이전과 다음이 같으므로 이전을 두지 않는다. */
  prev?: ProjectLink;
  next: ProjectLink;
}

export interface AboutContent {
  profile: Profile;
  /** 경력. order 순서(최신이 먼저). */
  career: CareerEntry[];
  /** 기술 스택 전체. skills.yaml의 분류·기술 순서. */
  skillCategories: SkillCategory[];
  /** 자격증. certifications.yaml의 순서(학습 중은 맨 끝). */
  certifications: LocalizedCertification[];
}

type ContactData = CollectionEntry<'contact'>['data'];
/** 연락 링크 서비스 id. */
export type ContactLinkId = (typeof CONTACT_LINKS)[number];

/** 연락 링크 하나. display는 화면에 보이는 주소 문자열(https://와 끝 / 제외). */
export type ContactLink = ContactData['links'][number] & { display: string };

/** Contact 페이지와 푸터가 쓰는 연락처. */
export interface ContactContent {
  /** 소개 문단(그 언어 값) */
  intro: string;
  email: ContactData['email'];
  /** contact.yaml의 순서 */
  links: ContactLink[];
}

// docs/CONTENT.md "기술 스택 표기 규칙", docs/PLAN.md §3
const FEATURED_PROJECTS = { min: 2, max: 3 };
const HOME_SKILLS = { min: 3, max: 6 };
const PRIMARY_SKILLS = { min: 2, max: 4, perCategory: 2 };
// docs/CONTENT.md "자격증 표기 규칙"
const MAX_STUDYING_CERTIFICATIONS = 1;
// 프로젝트 slug(파일 이름). URL과 CSS 식별자(view-transition-name)에 그대로 쓴다.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

// 이력서 파일 존재 확인에 쓰는 Node 내장 모듈. @types/node가 없어(T05: 새 의존성 금지) 정적 import는
// 타입 검사가 실패하므로, 쓰는 메서드만 타입을 적고 빌드(Node) 시점에 동적 import한다.
interface NodeFs {
  statSync(
    path: URL,
    options: { throwIfNoEntry: false },
  ): { isFile(): boolean } | undefined;
}
const NODE_FS = 'node:fs';
const loadFs = async () => (await import(/* @vite-ignore */ NODE_FS)) as NodeFs;

/**
 * 이력서 링크 경로를 검사하고 문제가 있으면 이유를 돌려준다. 외부 URL·`..` 경로를 거부하고,
 * public/ 기준으로 해석한 최종 경로가 public/ 안의 실제 파일이어야 한다(docs/tasks/T05-about.md).
 */
function resumeFileProblem(file: string, fs: NodeFs): string | undefined {
  if (!file.startsWith('/') || file.startsWith('//') || file.includes('\\')) {
    return '`/`로 시작하는 사이트 내부 경로여야 한다(외부 URL 불가)';
  }
  if (file.split('/').includes('..')) return '`..`를 쓸 수 없다';
  const base = new URL(String(publicDir).replace(/\/?$/, '/'));
  const target = new URL(`.${file}`, base);
  if (!target.href.startsWith(base.href)) return 'public/ 밖을 가리킨다';
  if (!fs.statSync(target, { throwIfNoEntry: false })?.isFile()) {
    return `public${file} 파일이 없다`;
  }
  return undefined;
}

// docs/tasks/T07-contact.md: `@` 하나, 앞뒤가 비어 있지 않고 도메인에 `.`이 있으며 공백이 없다.
// 주소가 쓸 수 있는 mailto: 링크인지만 본다. RFC 전체를 검사하지는 않는다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@]+$/;
const CONTACT_HOSTS: Record<ContactLinkId, string[]> = {
  github: ['github.com'],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
};

/** 연락 링크 URL을 검사하고 문제가 있으면 이유를 돌려준다. */
function contactUrlProblem(id: ContactLinkId, url: string): string | undefined {
  if (!url.startsWith('https://')) return '`https://`로 시작해야 한다';
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return 'URL 형식이 아니다';
  }
  const hosts = CONTACT_HOSTS[id];
  if (!hosts.includes(host)) {
    return `호스트가 ${hosts.join(' 또는 ')}여야 한다: ${host}`;
  }
  return undefined;
}

let placeholderReported = false;

async function loadContent() {
  const [
    profileEntries,
    skillEntries,
    projectEntries,
    careerEntries,
    certificationEntries,
    contactEntries,
  ] = await Promise.all([
    getCollection('profile'),
    getCollection('skills'),
    getCollection('projects'),
    getCollection('career'),
    getCollection('certifications'),
    getCollection('contact'),
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
  const resumes = [...profiles].flatMap(([id, profile]) =>
    (profile.resumes ?? []).map((resume) => ({ id, file: resume.file })),
  );
  if (resumes.length > 0) {
    const fs = await loadFs();
    for (const { id, file } of resumes) {
      const problem = resumeFileProblem(file, fs);
      if (problem)
        errors.push(`이력서: profile/${id}.yaml의 ${file} — ${problem}`);
    }
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
    // slug는 URL과 view-transition-name(project-title-<slug>, CSS 식별자)에 쓴다.
    if (!SLUG_PATTERN.test(slug)) {
      errors.push(
        `프로젝트: projects/${entry.id}.yaml — 파일 이름(slug)은 영문 소문자·숫자와 하이픈만 쓴다 (예: order-api)`,
      );
      continue;
    }
    // 担当工程은 콘텐츠 파일의 순서와 무관하게 고정 순서로 돌려준다.
    const phases = PHASES.filter((phase) => entry.data.phases.includes(phase));
    projects[locale].push({ ...entry.data, phases, slug });
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
    for (const key of ['featuredOrder', 'order'] as const) {
      const values = found.map((p) => p?.[key]);
      if (new Set(values).size > 1) {
        errors.push(
          `프로젝트: ${slug} — ${key}가 언어마다 다르다 (${locales.map((l, i) => `${l}: ${values[i] ?? '없음'}`).join(', ')})`,
        );
      }
    }
    // phases는 조회 시 고정 순서로 정렬했으므로 이어 붙인 문자열로 집합을 비교할 수 있다.
    const phaseSets = found.map((p) => p?.phases.join(', '));
    if (new Set(phaseSets).size > 1) {
      errors.push(
        `프로젝트: ${slug} — phases(担当工程)가 언어마다 다르다 (${locales.map((l, i) => `${l}: ${phaseSets[i]}`).join(' / ')})`,
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
    // 목록 순서: 대표 프로젝트는 featuredOrder, 그 밖의 프로젝트는 order를 쓴다.
    for (const project of projects[locale]) {
      if (project.featuredOrder !== undefined && project.order !== undefined) {
        errors.push(
          `프로젝트: ${locale}/${project.slug}.yaml — 대표 프로젝트(featuredOrder 있음)에는 order를 쓰지 않는다`,
        );
      }
      if (project.featuredOrder === undefined && project.order === undefined) {
        errors.push(
          `프로젝트: ${locale}/${project.slug}.yaml — 대표가 아닌 프로젝트(featuredOrder 없음)에는 order가 필요하다`,
        );
      }
    }
    const dupOrder = duplicates(
      projects[locale].flatMap((p) => (p.order === undefined ? [] : [p.order])),
    );
    if (dupOrder.length > 0)
      errors.push(
        `프로젝트: ${locale}에서 order ${dupOrder.join(', ')}이 겹친다`,
      );
  }

  // 경력: <언어>/<slug>, 같은 slug가 모든 언어에 있고 order·current가 같아야 한다
  const career = Object.fromEntries(
    locales.map((l) => [l, [] as CareerEntry[]]),
  ) as Record<Locale, CareerEntry[]>;
  for (const entry of careerEntries) {
    const [locale, slug] = entry.id.split('/');
    if (!isLocale(locale) || !slug) {
      errors.push(
        `경력: career/${entry.id}.yaml — 언어 폴더(${locales.join(', ')}) 안에 있어야 한다`,
      );
      continue;
    }
    career[locale].push({ ...entry.data, slug });
  }
  const careerSlugs = new Set(
    locales.flatMap((l) => career[l].map((c) => c.slug)),
  );
  for (const slug of careerSlugs) {
    const found = locales.map((l) => career[l].find((c) => c.slug === slug));
    const missing = locales.filter((_, i) => !found[i]);
    if (missing.length > 0) {
      errors.push(
        `경력: ${slug} — ${missing.map((l) => `${l}/${slug}.yaml`).join(', ')}이 없다`,
      );
      continue;
    }
    for (const key of ['order', 'current'] as const) {
      const values = found.map((c) => c?.[key]);
      if (new Set(values).size > 1) {
        errors.push(
          `경력: ${slug} — ${key}가 언어마다 다르다 (${locales.map((l, i) => `${l}: ${values[i]}`).join(', ')})`,
        );
      }
    }
  }
  for (const locale of locales) {
    if (career[locale].length === 0)
      errors.push(`경력: ${locale}에 항목이 없다(1건 이상 필요)`);
    const dup = duplicates(career[locale].map((c) => c.order));
    if (dup.length > 0)
      errors.push(`경력: ${locale}에서 order ${dup.join(', ')}이 겹친다`);
  }

  // 자격증: 언어 공통 1건. 학습 중은 0~1개이고 맨 끝
  const certifications = certificationEntries.flatMap(
    (entry) => entry.data.items,
  );
  const studyingIndexes = certifications.flatMap((c, i) =>
    c.status === 'studying' ? [i] : [],
  );
  if (studyingIndexes.length > MAX_STUDYING_CERTIFICATIONS) {
    errors.push(
      `자격증: 학습 중(status: studying)은 ${MAX_STUDYING_CERTIFICATIONS}개까지다: ${studyingIndexes.length}개`,
    );
  }
  if (studyingIndexes.some((index) => index !== certifications.length - 1)) {
    errors.push(
      `자격증: 학습 중(status: studying) 항목은 목록 맨 끝에 둔다: ${studyingIndexes
        .filter((index) => index !== certifications.length - 1)
        .map((index) => localize(certifications[index].name, 'ja'))
        .join(', ')}`,
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
    // 주력 기술은 분류 안에서 주력이 아닌 기술보다 앞에 둔다
    const firstNormal = category.items.findIndex((s) => !s.primary);
    const latePrimary = category.items.filter(
      (s, i) => s.primary && firstNormal !== -1 && i > firstNormal,
    );
    if (latePrimary.length > 0) {
      errors.push(
        `주력 기술은 분류 안에서 주력이 아닌 기술보다 앞에 둔다: ${category.id} — ${latePrimary.map((s) => localize(s.name, 'ja')).join(', ')}`,
      );
    }
  }

  // 연락처: 언어 공통 1건. 메일 형식, 링크 URL(https, 서비스별 호스트), 서비스 중복
  const contact = contactEntries[0]?.data;
  if (contactEntries.length !== 1 || !contact) {
    errors.push(
      `연락처: contact.yaml이 1건이어야 한다: ${contactEntries.length}건`,
    );
  } else {
    if (!EMAIL_PATTERN.test(contact.email.address)) {
      errors.push(
        `연락처: email.address 형식이 잘못됐다(\`@\` 하나, 앞뒤가 비어 있지 않고 도메인에 \`.\`, 공백 없음): ${contact.email.address}`,
      );
    }
    for (const link of contact.links) {
      const problem = contactUrlProblem(link.id, link.url);
      if (problem) errors.push(`연락처: links의 ${link.id} — ${problem}`);
    }
    const ids = contact.links.map((link) => link.id);
    const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    if (dupIds.length > 0) {
      errors.push(`연락처: links에 ${dupIds.join(', ')}이 두 번 이상 나온다`);
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
      career: locales.flatMap((l) => career[l]).filter((c) => c.placeholder)
        .length,
      certifications: certifications.filter((c) => c.placeholder).length,
      // intro, email, links를 각각 1건으로 센다.
      contact: contact
        ? [contact, contact.email, ...contact.links].filter(
            (c) => c.placeholder,
          ).length
        : 0,
    };
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    console.warn(
      `[content] placeholder entries: ${total} (${Object.entries(counts)
        .map(([name, n]) => `${name} ${n}`)
        .join(', ')})`,
    );
  }

  return {
    profiles: profiles as Map<Locale, Profile>,
    projects,
    homeSkills,
    career,
    categories,
    certifications,
    // 검사를 통과했으므로 contact는 있다.
    contact: contact as ContactData,
  };
}

function getProfile(profiles: Map<Locale, Profile>, locale: Locale): Profile {
  const profile = profiles.get(locale);
  // loadContent가 모든 언어의 프로필이 있는지 검사했으므로 여기에 오지 않는다.
  if (!profile) throw new Error(`[content] 프로필 없음: ${locale}`);
  return profile;
}

/** 목록 표시 순서로 나눈 프로젝트: 대표(featuredOrder 순) → 그 밖(order 순). */
function sortProjects(projects: Project[]): ProjectsContent {
  return {
    featured: projects
      .filter((p) => p.featuredOrder !== undefined)
      .toSorted((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0)),
    others: projects
      .filter((p) => p.featuredOrder === undefined)
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  };
}

export async function getHomeContent(locale: Locale): Promise<HomeContent> {
  const content = await loadContent();
  return {
    profile: getProfile(content.profiles, locale),
    skills: content.homeSkills
      .toSorted((a, b) => (a.homeOrder ?? 0) - (b.homeOrder ?? 0))
      .map((skill) => ({ ...skill, name: localize(skill.name, locale) })),
    projects: sortProjects(content.projects[locale]).featured,
  };
}

export async function getProjectsContent(
  locale: Locale,
): Promise<ProjectsContent> {
  const content = await loadContent();
  return sortProjects(content.projects[locale]);
}

export async function getProjectPages(locale: Locale): Promise<ProjectPage[]> {
  const content = await loadContent();
  const { featured, others } = sortProjects(content.projects[locale]);
  const ordered = [...featured, ...others];
  const link = ({ slug, title }: Project): ProjectLink => ({ slug, title });
  // 대표 프로젝트가 2개 이상이므로(loadContent 검사) ordered는 2건 이상이다.
  return ordered.map((project, index) => {
    const prev = ordered[(index - 1 + ordered.length) % ordered.length];
    const next = ordered[(index + 1) % ordered.length];
    return {
      project,
      prev: prev === next ? undefined : link(prev),
      next: link(next),
    };
  });
}

export async function getAboutContent(locale: Locale): Promise<AboutContent> {
  const content = await loadContent();
  return {
    profile: getProfile(content.profiles, locale),
    career: content.career[locale].toSorted((a, b) => a.order - b.order),
    skillCategories: content.categories.map((category) => ({
      id: category.id,
      name: category.name[locale],
      nameEn: category.name.en,
      skills: category.items.map((skill) => ({
        ...skill,
        name: localize(skill.name, locale),
      })),
    })),
    certifications: content.certifications.map((certification) => ({
      ...certification,
      name: localize(certification.name, locale),
    })),
  };
}

/** 화면에 보이는 주소 문자열: https://와 끝의 /를 뺀다. */
const displayUrl = (url: string) =>
  url.replace(/^https:\/\//, '').replace(/\/$/, '');

export async function getContactContent(
  locale: Locale,
): Promise<ContactContent> {
  const { contact } = await loadContent();
  return {
    intro: contact.intro[locale],
    email: contact.email,
    links: contact.links.map((link) => ({
      ...link,
      display: displayUrl(link.url),
    })),
  };
}
