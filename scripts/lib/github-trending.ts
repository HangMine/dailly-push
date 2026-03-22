import * as cheerio from 'cheerio';
import type { ScrapedRepo } from './types';
import { ensureExactCount, normalizeWhitespace, parseLooseNumber } from './utils';

export function parseGitHubTrending(
  html: string,
  sourceUrl: string,
  limit: number,
  options?: { allowShort?: boolean },
): ScrapedRepo[] {
  const $ = cheerio.load(html);

  const items = $('article.Box-row')
    .toArray()
    .map((article) => {
      const row = $(article);
      const link = row.find('h2 a').first();
      const href = link.attr('href');

      if (!href) {
        throw new Error('GitHub Trending item is missing repository link.');
      }

      const parts = href.split('/').filter(Boolean);
      const owner = parts[0];
      const repoName = parts[1];

      const descriptionEn = normalizeWhitespace(row.find('p').first().text());
      const language =
        normalizeWhitespace(row.find('[itemprop="programmingLanguage"]').first().text()) || 'Unknown';
      const totalStarsText = normalizeWhitespace(row.find('a[href$="/stargazers"]').first().text());
      const starsTodayMatch = row.text().match(/([\d.,kKmM]+)\s+stars today/i);

      if (!owner || !repoName || !starsTodayMatch) {
        throw new Error('GitHub Trending item structure changed.');
      }

      return {
        owner,
        repoName,
        repoUrl: `https://github.com/${owner}/${repoName}`,
        sourceUrl,
        language,
        descriptionEn,
        starsToday: parseLooseNumber(starsTodayMatch[1]),
        starsTotal: parseLooseNumber(totalStarsText),
        tags: [],
      };
    });

  return ensureExactCount(items, limit, `GitHub Trending: ${sourceUrl}`, {
    allowShort: options?.allowShort,
    minimum: 1,
  });
}
