import { z } from 'zod';

export const sectionIdSchema = z.enum(['overall', 'typescript', 'vue', 'react', 'skills-trending', 'skills-hot', 'mcp']);

export const sourceLinkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});

export const rankingItemSchema = z.object({
  rank: z.number().int().positive(),
  repoName: z.string().min(1),
  owner: z.string().min(1),
  language: z.string().min(1),
  category: z.string().min(1),
  summaryZh: z.string().min(1),
  starsToday: z.number().int().nonnegative(),
  starsTotal: z.number().int().nonnegative(),
  reasons: z.array(z.string().min(1)).length(3),
  repoUrl: z.url(),
  sourceUrl: z.url(),
});

export const rankingSectionSchema = z.object({
  id: sectionIdSchema,
  title: z.string().min(1),
  items: z.array(rankingItemSchema),
});

export const dailyIssueSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slug: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  rawText: z.string().min(1),
  sections: z.array(rankingSectionSchema).min(5),
  sources: z.array(sourceLinkSchema).min(5),
  generatedAt: z.string().min(1),
});

export type SectionId = z.infer<typeof sectionIdSchema>;
export type SourceLink = z.infer<typeof sourceLinkSchema>;
export type RankingItem = z.infer<typeof rankingItemSchema>;
export type RankingSection = z.infer<typeof rankingSectionSchema>;
export type DailyIssue = z.infer<typeof dailyIssueSchema>;
