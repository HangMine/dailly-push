import { access, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import dotenv from 'dotenv';

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ParsedToml {
  root: Record<string, string>;
  sections: Record<string, Record<string, string>>;
}

interface ResolveLlmConfigOptions {
  codexDir?: string;
  cwd?: string;
}

let cachedLlmConfigPromise: Promise<LlmConfig> | undefined;

function parseTomlValue(raw: string): string {
  const value = raw.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseToml(text: string): ParsedToml {
  const root: Record<string, string> = {};
  const sections: Record<string, Record<string, string>> = {};
  let currentSection: string | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      sections[currentSection] ??= {};
      continue;
    }

    const entryMatch = rawLine.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*(.+?)\s*$/);
    if (!entryMatch) {
      continue;
    }

    const [, key, value] = entryMatch;
    const target = currentSection ? sections[currentSection] : root;
    target[key] = parseTomlValue(value);
  }

  return { root, sections };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readCodexConfig(codexDir: string): Promise<Partial<LlmConfig>> {
  const configPath = join(codexDir, 'config.toml');
  const authPath = join(codexDir, 'auth.json');
  const result: Partial<LlmConfig> = {};

  if (await exists(configPath)) {
    const configText = await readFile(configPath, 'utf8');
    const parsed = parseToml(configText);
    const providerName = parsed.root.model_provider;

    if (parsed.root.model) {
      result.model = parsed.root.model;
    }

    if (providerName) {
      const providerSection = parsed.sections[`model_providers.${providerName}`];
      if (providerSection?.base_url) {
        result.baseUrl = providerSection.base_url;
      }
    }
  }

  if (await exists(authPath)) {
    const auth = JSON.parse(await readFile(authPath, 'utf8')) as Record<string, unknown>;
    const apiKey = auth.OPENAI_API_KEY;
    if (typeof apiKey === 'string' && apiKey.trim()) {
      result.apiKey = apiKey.trim();
    }
  }

  return result;
}

function applyDotenvFallback(cwd: string, current: Partial<LlmConfig>): Partial<LlmConfig> {
  const envPath = resolve(cwd, '.env');
  const loaded = dotenv.config({ path: envPath });
  const envValues = loaded.parsed ?? {};

  return {
    apiKey: current.apiKey ?? envValues.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
    baseUrl: current.baseUrl ?? envValues.OPENAI_BASE_URL ?? process.env.OPENAI_BASE_URL,
    model: current.model ?? envValues.OPENAI_MODEL ?? process.env.OPENAI_MODEL,
  };
}

export async function resolveLlmConfig(
  options: ResolveLlmConfigOptions = {},
): Promise<LlmConfig> {
  const cwd = options.cwd ?? process.cwd();
  const codexDir = options.codexDir ?? join(homedir(), '.codex');

  const codexConfig = await readCodexConfig(codexDir);
  const merged = applyDotenvFallback(cwd, codexConfig);
  const missing: string[] = [];

  if (!merged.baseUrl) {
    missing.push('OPENAI_BASE_URL');
  }

  if (!merged.apiKey) {
    missing.push('OPENAI_API_KEY');
  }

  if (!merged.model) {
    missing.push('OPENAI_MODEL');
  }

  if (missing.length) {
    const configPath = join(codexDir, 'config.toml');
    const authPath = join(codexDir, 'auth.json');
    const envPath = resolve(cwd, '.env');
    throw new Error(
      `Missing LLM config: ${missing.join(', ')}. Checked ${configPath}, ${authPath}, and ${envPath}.`,
    );
  }

  const apiKey = merged.apiKey as string;
  const baseUrl = merged.baseUrl as string;
  const model = merged.model as string;

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model,
  };
}

export async function getLlmConfig(): Promise<LlmConfig> {
  cachedLlmConfigPromise ??= resolveLlmConfig();
  return cachedLlmConfigPromise;
}

export function resetLlmConfigCache() {
  cachedLlmConfigPromise = undefined;
}
