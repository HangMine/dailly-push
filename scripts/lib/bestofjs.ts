import * as cheerio from 'cheerio';
import type { ScrapedRepo } from './types';
import { ensureExactCount, extractOwnerRepo, normalizeWhitespace, parseLooseNumber } from './utils';

type CheerioHost = Parameters<cheerio.CheerioAPI>[0];

function getFragmentRows($: cheerio.CheerioAPI, host: CheerioHost) {
  return $(host)
    .find('template[id^="P:"]')
    .toArray()
    .map((template) => $(template).attr('id')?.replace(/^P:/, 'S:'))
    .filter((value): value is string => Boolean(value))
    .map((id) => $(`[id="${id}"]`))
    .filter((fragment) => fragment.length > 0);
}

export function parseBestOfJs(html: string, sourceUrl: string, limit: number): ScrapedRepo[] {
  const $ = cheerio.load(html);

  const items = $('tr[data-testid="project-card"]')
    .toArray()
    .map((row) => {
      const fragments = getFragmentRows($, row);
      const compositeHtml = [$.html(row), ...fragments.map((fragment) => $.html(fragment))]
        .filter(Boolean)
        .join('');
      const item$ = cheerio.load(`<table><tbody>${compositeHtml}</tbody></table>`);
      const repoLink = item$('a[aria-label="GitHub repository"]').first().attr('href');
      const descriptionEn = normalizeWhitespace(item$('.font-serif').first().text());
      const tags = item$('a[href*="tags="]')
        .toArray()
        .map((link) => normalizeWhitespace(item$(link).text()))
        .filter(Boolean);
      const starsMatch = item$.text().match(/\+\s*([\d.,kKmM]+)/);

      if (!repoLink || !starsMatch) {
        throw new Error('Best of JS 条目缺少 GitHub 链接或增量 Star。');
      }

      const { owner, repoName } = extractOwnerRepo(repoLink);

      return {
        owner,
        repoName,
        repoUrl: repoLink,
        sourceUrl,
        language: 'Unknown',
        descriptionEn,
        starsToday: parseLooseNumber(starsMatch[1]),
        starsTotal: null,
        tags,
      };
    });

  return ensureExactCount(items, limit, `Best of JS: ${sourceUrl}`);
}
