import 'server-only';

/**
 * MariaDB / MySQL "duplicate key value" error code. mysql2 surfaces this as
 * `err.errno === 1062` and `err.code === 'ER_DUP_ENTRY'`. Either check is
 * sufficient; we test both for robustness across driver versions.
 *
 * Used to convert the generic DB error from a `UNIQUE` constraint into a
 * domain-specific `*SlugTakenError` so the action layer can return
 * `fieldErrors.slug` instead of a generic "บันทึกไม่สำเร็จ" message — important
 * when the pre-check `assertSlugAvailable` race-loses to a concurrent insert.
 */
export function isDuplicateKeyError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { errno?: number; code?: string };
  return e.errno === 1062 || e.code === 'ER_DUP_ENTRY';
}
