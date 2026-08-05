"use client";

/**
 * Lightweight per-user productivity features backed entirely by localStorage — recently
 * viewed pages, favorites, recent searches, and saved filter presets. No backend needed:
 * this is personal browser-local state, not shared data.
 */

const MAX_RECENT_PAGES = 8;
const MAX_RECENT_SEARCHES = 6;

export interface RecentPage {
  path: string;
  label: string;
  visitedAt: number;
}

export interface FilterPreset {
  name: string;
  filters: Record<string, string>;
}

function storageKey(userId: string, name: string) {
  return `campusflow_${name}_${userId}`;
}

function readList<T>(userId: string, name: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId, name));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(userId: string, name: string, list: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId, name), JSON.stringify(list));
}

export function recordRecentPage(userId: string, path: string, label: string) {
  const list = readList<RecentPage>(userId, "recent_pages").filter((p) => p.path !== path);
  list.unshift({ path, label, visitedAt: Date.now() });
  writeList(userId, "recent_pages", list.slice(0, MAX_RECENT_PAGES));
}

export function getRecentPages(userId: string): RecentPage[] {
  return readList<RecentPage>(userId, "recent_pages");
}

export function toggleFavoritePage(userId: string, path: string, label: string): RecentPage[] {
  const list = readList<RecentPage>(userId, "favorite_pages");
  const exists = list.some((p) => p.path === path);
  const next = exists ? list.filter((p) => p.path !== path) : [...list, { path, label, visitedAt: Date.now() }];
  writeList(userId, "favorite_pages", next);
  return next;
}

export function getFavoritePages(userId: string): RecentPage[] {
  return readList<RecentPage>(userId, "favorite_pages");
}

export function isFavoritePage(userId: string, path: string): boolean {
  return getFavoritePages(userId).some((p) => p.path === path);
}

export function recordRecentSearch(userId: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const list = readList<string>(userId, "recent_searches").filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  list.unshift(trimmed);
  writeList(userId, "recent_searches", list.slice(0, MAX_RECENT_SEARCHES));
}

export function getRecentSearches(userId: string): string[] {
  return readList<string>(userId, "recent_searches");
}

export function saveFilterPreset(userId: string, pageKey: string, name: string, filters: Record<string, string>) {
  const list = readList<FilterPreset>(userId, `filters_${pageKey}`).filter((p) => p.name !== name);
  list.unshift({ name, filters });
  writeList(userId, `filters_${pageKey}`, list.slice(0, 5));
}

export function getFilterPresets(userId: string, pageKey: string): FilterPreset[] {
  return readList<FilterPreset>(userId, `filters_${pageKey}`);
}

export function removeFilterPreset(userId: string, pageKey: string, name: string) {
  const list = readList<FilterPreset>(userId, `filters_${pageKey}`).filter((p) => p.name !== name);
  writeList(userId, `filters_${pageKey}`, list);
}
