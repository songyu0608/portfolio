// 명령 팔레트·터미널(T10)이 열 때 받는 데이터. 빌드 시 정적 파일 /ja/commands.json으로 나간다.
import type { APIRoute } from 'astro';
import { getCommandData } from '../../lib/content';

export const GET: APIRoute = async () =>
  Response.json(await getCommandData('ja'));
