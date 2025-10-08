export async function fetchPublicImages(_folder?: string): Promise<string[]> {
  try {
    const url = _folder
      ? `/api/images?dir=${encodeURIComponent(_folder)}`
      : `/api/images`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.images) ? json.images : [];
  } catch {
    return [];
  }
}
