import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { dailyIssueSchema } from '@/lib/daily/schema';

const daily = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/content/daily',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: dailyIssueSchema,
});

export const collections = { daily };
