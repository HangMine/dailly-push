import { load } from 'cheerio';
import type { ScrapedRepo } from './types';

function cleanText(value: string | undefined | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function compactNumber(value: string): number {
  const text = cleanText(value).toUpperCase().replace(/,/g, '');
  const match = text.match(/(-?\d+(?:\.\d+)?)([KMB])?/);
  if (!match) return 0;

  const num = Number(match[1]);
  const unit = match[2];
  const factor = unit === 'K' ? 1_000 : unit === 'M' ? 1_000_000 : unit === 'B' ? 1_000_000_000 : 1;
  return Math.round(num * factor);
}

function toAbsoluteSkillsUrl(href: string | undefined): string {
  if (!href) return 'https://skills.sh';
  if (/^https?:\/\//i.test(href)) return href;
  return `https://skills.sh${href.startsWith('/') ? href : `/${href}`}`;
}

function splitNameCategory(value: string): { name: string; category: string } {
  const text = cleanText(value);
  const parts = text.split('｜').map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { name: parts[0], category: parts.slice(1).join(' / ') };
  }
  return { name: text || '-', category: '-' };
}

function extractCardBlocks(html: string): string[] {
  const matches = html.match(/<a[^>]+href="\/[^"#?]+"[^>]*>[\s\S]*?<\/a>/g) ?? [];
  return matches.filter((block) => /skills\.sh\//i.test(`https://skills.sh${block}`) || /<svg|24h|1H|Change/i.test(block));
}

function fallbackParse(html: string, sourceUrl: string, limit: number, mode: 'trending' | 'hot'): ScrapedRepo[] {
  const blocks = extractCardBlocks(html);
  const items: ScrapedRepo[] = [];

  for (const block of blocks) {
    const hrefMatch = block.match(/href="([^"]+)"/i);
    const href = hrefMatch?.[1];
    if (!href || href === '/trending' || href === '/hot') continue;

    const titleMatch = block.match(/>([^<>]{2,120})<\/h3>/i) || block.match(/>([^<>]{2,120})<\/p>/i);
    const descMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

    const metricMatch =
      mode === 'trending'
        ? block.match(/24h[^0-9]*([0-9][0-9.,KMB+-]*)/i)
        : block.match(/1H[^0-9]*([0-9][0-9.,KMB+-]*)/i);

    const rawTitle = cleanText(titleMatch?.[1]);
    if (!rawTitle) continue;

    const { name, category } = splitNameCategory(rawTitle);
    const description = cleanText(descMatch?.[1]);
    items.push({
      owner: 'skills',
      repoName: name,
      repoUrl: toAbsoluteSkillsUrl(href),
      sourceUrl,
      language: category,
      descriptionEn: description,
      starsToday: compactNumber(metricMatch?.[1] ?? '0'),
      starsTotal: 0,
      tags: ['skills.sh', mode],
    });

    if (items.length >= limit) break;
  }

  return items;
}

export function parseSkillsTrending(html: string, sourceUrl: string, limit: number): ScrapedRepo[] {
  const $ = load(html);
  const items: ScrapedRepo[] = [];
  const seen = new Set<string>();

  $('a[href^="/"]').each((_, element) => {
    if (items.length >= limit) return false;

    const href = $(element).attr('href');
    if (!href || href === '/trending' || href === '/hot') return;
    if (seen.has(href)) return;

    const text = cleanText($(element).text());
    if (!/24h/i.test(text)) return;

    const title = cleanText($(element).find('h3, h2').first().text()) || cleanText(text.split('24h')[0]);
    const desc = cleanText($(element).find('p').first().text());
    if (!title) return;

    const { name, category } = splitNameCategory(title);
    const installMatch = text.match(/24h[^0-9]*([0-9][0-9.,KMB]*)/i);

    seen.add(href);
    items.push({
      owner: 'skills',
      repoName: name,
      repoUrl: toAbsoluteSkillsUrl(href),
      sourceUrl,
      language: category,
      descriptionEn: desc,
      starsToday: compactNumber(installMatch?.[1] ?? '0'),
      starsTotal: 0,
      tags: ['skills.sh', 'trending'],
    });
  });

  if (items.length >= limit) return items.slice(0, limit);
  return fallbackParse(html, sourceUrl, limit, 'trending');
}

export function parseSkillsHot(html: string, sourceUrl: string, limit: number): ScrapedRepo[] {
  const $ = load(html);
  const items: ScrapedRepo[] = [];
  const seen = new Set<string>();

  $('a[href^="/"]').each((_, element) => {
    if (items.length >= limit) return false;

    const href = $(element).attr('href');
    if (!href || href === '/trending' || href === '/hot') return;
    if (seen.has(href)) return;

    const text = cleanText($(element).text());
    if (!/1H/i.test(text) || !/Change/i.test(text)) return;

    const title = cleanText($(element).find('h3, h2').first().text()) || cleanText(text.split('1H')[0]);
    const desc = cleanText($(element).find('p').first().text());
    if (!title) return;

    const { name, category } = splitNameCategory(title);
    const hourlyMatch = text.match(/1H[^0-9]*([0-9][0-9.,KMB]*)/i);
    const changeMatch = text.match(/Change[^+\-0-9]*([+\-]?[0-9][0-9.,KMB]*)/i);

    seen.add(href);
    items.push({
      owner: 'skills',
      repoName: name,
      repoUrl: toAbsoluteSkillsUrl(href),
      sourceUrl,
      language: category,
      descriptionEn: desc,
      starsToday: compactNumber(hourlyMatch?.[1] ?? '0'),
      starsTotal: 0,
      tags: ['skills.sh', 'hot', `change:${compactNumber(changeMatch?.[1] ?? '0')}`],
    });
  });

  if (items.length >= limit) return items.slice(0, limit);
  return fallbackParse(html, sourceUrl, limit, 'hot');
}
