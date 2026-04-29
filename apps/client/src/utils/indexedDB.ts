// IndexedDB utility for Material Library demo storage
// Supports files up to 20MB with persistent storage

interface StoredMaterial {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileBlob?: Blob;
  title: string;
  description?: string;
  type: string;
  status?: string;
  topics: string[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

const DB_NAME = 'VonovaDemoDB';
const STORE_NAME = 'materials';
const DB_VERSION = 1;

// Open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('uploadDate', 'uploadDate');
        store.createIndex('type', 'type');
      }
    };
  });
};

// Store material in IndexedDB
export const storeMaterial = async (material: StoredMaterial): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(material);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get all materials from IndexedDB
export const getStoredMaterials = async (): Promise<StoredMaterial[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Get specific material by ID
export const getStoredMaterial = async (id: string): Promise<StoredMaterial | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Delete material from IndexedDB
export const deleteStoredMaterial = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Clear all materials from IndexedDB
export const clearStoredMaterials = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
