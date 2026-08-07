/**
 * Environment secret resolution.
 *
 * Every secret used to sign sessions or encrypt stored credentials MUST come
 * from the environment in production. These previously had built-in fallback
 * constants, which meant a deploy that forgot to set them kept working — with a
 * publicly-known signing key (forgeable sessions) and a publicly-known
 * encryption key (decryptable Facebook cookies).
 *
 * Resolution is deliberately lazy: `next build` runs with NODE_ENV=production,
 * and a build machine has no business needing runtime secrets. Callers resolve
 * on first use instead, so a misconfigured deployment fails loudly when it
 * tries to serve a request rather than silently serving one insecurely.
 *
 * Edge-safe: no Node built-ins, so `middleware.ts` can import this too.
 */
export function requireSecret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${name} is not set. Refusing to run in production with an insecure built-in fallback. ` +
        `Set ${name} in the deployment environment.`
    );
  }

  console.warn(`[security] ${name} is not set — using an insecure development-only fallback.`);
  return devFallback;
}

/**
 * Wrap `requireSecret` in a memoised getter so the check happens on first use
 * rather than at module load.
 */
export function lazySecret(name: string, devFallback: string): () => string {
  let cached: string | undefined;
  return () => {
    if (cached === undefined) cached = requireSecret(name, devFallback);
    return cached;
  };
}
