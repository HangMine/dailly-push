import { describe, expect, it } from 'vitest';
import { buildIssue } from '../scripts/lib/build-issue';
import { parseGitHubTrending } from '../scripts/lib/github-trending';
import type { ScrapedSection } from '../scripts/lib/types';

describe('failure paths', () => {
  it('throws when parser output is structurally invalid', () => {
    expect(() =>
      parseGitHubTrending('<article class="Box-row"></article>', 'https://github.com/trending?since=daily', 1),
    ).toThrow();
  });

  it('allows short GitHub Trending lists when explicitly requested', () => {
    const html = [
      '<article class="Box-row">',
      '<h2><a href="/alpha/one">alpha / one</a></h2>',
      '<p>desc</p>',
      '<span itemprop="programmingLanguage">TypeScript</span>',
      '<a href="/alpha/one/stargazers">123</a>',
      '<span>5 stars today</span>',
      '</article>',
    ].join('');

    const items = parseGitHubTrending(html, 'https://github.com/trending?since=daily', 10, {
      allowShort: true,
    });

    expect(items).toHaveLength(1);
  });

  it('throws when enrichment is missing', () => {
    const sections: ScrapedSection[] = [
      {
        id: 'overall',
        title: '全站天榜 Top10',
        sourceUrl: 'https://github.com/trending?since=daily',
        items: [
          {
            owner: 'alpha',
            repoName: 'one',
            repoUrl: 'https://github.com/alpha/one',
            sourceUrl: 'https://github.com/trending?since=daily',
            language: 'TypeScript',
            descriptionEn: 'desc',
            starsToday: 1,
            starsTotal: 2,
            tags: [],
          },
        ],
      },
      { id: 'typescript', title: 'TypeScript 天榜 Top5', sourceUrl: 'x', items: [] },
      { id: 'vue', title: 'Vue 天榜 Top5', sourceUrl: 'y', items: [] },
      { id: 'react', title: 'React 天榜 Top5', sourceUrl: 'z', items: [] },
    ];

    expect(() =>
      buildIssue({
        date: '2026-03-22',
        sections,
        enrichments: new Map(),
        metadata: new Map(),
      }),
    ).toThrow('缺少仓库增强结果');
  });
});
