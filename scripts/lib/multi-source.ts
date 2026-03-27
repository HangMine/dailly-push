import type { SectionId } from '../../src/lib/daily/schema';
import type { ScrapedRepo } from './types';
import { parseBestOfJs } from './bestofjs';
import { parseGitHubTrending } from './github-trending';
import { parseSkillsHot, parseSkillsTrending } from './skills';

export type DailySourceKind = 'github-trending' | 'bestofjs' | 'skills-trending' | 'skills-hot';

export interface DailySectionConfig {
  id: SectionId;
  title: string;
  limit: number;
  sourceLabel: string;
  sourceUrl: string;
  sourceKind: DailySourceKind;
}

export function parseSectionItems(config: DailySectionConfig, html: string): ScrapedRepo[] {
  switch (config.sourceKind) {
    case 'github-trending':
      return parseGitHubTrending(html, config.sourceUrl, config.limit, { allowShort: true });
    case 'bestofjs':
      return parseBestOfJs(html, config.sourceUrl, config.limit);
    case 'skills-trending':
      return parseSkillsTrending(html, config.sourceUrl, config.limit);
    case 'skills-hot':
      return parseSkillsHot(html, config.sourceUrl, config.limit);
    default: {
      const neverReached: never = config.sourceKind;
      throw new Error(`Unsupported source kind: ${String(neverReached)}`);
    }
  }
}
