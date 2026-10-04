/**
 * readingProgress.js
 * Client-side reading progress persistence using localStorage.
 * Key: 'rp_v2_{bookSlug}'
 */

const STORAGE_PREFIX = 'rp_v2_';
const ALL_SLUGS_KEY  = 'rp_v2_index';

function key(bookSlug) { return `${STORAGE_PREFIX}${bookSlug}`; }
function isClient() { return typeof window !== 'undefined'; }

function updateIndex(bookSlug) {
  if (!isClient()) return;
  try {
    const raw = localStorage.getItem(ALL_SLUGS_KEY);
    let slugs = raw ? JSON.parse(raw) : [];
    slugs = slugs.filter((s) => s !== bookSlug);
    slugs.unshift(bookSlug);
    if (slugs.length > 50) slugs = slugs.slice(0, 50);
    localStorage.setItem(ALL_SLUGS_KEY, JSON.stringify(slugs));
  } catch (e) {}
}

export function saveReadingProgress({
  bookSlug, bookTitle, chapterIdx, chapterNumber,
  chapterTitle, totalChapters, scrollY = 0, scrollPct = 0,
}) {
  if (!isClient() || !bookSlug) return;
  try {
    const chapterPct  = totalChapters > 0 ? (chapterIdx / totalChapters) * 100 : 0;
    const withinBonus = totalChapters > 0 ? (scrollPct / 100) * (100 / totalChapters) : 0;
    const overallPct  = Math.min(100, chapterPct + withinBonus);
    const progress = {
      bookSlug, bookTitle, chapterIdx, chapterNumber, chapterTitle,
      totalChapters, scrollY, scrollPct, chapterPct, overallPct,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key(bookSlug), JSON.stringify(progress));
    updateIndex(bookSlug);
  } catch (e) {}
}

export function loadReadingProgress(bookSlug) {
  if (!isClient() || !bookSlug) return null;
  try {
    const raw = localStorage.getItem(key(bookSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.chapterIdx !== 'number' || typeof parsed.totalChapters !== 'number') return null;
    return parsed;
  } catch (e) { return null; }
}

export function loadAllReadingProgress() {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(ALL_SLUGS_KEY);
    const slugs = raw ? JSON.parse(raw) : [];
    const results = [];
    for (const slug of slugs) {
      const p = loadReadingProgress(slug);
      if (p) results.push(p);
    }
    return results;
  } catch (e) { return []; }
}

export function clearReadingProgress(bookSlug) {
  if (!isClient() || !bookSlug) return;
  try {
    localStorage.removeItem(key(bookSlug));
    const raw = localStorage.getItem(ALL_SLUGS_KEY);
    if (raw) {
      const slugs = JSON.parse(raw).filter((s) => s !== bookSlug);
      localStorage.setItem(ALL_SLUGS_KEY, JSON.stringify(slugs));
    }
  } catch (e) {}
}

export function hasReadingProgress(bookSlug) {
  return loadReadingProgress(bookSlug) !== null;
}

export function formatRelativeTime(isoString) {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'এইমাত্র';
    if (mins < 60)  return mins + ' মিনিট আগে';
    if (hours < 24) return hours + ' ঘণ্টা আগে';
    if (days < 7)   return days + ' দিন আগে';
    if (days < 30)  return Math.floor(days / 7) + ' সপ্তাহ আগে';
    return Math.floor(days / 30) + ' মাস আগে';
  } catch (e) { return ''; }
}