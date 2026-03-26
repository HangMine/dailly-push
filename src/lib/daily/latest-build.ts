export interface LatestBuildMeta {
  status: string;
  builtAt: string;
  commit: string;
}

const fallback = (value: string | undefined, fallbackValue = 'unknown') => value?.trim() || fallbackValue;

export function getLatestBuildMeta(): LatestBuildMeta {
  return {
    status: fallback(import.meta.env.PUBLIC_LATEST_BUILD_STATUS),
    builtAt: fallback(import.meta.env.PUBLIC_LATEST_BUILD_AT),
    commit: fallback(import.meta.env.PUBLIC_LATEST_BUILD_COMMIT),
  };
}
