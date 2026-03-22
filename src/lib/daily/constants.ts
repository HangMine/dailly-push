import type { SectionId } from '@/lib/daily/schema';

export const SECTION_CONFIG: Array<{ id: SectionId; title: string; limit: number; sourceLabel: string; sourceUrl: string }> = [
  {
    id: 'overall',
    title: '全站天榜 Top10',
    limit: 10,
    sourceLabel: 'GitHub Trending（全站）',
    sourceUrl: 'https://github.com/trending?since=daily',
  },
  {
    id: 'typescript',
    title: 'TypeScript 天榜 Top5',
    limit: 5,
    sourceLabel: 'GitHub Trending（TypeScript）',
    sourceUrl: 'https://github.com/trending/typescript?since=daily',
  },
  {
    id: 'vue',
    title: 'Vue 天榜 Top5',
    limit: 5,
    sourceLabel: 'Best of JS（Vue）',
    sourceUrl: 'https://bestofjs.org/projects?page=1&limit=5&tags=vue&sort=daily',
  },
  {
    id: 'react',
    title: 'React 天榜 Top5',
    limit: 5,
    sourceLabel: 'Best of JS（React）',
    sourceUrl: 'https://bestofjs.org/projects?page=1&limit=5&tags=react&sort=daily',
  },
];

export const SOURCE_LINKS = SECTION_CONFIG.map(({ sourceLabel, sourceUrl }) => ({
  label: sourceLabel,
  url: sourceUrl,
}));

export const REASON_PREFIX = '\u3000\u3000\u3000\u3000- ';
