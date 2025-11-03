import { EnvKey, EnvUtil } from "./env-util";

export function makeErrorPageUrlHelper(code: string, message?: string, detail?: string): URL {
  const url = new URL(EnvUtil.get(EnvKey.ERROR_PAGE));
  url.searchParams.append('code', code);
  if (message) {
    url.searchParams.append('message', message);
  }
  if (detail) {
    url.searchParams.append('detail', detail);
  }

  return url;
}
