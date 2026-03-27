import { describe, expect, it } from 'vitest';
import { REASON_PREFIX } from '../src/lib/daily/constants';
import { formatQqMessage } from '../src/lib/daily/formatters';
import type { DailyIssue } from '../src/lib/daily/schema';

const sampleIssue: DailyIssue = {
  date: '2026-03-22',
  slug: '2026-03-22',
  title: '📊 GitHub & Skills 天榜速递（2026-03-22）',
  rawText: '',
  generatedAt: '2026-03-22T10:00:00.000Z',
  sources: [
    { label: 'GitHub Trending（全站）', url: 'https://github.com/trending?since=daily' },
    { label: 'GitHub Trending（TypeScript）', url: 'https://github.com/trending/typescript?since=daily' },
    { label: 'Best of JS（Vue）', url: 'https://bestofjs.org/projects?page=1&limit=5&tags=vue&sort=daily' },
    { label: 'Best of JS（React）', url: 'https://bestofjs.org/projects?page=1&limit=5&tags=react&sort=daily' },
    { label: 'skills.sh（Trending）', url: 'https://skills.sh/trending' },
    { label: 'skills.sh（Hot）', url: 'https://skills.sh/hot' },
  ],
  sections: [
    {
      id: 'overall',
      title: '全站天榜 Top10',
      items: [
        {
          rank: 1,
          owner: 'alpha',
          repoName: 'one',
          language: 'TypeScript',
          category: 'AI 自动化工具',
          summaryZh: '把自动化工作流和 AI 能力打包成了更容易上手的实践方案。',
          starsToday: 321,
          starsTotal: 12345,
          reasons: ['最近的演示内容更直观，降低了第一次了解项目的门槛。', '应用场景和“怎么真正用起来”之间的距离更短，更容易被转发。', '开发者对提效工具的需求持续高涨，和项目定位高度匹配。'],
          repoUrl: 'https://github.com/alpha/one',
          sourceUrl: 'https://github.com/trending?since=daily',
        },
      ],
    },
    {
      id: 'typescript',
      title: 'TypeScript 天榜 Top5',
      items: [],
    },
    {
      id: 'vue',
      title: 'Vue 天榜 Top5',
      items: [],
    },
    {
      id: 'react',
      title: 'React 天榜 Top5',
      items: [],
    },
    {
      id: 'skills-trending',
      title: 'Trending Skills Top 5',
      items: [],
    },
    {
      id: 'skills-hot',
      title: 'Hot Skills Top 5',
      items: [],
    },
  ],
};

describe('formatQqMessage', () => {
  it('keeps section order, full-width indents, and source links', () => {
    const output = formatQqMessage(sampleIssue);

    expect(output).toContain('📊 GitHub & Skills 天榜速递（2026-03-22）');
    expect(output).toContain('━━━━━━━━━━\n【全站天榜 Top10】');
    expect(output).toContain(`${REASON_PREFIX}最近的演示内容更直观`);
    expect(output).toContain('来源链接：');
    expect(output).not.toContain('Resetting');
    expect(output).not.toContain('I will');
  });
});
