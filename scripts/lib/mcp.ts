import { load } from 'cheerio';
import type { ScrapedRepo } from './types';

function cleanText(value: string | undefined | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function toAbsoluteUrl(href: string | undefined, base = 'https://mcpmarket.com'): string {
  if (!href) return base;
  if (/^https?:\/\//i.test(href)) return href;
  return `${base}${href.startsWith('/') ? href : `/${href}`}`;
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

function parseEmbeddedDailyData(html: string): ScrapedRepo[] {
  const jsonMatches = [...html.matchAll(/\{[^{}]*"rank"\s*:\s*\d+[\s\S]*?\}/g)];
  const items: ScrapedRepo[] = [];

  for (const match of jsonMatches) {
    const raw = match[0];
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const repoName = cleanText(String(parsed.name ?? parsed.title ?? parsed.serverName ?? ''));
      const repoUrl = cleanText(String(parsed.url ?? parsed.link ?? parsed.website ?? parsed.slug ?? ''));
      const description = cleanText(String(parsed.description ?? parsed.summary ?? parsed.intro ?? ''));
      const category = cleanText(String(parsed.category ?? parsed.type ?? 'MCP Server')) || 'MCP Server';
      const installs = compactNumber(String(parsed.installs ?? parsed.downloads ?? parsed.dailyUses ?? parsed.score ?? '0'));
      const total = compactNumber(String(parsed.stars ?? parsed.totalInstalls ?? parsed.upvotes ?? parsed.views ?? '0'));
      if (!repoName || !repoUrl) continue;

      items.push({
        owner: 'mcp',
        repoName,
        repoUrl: toAbsoluteUrl(repoUrl),
        sourceUrl: 'https://mcpmarket.com',
        language: category,
        descriptionEn: description || `Category: ${category}`,
        starsToday: installs,
        starsTotal: total,
        tags: ['mcpmarket', 'mcp'],
      });
    } catch {
      // ignore non-JSON blobs
    }
  }

  return items;
}

export function parseMcpMarketDaily(html: string, sourceUrl: string, limit: number): ScrapedRepo[] {
  const embedded = parseEmbeddedDailyData(html);
  if (embedded.length > 0) {
    return embedded.slice(0, limit).map((item) => ({ ...item, sourceUrl }));
  }

  const $ = load(html);
  const items: ScrapedRepo[] = [];

  $('a[href*="/server/"]').each((_, element) => {
    if (items.length >= limit) return false;

    const anchor = $(element);
    const href = anchor.attr('href');
    if (!href) return;

    const rankText = cleanText(anchor.find(':contains("#")').first().text()) || cleanText(anchor.text());
    const rank = Number(rankText.match(/#(\d{1,2})/)?.[1] ?? '0');
    if (!rank) return;

    const name = cleanText(anchor.find('h3').first().text());
    if (!name) return;

    const imgAlt = cleanText(anchor.find('img[alt]').first().attr('alt'));
    const owner = imgAlt || 'mcp';
    const description = cleanText(anchor.find('p').first().text());

    const tailNodes = anchor
      .find('*')
      .toArray()
      .map((node) => cleanText($(node).text()))
      .filter(Boolean);

    const category = tailNodes.find((text) => !text.startsWith('#') && text !== name && text !== description && !/^\d+$/.test(text)) || 'MCP Server';
    const numericText = tailNodes.find((text) => /^\d+[\d,]*$/.test(text));

    items.push({
      owner: 'mcp',
      repoName: name,
      repoUrl: toAbsoluteUrl(href),
      sourceUrl,
      language: category,
      descriptionEn: description || `Category: ${category}`,
      starsToday: compactNumber(numericText ?? '0'),
      starsTotal: 0,
      tags: ['mcpmarket', 'mcp', `publisher:${owner}`, `rank:${rank}`],
    });
  });

  return items
    .sort((left, right) => {
      const leftRank = Number(left.tags.find((tag) => tag.startsWith('rank:'))?.slice(5) ?? '999');
      const rightRank = Number(right.tags.find((tag) => tag.startsWith('rank:'))?.slice(5) ?? '999');
      return leftRank - rightRank;
    })
    .slice(0, limit);
}
