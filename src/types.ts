export type ID = string;

// Align Item shape with DB/API responses and ItemCard expectations
export interface Item {
  id: ID;
  slug: string;
  title: string;
  author: string;
  coverImageUrl?: string | null;
  hasPdf: boolean;
  readingMinutes?: number | null;
  tags?: string[] | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Section {
  id: ID;
  itemId: ID;
  orderIndex: number;
  heading?: string | null;
  contentHtml?: string | null;
}

export interface Recommendation {
  itemId: ID;
  reason: string;
}

export interface UserPreference {
  userId: ID;
  tags: string[];
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
