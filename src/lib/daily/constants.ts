import type { DailySectionConfig } from '../../../scripts/lib/multi-source';

export const SECTION_CONFIG: DailySectionConfig[] = [
  {
    id: 'overall',
    title: '全站天榜 Top10',
    limit: 10,
    sourceLabel: 'GitHub Trending（全站）',
    sourceUrl: 'https://github.com/trending?since=daily',
    sourceKind: 'github-trending',
  },
  {
    id: 'typescript',
    title: 'TypeScript 天榜 Top5',
    limit: 5,
    sourceLabel: 'GitHub Trending（TypeScript）',
    sourceUrl: 'https://github.com/trending/typescript?since=daily',
    sourceKind: 'github-trending',
  },
  {
    id: 'vue',
    title: 'Vue 天榜 Top5',
    limit: 5,
    sourceLabel: 'Best of JS（Vue）',
    sourceUrl: 'https://bestofjs.org/projects?page=1&limit=5&tags=vue&sort=daily',
    sourceKind: 'bestofjs',
  },
  {
    id: 'react',
    title: 'React 天榜 Top5',
    limit: 5,
    sourceLabel: 'Best of JS（React）',
    sourceUrl: 'https://bestofjs.org/projects?page=1&limit=5&tags=react&sort=daily',
    sourceKind: 'bestofjs',
  },
  {
    id: 'skills-trending',
    title: 'Trending Skills Top 5',
    limit: 5,
    sourceLabel: 'skills.sh（Trending）',
    sourceUrl: 'https://skills.sh/trending',
    sourceKind: 'skills-trending',
  },
  {
    id: 'skills-hot',
    title: 'Hot Skills Top 5',
    limit: 5,
    sourceLabel: 'skills.sh（Hot）',
    sourceUrl: 'https://skills.sh/hot',
    sourceKind: 'skills-hot',
  },
  {
    id: 'mcp',
    title: 'MCP 单天热榜 Top 10',
    limit: 10,
    sourceLabel: 'MCP Market（Daily）',
    sourceUrl: 'https://mcpmarket.com/daily/top-mcp-server-list-march-27-2026',
    sourceKind: 'mcpmarket-daily',
  },
];

export const SOURCE_LINKS = SECTION_CONFIG.map(({ sourceLabel, sourceUrl }) => ({
  label: sourceLabel,
  url: sourceUrl,
}));

export const REASON_PREFIX = '\u3000\u3000\u3000\u3000- ';
