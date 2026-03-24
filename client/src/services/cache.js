// In-memory cloud cache (replaces localStorage for React SPA)
const _cache = {};

export function cacheGet(key) {
  return _cache[key] || null;
}

export function cacheSet(key, value) {
  _cache[key] = value;
}

export function cacheRemove(key) {
  delete _cache[key];
}

export function cacheKeys() {
  return Object.keys(_cache);
}
