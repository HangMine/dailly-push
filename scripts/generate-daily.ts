import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SECTION_CONFIG } from '../src/lib/daily/constants';
import { buildIssue } from './lib/build-issue';
import { fetchGitHubMetadata } from './lib/github-api';
import { fetchHtml } from './lib/http';
import { enrichRepo } from './lib/llm';
import { parseSectionItems } from './lib/multi-source';
import { DEFAULT_COLLECTION } from './lib/collections';
import type { RepoEnrichment, RepoMetadata, ScrapedRepo, ScrapedSection } from './lib/types';
import { getShanghaiDateString, parseDateArg, repoKey } from './lib/utils';

async function writeOutputs(date: string, content: string, rawText: string) {
  const jsonPath = resolve('src/content/daily', `${date}.json`);
  const textPath = resolve('generated', `${date}.txt`);

  await mkdir(dirname(jsonPath), { recursive: true });
  await mkdir(dirname(textPath), { recursive: true });

  await writeFile(jsonPath, content, 'utf8');
  await writeFile(textPath, rawText, 'utf8');
}

async function fetchSection(config: (typeof SECTION_CONFIG)[number]): Promise<ScrapedSection> {
  const html = await fetchHtml(config.sourceUrl);
  const items = parseSectionItems(config, html);

  if (items.length < config.limit) {
    console.warn(
      `[warn] ${config.title} source returned ${items.length} items, below requested ${config.limit}. Generating with available items.`,
    );
  }

  return {
    id: config.id,
    title: config.title,
    sourceUrl: config.sourceUrl,
    items,
  };
}

function collectUniqueRepos(sections: ScrapedSection[]): ScrapedRepo[] {
  const repoMap = new Map<string, ScrapedRepo>();

  for (const section of sections) {
    for (const item of section.items) {
      const key = repoKey(item);
      const existing = repoMap.get(key);

      if (!existing) {
        repoMap.set(key, { ...item });
        continue;
      }

      existing.descriptionEn = existing.descriptionEn || item.descriptionEn;
      existing.language = existing.language === 'Unknown' ? item.language : existing.language;
      existing.starsTotal = Math.max(existing.starsTotal ?? 0, item.starsTotal ?? 0) || existing.starsTotal;
      existing.tags = Array.from(new Set([...existing.tags, ...item.tags]));
    }
  }

  return [...repoMap.values()];
}

async function main() {
  const date = parseDateArg(process.argv.slice(2)) ?? getShanghaiDateString();

  const sections = await Promise.all(DEFAULT_COLLECTION.sections.map(fetchSection));
  const uniqueRepos = collectUniqueRepos(sections);

  const metadataMap = new Map<string, RepoMetadata | null>();
  for (const repo of uniqueRepos) {
    const metadata = await fetchGitHubMetadata(repo.owner, repo.repoName);
    metadataMap.set(repoKey(repo), metadata);
  }

  const enrichmentMap = new Map<string, RepoEnrichment>();
  for (const repo of uniqueRepos) {
    const metadata = metadataMap.get(repoKey(repo)) ?? null;
    const enrichment = await enrichRepo(repo, metadata);
    enrichmentMap.set(repoKey(repo), enrichment);
  }

  const issue = buildIssue({
    date,
    sections,
    enrichments: enrichmentMap,
    metadata: metadataMap,
  });

  await writeOutputs(date, `${JSON.stringify(issue, null, 2)}\n`, `${issue.rawText}\n`);
  console.log(`Generated ${date} issue: src/content/daily/${date}.json`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
