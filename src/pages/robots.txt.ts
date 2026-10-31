// 크롤러 안내(T13). 빌드 시 정적 파일 /robots.txt로 나간다. 모든 크롤러에 전체를 허용하고 사이트맵 위치를 알린다.
// robots.txt는 누구나 읽을 수 있으므로, 단계 8의 회사별 비공개 페이지 경로는 여기에 적지 않는다(noindex로 뺀다).
import type { APIRoute } from 'astro';
import { absoluteUrl, requireSite } from '../lib/seo';

export const GET: APIRoute = ({ site }) => {
  const sitemap = absoluteUrl('/sitemap.xml', requireSite(site));
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
