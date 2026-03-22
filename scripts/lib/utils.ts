import type { ScrapedRepo } from './types';

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function parseLooseNumber(value: string): number {
  const normalized = value.replace(/,/g, '').trim().toLowerCase();
  const match = normalized.match(/^([\d.]+)([km])?$/);

  if (!match) {
    throw new Error(`Unable to parse number: ${value}`);
  }

  const amount = Number(match[1]);
  const suffix = match[2];

  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid number: ${value}`);
  }

  if (suffix === 'k') {
    return Math.round(amount * 1000);
  }

  if (suffix === 'm') {
    return Math.round(amount * 1_000_000);
  }

  return Math.round(amount);
}

export function parseDateArg(args: string[]): string | undefined {
  const dateFlagIndex = args.indexOf('--date');
  if (dateFlagIndex === -1) {
    return undefined;
  }

  const value = args[dateFlagIndex + 1];
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Please pass date as --date YYYY-MM-DD.');
  }

  return value;
}

export function getShanghaiDateString(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(new Date());
}

export function repoKey(repo: Pick<ScrapedRepo, 'owner' | 'repoName'>): string {
  return `${repo.owner}/${repo.repoName}`.toLowerCase();
}

export function extractOwnerRepo(repoUrl: string): { owner: string; repoName: string } {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!match) {
    throw new Error(`Unable to parse GitHub repo from URL: ${repoUrl}`);
  }

  return {
    owner: match[1],
    repoName: match[2],
  };
}

export function stripMarkdownFences(value: string): string {
  return value.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
}

export function extractFirstJsonObject(value: string): string {
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in LLM response.');
  }

  return value.slice(start, end + 1);
}

export function ensureExactCount<T>(
  items: T[],
  expected: number,
  label: string,
  options?: { allowShort?: boolean; minimum?: number },
): T[] {
  const minimum = options?.minimum ?? expected;

  if (items.length < minimum) {
    throw new Error(`${label} returned only ${items.length} items, below minimum ${minimum}.`);
  }

  if (items.length < expected) {
    if (options?.allowShort) {
      return items;
    }

    throw new Error(`${label} returned only ${items.length} items, expected ${expected}.`);
  }

  return items.slice(0, expected);
}
