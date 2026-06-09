/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'PosterArchiveDB';
const STORE_NAME = 'PostersStore';
const KEY_NAME = 'posters_list';
const DB_VERSION = 1;

/**
 * Returns a Promise that resolves to the IndexedDB database instance.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e: Event) => {
      resolve((e.target as IDBOpenDBRequest).result);
    };

    request.onerror = (eEvent: Event) => {
      reject(new Error('Failed to open IndexedDB database.'));
    };
  });
}

/**
 * Saves posters list to IndexedDB. Falls back to localStorage if IndexedDB fails or is unavailable.
 */
export async function savePosters(posters: any[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(posters, KEY_NAME);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (e: Event) => {
        reject(new Error('Failed to put posters list in IndexedDB store.'));
      };
    });
  } catch (err) {
    console.warn('IndexedDB unavailable or failed. Falling back to localStorage...', err);
    try {
      localStorage.setItem('poster_archive_items', JSON.stringify(posters));
    } catch (localErr: any) {
      console.error('LocalStorage save also failed:', localErr);
      if (localErr.name === 'QuotaExceededError' || localErr.code === 22) {
        // Suppress warning if limit exceeded, since we want to make it non-blocking
        throw new Error('QUOTA_EXCEEDED');
      }
      throw localErr;
    }
  }
}

/**
 * Loads posters list from IndexedDB. If no data exists, tries to load from localStorage.
 */
export async function loadPosters(): Promise<any[] | null> {
  // First, check IndexedDB
  try {
    const db = await openDB();
    const loadedData = await new Promise<any[] | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_NAME);

      request.onsuccess = (e: Event) => {
        resolve((e.target as IDBRequest).result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to read from IndexedDB.'));
      };
    });

    if (loadedData && Array.isArray(loadedData) && loadedData.length > 0) {
      return loadedData;
    }
  } catch (err) {
    console.warn('IndexedDB read failed or not supported. Trying localStorage fallback...', err);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem('poster_archive_items');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse posters from localStorage:', e);
  }

  return null;
}
