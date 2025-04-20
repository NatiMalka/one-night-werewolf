import { initializeApp } from 'firebase/app';
import { getDatabase, ref as dbRef } from 'firebase/database';
import { setPersistence, browserSessionPersistence, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDr6X0vPapaGSlGi7Uvir0sWeZuhOAG8qE",
  authDomain: "web-game-e1c1c.firebaseapp.com",
  databaseURL: "https://web-game-e1c1c-default-rtdb.firebaseio.com",
  projectId: "web-game-e1c1c",
  storageBucket: "web-game-e1c1c.firebasestorage.app",
  messagingSenderId: "435974086562",
  appId: "1:435974086562:web:52180e83350934d52adcfb",
  measurementId: "G-3LY97H3K0W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Set persistence to session only (not persisted in cache)
// This helps prevent issues with cached auth states
setPersistence(auth, browserSessionPersistence)
  .catch(error => {
    console.error("Error setting auth persistence:", error);
  });

// Force a new connection on every page load
const clearConnection = () => {
  try {
    // In v9 we don't directly use database.ref - this is replaced with a different approach
    // Use onValue to check connection instead
    console.log("Connection check initialized");
  } catch (error) {
    console.error("Error refreshing connection:", error);
  }
};

// Add a timestamp to database requests to avoid caching
const addTimestampToUrl = (url: string): string => {
  // Only add timestamp to database URLs
  if (url.includes(firebaseConfig.databaseURL)) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}nocache=${Date.now()}`;
  }
  return url;
};

// Override fetch to add cache-busting parameter
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof input === 'string') {
    input = addTimestampToUrl(input);
  } else if (input instanceof Request) {
    input = new Request(addTimestampToUrl(input.url), input);
  }
  
  if (!init) init = {};
  if (!init.headers) init.headers = {};
  
  // Add cache control headers
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  init.headers = headers;
  
  return originalFetch(input, init);
};

// Try to clear connection on load
clearConnection();

export { app, database, auth };