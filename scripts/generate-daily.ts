import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SECTION_CONFIG } from '../src/lib/daily/constants';
import { buildIssue } from './lib/build-issue';
import { fetchGitHubMetadata } from './lib/github-api';
import { fetchHtml } from './lib/http';
import { buildFallbackEnrichment, enrichRepo } from './lib/llm';
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

const ENRICH_BATCH_SIZE = 4;

async function runInBatches<T>(items: T[], batchSize: number, worker: (item: T) => Promise<void>) {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    await Promise.all(batch.map((item) => worker(item)));
  }
}

async function main() {
  const date = parseDateArg(process.argv.slice(2)) ?? getShanghaiDateString();
  console.log(`[step] generate start: ${date}`);

  console.log('[step] fetching sections...');
  const sections = await Promise.all(DEFAULT_COLLECTION.sections.map(fetchSection));
  console.log(`[step] fetched sections: ${sections.map((section) => `${section.id}=${section.items.length}`).join(', ')}`);

  const uniqueRepos = collectUniqueRepos(sections);
  console.log(`[step] unique repos: ${uniqueRepos.length}`);

  const metadataMap = new Map<string, RepoMetadata | null>();
  for (const repo of uniqueRepos) {
    console.log(`[step] metadata start: ${repo.owner}/${repo.repoName}`);
    const metadata = await fetchGitHubMetadata(repo.owner, repo.repoName);
    metadataMap.set(repoKey(repo), metadata);
    console.log(`[step] metadata done: ${repo.owner}/${repo.repoName}`);
  }

  const enrichmentMap = new Map<string, RepoEnrichment>();
  await runInBatches(uniqueRepos, ENRICH_BATCH_SIZE, async (repo) => {
    const metadata = metadataMap.get(repoKey(repo)) ?? null;
    console.log(`[step] enrich start: ${repo.owner}/${repo.repoName}`);
    try {
      const enrichment = await enrichRepo(repo, metadata);
      enrichmentMap.set(repoKey(repo), enrichment);
      console.log(`[step] enrich done: ${repo.owner}/${repo.repoName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[warn] enrich fallback: ${repo.owner}/${repo.repoName} :: ${message}`);
      enrichmentMap.set(repoKey(repo), buildFallbackEnrichment(repo, metadata));
    }
  });

  console.log('[step] building issue...');
  const issue = buildIssue({
    date,
    sections,
    enrichments: enrichmentMap,
    metadata: metadataMap,
  });

  await writeOutputs(date, `${JSON.stringify(issue, null, 2)}\n`, `${issue.rawText}\n`);
  console.log(`[step] wrote outputs for ${date}`);
  console.log(`Generated ${date} issue: src/content/daily/${date}.json`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
