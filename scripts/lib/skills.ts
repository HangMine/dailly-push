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

function parseInitialSkillsJson(html: string): Array<{ source: string; skillId: string; name: string; installs: number; installsYesterday?: number; change?: number }> {
  const match = html.match(/"initialSkills":\s*(\[[\s\S]*?\])\s*,\s*"totalSkills"/);
  if (!match) return [];

  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

function splitNameCategory(value: string): { name: string; category: string } {
  const text = cleanText(value);
  const parts = text.split('｜').map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { name: parts[0], category: parts.slice(1).join(' / ') };
  }
  return { name: text || '-', category: '-' };
}

function makeSkillItem(
  entry: { source: string; skillId: string; name: string; installs: number; installsYesterday?: number; change?: number },
  sourceUrl: string,
  mode: 'trending' | 'hot',
): ScrapedRepo {
  return {
    owner: 'skills',
    repoName: cleanText(entry.name || entry.skillId),
    repoUrl: toAbsoluteSkillsUrl(`/${entry.source}/${entry.skillId}`),
    sourceUrl,
    language: cleanText(entry.source),
    descriptionEn: `Source: ${entry.source}`,
    starsToday: mode === 'trending' ? Number(entry.installs ?? 0) : Number(entry.installs ?? 0),
    starsTotal: mode === 'hot' ? Number(entry.change ?? 0) : Number(entry.installsYesterday ?? 0),
    tags: ['skills.sh', mode],
  };
}

export function parseSkillsTrending(html: string, sourceUrl: string, limit: number): ScrapedRepo[] {
  const entries = parseInitialSkillsJson(html);
  if (entries.length > 0) {
    return entries.slice(0, limit).map((entry) => makeSkillItem(entry, sourceUrl, 'trending'));
  }

  const $ = load(html);
  const items: ScrapedRepo[] = [];
  $('a[href^="/"]').each((_, element) => {
    if (items.length >= limit) return false;
    const href = $(element).attr('href');
    if (!href || href === '/trending' || href === '/hot') return;

    const title = cleanText($(element).find('h3').first().text());
    const sourceText = cleanText($(element).find('p').first().text()) || 'skills.sh';
    const metric = cleanText($(element).find('span.font-mono').first().text()) || cleanText($(element).text().match(/24h\s*([0-9.,KMB]+)/i)?.[1]);
    if (!title || !metric) return;
    const { name, category } = splitNameCategory(title);
    const language = category !== '-' ? category : sourceText;

    items.push({
      owner: 'skills',
      repoName: name,
      repoUrl: toAbsoluteSkillsUrl(href),
      sourceUrl,
      language,
      descriptionEn: `Source: ${sourceText}`,
      starsToday: compactNumber(metric),
      starsTotal: 0,
      tags: ['skills.sh', 'trending'],
    });
  });
  return items.slice(0, limit);
}

export function parseSkillsHot(html: string, sourceUrl: string, limit: number): ScrapedRepo[] {
  const entries = parseInitialSkillsJson(html);
  if (entries.length > 0) {
    return entries.slice(0, limit).map((entry) => makeSkillItem(entry, sourceUrl, 'hot'));
  }

  const $ = load(html);
  const items: ScrapedRepo[] = [];
  $('a[href^="/"]').each((_, element) => {
    if (items.length >= limit) return false;
    const href = $(element).attr('href');
    if (!href || href === '/trending' || href === '/hot') return;

    const title = cleanText($(element).find('h3').first().text());
    const sourceText = cleanText($(element).find('p').first().text()) || 'skills.sh';
    const text = cleanText($(element).text());
    const spans = $(element).find('span.font-mono').toArray().map((node) => cleanText($(node).text())).filter(Boolean);
    const hourly = spans[0] || cleanText(text.match(/1H\s*([0-9.,KMB]+)/i)?.[1]);
    const change = spans[1] || cleanText(text.match(/Change\s*([+\-]?[0-9.,KMB]+)/i)?.[1]);
    if (!title || !hourly) return;
    const { name, category } = splitNameCategory(title);
    const language = category !== '-' ? category : sourceText;

    items.push({
      owner: 'skills',
      repoName: name,
      repoUrl: toAbsoluteSkillsUrl(href),
      sourceUrl,
      language,
      descriptionEn: `Source: ${sourceText}`,
      starsToday: compactNumber(hourly),
      starsTotal: compactNumber(change),
      tags: ['skills.sh', 'hot', `change:${compactNumber(change)}`],
    });
  });
  return items.slice(0, limit);
}
