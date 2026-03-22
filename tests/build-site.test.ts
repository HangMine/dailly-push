import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('site build', () => {
  it('builds successfully with GitHub Pages base path', () => {
    const command = process.platform === 'win32' ? 'pnpm.cmd build' : 'pnpm build';
    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    expect(output).toContain('Complete!');
  }, 120_000);
});
