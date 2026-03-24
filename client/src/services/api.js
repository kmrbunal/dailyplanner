// API helpers for Clerk auth + NeonDB persistence

/**
 * Get a JWT token from the Clerk session.
 * @param {object} session - The Clerk session object (e.g., from useSession())
 * @returns {Promise<string|null>} The JWT token, or null if unavailable
 */
export async function getAuthToken(session) {
  if (!session) return null;
  return await session.getToken();
}

/**
 * Authenticated GET request.
 * @param {string} path - API path (appended to /api/)
 * @param {object} session - The Clerk session object
 * @returns {Promise<object|null>} Parsed JSON response, or null on failure
 */
export async function apiGet(path, session) {
  const token = await getAuthToken(session);
  if (!token) return null;
  const res = await fetch('/api/' + path, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!res.ok) return null;
  return await res.json();
}

/**
 * Authenticated PUT request.
 * @param {string} path - API path (appended to /api/)
 * @param {*} body - Request body (will be JSON.stringify'd)
 * @param {object} session - The Clerk session object
 * @returns {Promise<boolean>} True if the request succeeded
 */
export async function apiPut(path, body, session) {
  const token = await getAuthToken(session);
  if (!token) return false;
  const res = await fetch('/api/' + path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(body)
  });
  return res.ok;
}

/**
 * Load a value from the key-value store API.
 * @param {string} storeKey - The store key to load
 * @param {object} session - The Clerk session object
 * @returns {Promise<*>} The stored data, or null
 */
export async function apiLoadStore(storeKey, session) {
  const json = await apiGet('store/' + storeKey, session);
  return json ? json.data : null;
}

/**
 * Save a value to the key-value store API.
 * @param {string} storeKey - The store key to save under
 * @param {*} data - The data to save
 * @param {object} session - The Clerk session object
 * @returns {Promise<boolean>} True if the save succeeded
 */
export async function apiSaveStore(storeKey, data, session) {
  return apiPut('store/' + storeKey, data, session);
}
