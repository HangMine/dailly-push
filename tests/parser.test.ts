import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseGitHubTrending } from '../scripts/lib/github-trending';
import { parseBestOfJs } from '../scripts/lib/bestofjs';
import { parseSkillsHot, parseSkillsTrending } from '../scripts/lib/skills';

function fixture(name: string): string {
  return readFileSync(resolve('tests/fixtures', name), 'utf8');
}

describe('parsers', () => {
  it('parses GitHub Trending and truncates to requested limit', () => {
    const items = parseGitHubTrending(
      fixture('github-trending-overall.html'),
      'https://github.com/trending?since=daily',
      2,
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      owner: 'alpha',
      repoName: 'one',
      language: 'TypeScript',
      starsToday: 321,
      starsTotal: 12345,
    });
    expect(items[1].repoName).toBe('two');
  });

  it('parses Best of JS rows and extracts GitHub repository metadata', () => {
    const items = parseBestOfJs(
      fixture('bestofjs-vue.html'),
      'https://bestofjs.org/projects?page=1&limit=5&tags=vue&sort=daily',
      2,
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      owner: 'slidevjs',
      repoName: 'slidev',
      starsToday: 27,
    });
    expect(items[0].tags).toContain('Vue');
    expect(items[1].repoUrl).toBe('https://github.com/nuxt/nuxt');
  });

  it('parses skills trending cards', () => {
    const items = parseSkillsTrending(fixture('skills-trending.html'), 'https://skills.sh/trending', 2);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      owner: 'skills',
      repoName: 'find-skills',
      language: '技能发现',
      starsToday: 12300,
      repoUrl: 'https://skills.sh/vercel-labs/skills/find-skills',
    });
  });

  it('parses skills hot cards with hourly metric and change tag', () => {
    const items = parseSkillsHot(fixture('skills-hot.html'), 'https://skills.sh/hot', 2);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      owner: 'skills',
      repoName: 'pexo-agent',
      language: '通用代理',
      starsToday: 157,
      repoUrl: 'https://skills.sh/pexoai/pexo-skills/pexo-agent',
    });
    expect(items[0].tags).toContain('change:156');
  });
});
