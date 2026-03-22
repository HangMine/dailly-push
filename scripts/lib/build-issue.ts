import { dailyIssueSchema, type DailyIssue, type RankingItem } from '../../src/lib/daily/schema';
import { SECTION_CONFIG, SOURCE_LINKS } from '../../src/lib/daily/constants';
import { formatIssueTitle, formatQqMessage } from '../../src/lib/daily/formatters';
import type { RepoEnrichment, RepoMetadata, ScrapedSection } from './types';
import { repoKey } from './utils';

interface BuildIssueOptions {
  date: string;
  sections: ScrapedSection[];
  enrichments: Map<string, RepoEnrichment>;
  metadata: Map<string, RepoMetadata | null>;
}

function resolveItem(
  item: ScrapedSection['items'][number],
  rank: number,
  enrichments: Map<string, RepoEnrichment>,
  metadataMap: Map<string, RepoMetadata | null>,
): RankingItem {
  const key = repoKey(item);
  const enrichment = enrichments.get(key);
  const metadata = metadataMap.get(key);

  if (!enrichment) {
    throw new Error(`缺少仓库增强结果: ${item.owner}/${item.repoName}`);
  }

  const starsTotal = metadata?.starsTotal ?? item.starsTotal;
  if (starsTotal == null) {
    throw new Error(`缺少总 Star 数据: ${item.owner}/${item.repoName}`);
  }

  return {
    rank,
    repoName: item.repoName,
    owner: item.owner,
    language: metadata?.language || item.language,
    category: enrichment.category,
    summaryZh: enrichment.summaryZh,
    starsToday: item.starsToday,
    starsTotal,
    reasons: enrichment.reasons,
    repoUrl: item.repoUrl,
    sourceUrl: item.sourceUrl,
  };
}

export function buildIssue({ date, sections, enrichments, metadata }: BuildIssueOptions): DailyIssue {
  const normalizedSections = SECTION_CONFIG.map((config) => {
    const section = sections.find((item) => item.id === config.id);
    if (!section) {
      throw new Error(`缺少分榜: ${config.id}`);
    }

    return {
      id: config.id,
      title: config.title,
      items: section.items.map((item, index) => resolveItem(item, index + 1, enrichments, metadata)),
    };
  });

  const issue: DailyIssue = {
    date,
    slug: date,
    title: formatIssueTitle(date),
    rawText: '',
    sections: normalizedSections,
    sources: SOURCE_LINKS,
    generatedAt: new Date().toISOString(),
  };

  issue.rawText = formatQqMessage(issue);
  return dailyIssueSchema.parse(issue);
}
