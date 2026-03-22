import { getCollection, type CollectionEntry } from 'astro:content';

export type DailyIssueEntry = CollectionEntry<'daily'>;

export async function getDailyIssues(): Promise<DailyIssueEntry[]> {
  const entries = await getCollection('daily');
  return entries.sort((left, right) => right.data.date.localeCompare(left.data.date));
}

export async function getLatestIssue(): Promise<DailyIssueEntry | undefined> {
  const entries = await getDailyIssues();
  return entries[0];
}

export function countRepos(entry: DailyIssueEntry): number {
  return entry.data.sections.reduce((total, section) => total + section.items.length, 0);
}

export function countUniqueRepos(entry: DailyIssueEntry): number {
  const repoKeys = new Set(
    entry.data.sections.flatMap((section) => section.items.map((item) => `${item.owner}/${item.repoName}`)),
  );

  return repoKeys.size;
}
