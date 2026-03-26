import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface LatestBuildMeta {
  status: string;
  builtAt: string;
  commit: string;
}

const FALLBACK_META: LatestBuildMeta = {
  status: 'unknown',
  builtAt: 'unknown',
  commit: 'unknown',
};

export function getLatestBuildMeta(): LatestBuildMeta {
  const filePath = resolve(process.cwd(), 'generated', 'latest-build.json');

  if (!existsSync(filePath)) {
    return FALLBACK_META;
  }

  try {
    const raw = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LatestBuildMeta>;

    return {
      status: parsed.status ?? FALLBACK_META.status,
      builtAt: parsed.builtAt ?? FALLBACK_META.builtAt,
      commit: parsed.commit ?? FALLBACK_META.commit,
    };
  } catch {
    return FALLBACK_META;
  }
}
