import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ScrapedRepo } from './types';

interface McpCacheShape {
  date: string;
  sourceUrl: string;
  items: ScrapedRepo[];
}

function getCachePath(date: string): string {
  return resolve('generated', 'cache', 'mcp', `${date}.json`);
}

export async function readMcpCache(date: string): Promise<ScrapedRepo[] | null> {
  try {
    const raw = await readFile(getCachePath(date), 'utf8');
    const parsed = JSON.parse(raw) as McpCacheShape;
    return parsed.items ?? null;
  } catch {
    return null;
  }
}
