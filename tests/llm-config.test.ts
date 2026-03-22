import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resetLlmConfigCache, resolveLlmConfig } from '../scripts/lib/llm-config';

const originalEnv = {
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
};

function restoreEnv() {
  process.env.OPENAI_BASE_URL = originalEnv.OPENAI_BASE_URL;
  process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
  process.env.OPENAI_MODEL = originalEnv.OPENAI_MODEL;
}

function makeWorkspace() {
  const root = mkdtempSync(join(tmpdir(), 'dailly-push-llm-'));
  const codexDir = join(root, '.codex');
  const cwd = join(root, 'project');

  mkdirSync(codexDir, { recursive: true });
  mkdirSync(cwd, { recursive: true });

  return { root, codexDir, cwd };
}

afterEach(() => {
  restoreEnv();
  resetLlmConfigCache();
});

describe('resolveLlmConfig', () => {
  it('prefers .codex over .env', async () => {
    const { root, codexDir, cwd } = makeWorkspace();

    try {
      delete process.env.OPENAI_BASE_URL;
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;

      writeFileSync(
        join(codexDir, 'config.toml'),
        [
          'model_provider = "custom"',
          'model = "gpt-5.4"',
          '',
          '[model_providers.custom]',
          'base_url = "http://127.0.0.1:8317/v1"',
          '',
        ].join('\n'),
      );
      writeFileSync(join(codexDir, 'auth.json'), JSON.stringify({ OPENAI_API_KEY: 'codex-key' }));
      writeFileSync(
        join(cwd, '.env'),
        [
          'OPENAI_BASE_URL=https://env.example/v1',
          'OPENAI_API_KEY=env-key',
          'OPENAI_MODEL=env-model',
          '',
        ].join('\n'),
      );

      const config = await resolveLlmConfig({ codexDir, cwd });

      expect(config).toEqual({
        baseUrl: 'http://127.0.0.1:8317/v1',
        apiKey: 'codex-key',
        model: 'gpt-5.4',
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('falls back to .env for missing .codex values', async () => {
    const { root, codexDir, cwd } = makeWorkspace();

    try {
      process.env.OPENAI_API_KEY = 'shell-key';
      process.env.OPENAI_MODEL = 'shell-model';

      writeFileSync(
        join(codexDir, 'config.toml'),
        [
          'model_provider = "custom"',
          '',
          '[model_providers.custom]',
          'base_url = "http://127.0.0.1:8317/v1"',
          '',
        ].join('\n'),
      );
      writeFileSync(join(codexDir, 'auth.json'), JSON.stringify({}));
      writeFileSync(
        join(cwd, '.env'),
        [
          'OPENAI_API_KEY=env-key',
          'OPENAI_MODEL=gpt-4.1-mini',
          '',
        ].join('\n'),
      );

      const config = await resolveLlmConfig({ codexDir, cwd });

      expect(config).toEqual({
        baseUrl: 'http://127.0.0.1:8317/v1',
        apiKey: 'env-key',
        model: 'gpt-4.1-mini',
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
