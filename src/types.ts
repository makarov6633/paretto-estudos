export type ID = string;

// Align Item shape with DB/API responses and ItemCard expectations
export interface Item {
  id: ID;
  slug: string;
  title: string;
  author: string;
  coverImageUrl?: string | null;
  hasAudio: boolean;
  hasPdf: boolean;
  readingMinutes?: number | null;
  audioMinutes?: number | null;
  tags?: string[] | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  hasSync?: boolean; // optional: true if sync_map exists for this item
}

export interface Section {
  id: ID;
  itemId: ID;
  orderIndex: number;
  heading?: string | null;
  contentHtml?: string | null;
}

export interface Track {
  id?: ID;
  itemId?: ID;
  audioUrl: string;
  durationMs?: number | null;
  language?: string | null;
  voice?: string | null;
}

export interface SyncMap {
  id?: ID;
  itemId?: ID;
  granularity?: "line" | "word";
  data?: unknown;
}

export interface Recommendation {
  itemId: ID;
  reason: string;
}

export interface UserPreference {
  userId: ID;
  tags: string[];
  allowAudio?: boolean;
}

export type Sort<T> = Partial<Record<keyof T, "asc" | "desc">>;

export type SearchParams = Readonly<
  Record<string, string | string[] | undefined>
>;

export interface TelemetryEvent {
  userId: ID;
  name: string;
  ts: string; // ISO
  props?: Record<string, unknown>;
}
