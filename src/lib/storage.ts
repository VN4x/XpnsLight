const TAGS_KEY = 'xpns_reference_tags';

export function loadReferenceTags(): string[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((t): t is string => typeof t === 'string' && t.trim().length > 0))].sort(
      (a, b) => a.localeCompare(b),
    );
  } catch {
    return [];
  }
}

export function saveReferenceTags(tags: string[]): void {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

export function appendReferenceTag(tag: string, existing: string[]): string[] {
  const trimmed = tag.trim();
  if (!trimmed) return existing;
  if (existing.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    return existing;
  }
  const next = [...existing, trimmed].sort((a, b) => a.localeCompare(b));
  saveReferenceTags(next);
  return next;
}
