import { openDB } from 'idb';

let db = null;

export async function initializeDB() {
  db = await openDB('hotelDB', 1, {
    upgrade(upgradeDB) {
      // Create an object store for users
      if (!upgradeDB.objectStoreNames.contains('users')) {
        const userStore = upgradeDB.createObjectStore('users', {
          keyPath: 'email'
        });
        userStore.createIndex('isAdmin', 'isAdmin', { unique: false });
      }

      // Create an object store for bookings
      if (!upgradeDB.objectStoreNames.contains('bookings')) {
        const bookingStore = upgradeDB.createObjectStore('bookings', {
          keyPath: 'id',
          autoIncrement: true
        });
        bookingStore.createIndex('guestName', 'guestName', { unique: false });
        bookingStore.createIndex('roomType', 'roomType', { unique: false });
        bookingStore.createIndex('status', 'status', { unique: false });
      }

      // Create an object store for services
      if (!upgradeDB.objectStoreNames.contains('services')) {
        const serviceStore = upgradeDB.createObjectStore('services', {
          keyPath: 'id',
          autoIncrement: true
        });
        serviceStore.createIndex('serviceName', 'serviceName', { unique: true });
        serviceStore.createIndex('serviceType', 'serviceType', { unique: false });
        serviceStore.createIndex('status', 'status', { unique: false });
      }
    }
  });
}

export function getDB() {
  if (!db) {
    throw new Error('Database has not been initialized. Please call initializeDB first.');
  }
  return db;
}
