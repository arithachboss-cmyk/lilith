/**
 * Shared flag parsing.
 *
 * This exists because the same off-by-one was written twice: with the flag absent,
 * `indexOf` returns -1 and `i !== index + 1` silently drops argv[0] — the target. Both
 * tools then printed their usage line and exited 2 on a perfectly valid call. Parse it
 * in one place so there is only one version of it to get wrong.
 */
export function parseArgs(argv, valueFlags = []) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const values = {};
  const consumed = new Set();

  for (const flag of valueFlags) {
    const i = argv.indexOf(`--${flag}`);
    if (i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) {
      values[flag] = argv[i + 1];
      consumed.add(i + 1);
    }
  }
  const positional = argv.filter((a, i) => !a.startsWith("--") && !consumed.has(i));
  return { flags, values, positional, has: (f) => flags.has(`--${f}`) };
}
