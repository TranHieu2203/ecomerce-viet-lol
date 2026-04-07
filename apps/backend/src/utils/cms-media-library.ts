/**
 * Merge DB-ordered CMS file ids with session "recent upload" ids (FR-35).
 * DB list first (newest reference first), then session ids not already present, preserving session order.
 */
export function mergeMediaLibraryIdOrder(
  dbOrderedIds: string[],
  sessionOrderedIds: string[]
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of dbOrderedIds) {
    const t = id?.trim()
    if (!t || seen.has(t)) {
      continue
    }
    seen.add(t)
    out.push(t)
  }
  for (const id of sessionOrderedIds) {
    const t = id?.trim()
    if (!t || seen.has(t)) {
      continue
    }
    seen.add(t)
    out.push(t)
  }
  return out
}

/** Parse `session_ids` query: comma-separated, trimmed, non-empty. */
export function parseSessionIdsQuery(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return []
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
