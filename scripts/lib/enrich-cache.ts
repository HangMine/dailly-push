import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { RepoEnrichment } from './types';
import { repoKey } from './utils';

interface CacheShape {
  items?: Record<string, RepoEnrichment>;
}

function getCachePath(date: string): string {
  return resolve('generated', 'cache', 'enrich', `${date}.json`);
}

export async function readEnrichCache(date: string): Promise<Map<string, RepoEnrichment>> {
  const path = getCachePath(date);
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as CacheShape;
    return new Map(Object.entries(parsed.items ?? {}));
  } catch {
    return new Map();
  }
}

export async function writeEnrichCache(date: string, cache: Map<string, RepoEnrichment>): Promise<void> {
  const path = getCachePath(date);
  await mkdir(dirname(path), { recursive: true });
  const payload: CacheShape = {
    items: Object.fromEntries(cache.entries()),
  };
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export function getCachedEnrichment(cache: Map<string, RepoEnrichment>, repo: { owner: string; repoName: string }) {
  return cache.get(repoKey(repo));
}

export function setCachedEnrichment(
  cache: Map<string, RepoEnrichment>,
  repo: { owner: string; repoName: string },
  enrichment: RepoEnrichment,
) {
  cache.set(repoKey(repo), enrichment);
}
