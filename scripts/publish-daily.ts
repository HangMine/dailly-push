import { execFileSync, spawnSync } from 'node:child_process';
import { getShanghaiDateString, parseDateArg } from './lib/utils';

interface PublishOptions {
  date?: string;
  skipPush: boolean;
}

const PNPM_COMMAND = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function run(command: string, args: string[], options?: { capture?: boolean }): string {
  if (options?.capture) {
    return execFileSync(command, args, {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: process.env,
    }).trim();
  }

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(' ')} (exit=${result.status ?? 'null'}, signal=${result.signal ?? 'none'})`,
    );
  }

  return '';
}

function parseOptions(args: string[]): PublishOptions {
  return {
    date: parseDateArg(args),
    skipPush: args.includes('--skip-push'),
  };
}

function ensureCleanWorktree(options?: { allowPaths?: string[] }) {
  const status = run('git', ['status', '--porcelain'], { capture: true });
  if (!status) {
    return;
  }

  const allowPaths = new Set(options?.allowPaths ?? []);
  const blockingLines = status
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .filter((line) => {
      const path = line.slice(3).trim();
      return !allowPaths.has(path);
    });

  if (blockingLines.length === 0) {
    return;
  }

  throw new Error(
    [
      'Working tree is not clean. Please commit, stash, or discard existing changes before running publish:daily.',
      'Current git status:',
      blockingLines.join('\n'),
    ].join('\n'),
  );
}

function ensureMainBranch() {
  const branch = run('git', ['branch', '--show-current'], { capture: true });
  if (branch === 'main') {
    return;
  }

  throw new Error(`publish:daily must run on main. Current branch: ${branch || '(detached HEAD)'}.`);
}

function getTrackedDailyChanges(): string[] {
  const status = run('git', ['status', '--porcelain', '--', 'src/content/daily'], { capture: true });
  if (!status) {
    return [];
  }

  return status
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function commitChanges(date: string) {
  run('git', ['add', 'src/content/daily']);
  run('git', ['commit', '-m', `chore: publish daily issue ${date}`]);
}

function main() {
  const args = process.argv.slice(2);
  const options = parseOptions(args);
  const publishDate = options.date ?? getShanghaiDateString();
  const allowedGeneratedPaths = [
    `src/content/daily/${publishDate}.json`,
    `generated/${publishDate}.txt`,
  ];

  ensureCleanWorktree({ allowPaths: allowedGeneratedPaths });
  ensureMainBranch();

  run('git', ['pull', '--rebase', 'origin', 'main']);

  const generateArgs = ['generate:daily'];
  if (options.date) {
    generateArgs.push('--date', options.date);
  }

  run(PNPM_COMMAND, generateArgs);
  run(PNPM_COMMAND, ['build']);

  const changedFiles = getTrackedDailyChanges();
  if (changedFiles.length === 0) {
    console.log(`No publishable content changes for ${publishDate}.`);
    return;
  }

  commitChanges(publishDate);

  if (options.skipPush) {
    console.log(`Committed daily issue ${publishDate}. Skipped push because --skip-push was provided.`);
    return;
  }

  run('git', ['push', 'origin', 'main']);
  console.log(`Published daily issue ${publishDate} to origin/main.`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
