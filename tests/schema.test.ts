import { describe, expect, it } from 'vitest';
import { dailyIssueSchema } from '../src/lib/daily/schema';

describe('dailyIssueSchema', () => {
  it('accepts a valid daily issue payload', () => {
    const issue = {
      date: '2026-03-22',
      slug: '2026-03-22',
      title: '📊 GitHub 天榜速递（2026-03-22）',
      rawText: '正文',
      generatedAt: '2026-03-22T10:00:00.000Z',
      sources: [
        { label: 'A', url: 'https://a.test' },
        { label: 'B', url: 'https://b.test' },
        { label: 'C', url: 'https://c.test' },
        { label: 'D', url: 'https://d.test' },
      ],
      sections: [
        { id: 'overall', title: '全站天榜 Top10', items: [] },
        { id: 'typescript', title: 'TypeScript 天榜 Top5', items: [] },
        { id: 'vue', title: 'Vue 天榜 Top5', items: [] },
        { id: 'react', title: 'React 天榜 Top5', items: [] },
      ],
    };

    expect(() => dailyIssueSchema.parse(issue)).not.toThrow();
  });
});
