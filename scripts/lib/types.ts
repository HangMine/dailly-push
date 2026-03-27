import type { DailySectionConfig } from './multi-source';
import type { SectionId } from '../../src/lib/daily/schema';

export interface ScrapedRepo {
  owner: string;
  repoName: string;
  repoUrl: string;
  sourceUrl: string;
  language: string;
  descriptionEn: string;
  starsToday: number;
  starsTotal: number | null;
  tags: string[];
}

export interface ScrapedSection {
  id: SectionId;
  title: string;
  sourceUrl: string;
  items: ScrapedRepo[];
}

export interface IssueCollection {
  id: string;
  title: string;
  sections: DailySectionConfig[];
}

export interface RepoMetadata {
  description?: string;
  homepage?: string;
  language?: string;
  starsTotal?: number;
  topics?: string[];
}

export interface RepoEnrichment {
  category: string;
  summaryZh: string;
  reasons: [string, string, string];
}
