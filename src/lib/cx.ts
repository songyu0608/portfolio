/**
 * 클래스 이름을 공백으로 합친다. false·null·undefined·빈 문자열은 뺀다.
 * Astro의 class:list 대신 쓰는 작은 도우미다(clsx 같은 의존성을 더하지 않는다).
 */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}
