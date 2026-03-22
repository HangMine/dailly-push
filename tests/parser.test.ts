import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseGitHubTrending } from '../scripts/lib/github-trending';
import { parseBestOfJs } from '../scripts/lib/bestofjs';

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
});
