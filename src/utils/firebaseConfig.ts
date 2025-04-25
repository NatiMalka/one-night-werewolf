import { initializeApp } from 'firebase/app';
import { getDatabase, ref as dbRef, connectDatabaseEmulator } from 'firebase/database';
import { setPersistence, browserSessionPersistence, getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration
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

// Log environment info
console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
console.log(`📍 Hostname: ${location.hostname}`);
console.log(`🔐 Protocol: ${location.protocol}`);
console.log(`⚙️ Firebase config:`, { 
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Track init state for error handling
let firebaseInitialized = false;

// Initialize Firebase safely
let app;
let database;
let auth;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  
  // Mark as initialized
  firebaseInitialized = true;
  console.log("✅ Firebase core services initialized successfully");

  // Connect to emulators in development mode
  if (location.hostname === "localhost") {
    try {
      // Connect to auth emulator
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      
      // Connect to database emulator
      connectDatabaseEmulator(database, "localhost", 9000);
      
      console.log("🔥 Using Firebase emulators for local development");
      console.log("📌 Auth Emulator: http://localhost:9099");
      console.log("📌 Database Emulator: http://localhost:9000");
      
      // Clear any CORS error flag when using emulators
      localStorage.removeItem('auth_cors_error');
    } catch (emulatorError) {
      console.error("❌ Failed to connect to Firebase emulators:", emulatorError);
      console.log("⚠️ Make sure to start emulators with: npm run emulators");
    }
  } else {
    // Production logging
    console.log("🚀 Running in production mode with live Firebase services");
    console.log(`📌 Auth domain: ${firebaseConfig.authDomain}`);
  }

  // Set persistence to session only (not persisted in cache)
  // This helps prevent issues with cached auth states
  setPersistence(auth, browserSessionPersistence)
    .then(() => {
      console.log("✅ Auth persistence set to browser session");
    })
    .catch(error => {
      console.error("❌ Error setting auth persistence:", error);
    });
    
  // Test auth connection by adding a listener
  const unsubAuth = auth.onAuthStateChanged(
    (user) => {
      console.log("✅ Auth state change listener working", user ? "User authenticated" : "No user");
      unsubAuth(); // Only need to test once
    },
    (error) => {
      console.error("❌ Auth state listener error:", error);
      localStorage.setItem('auth_cors_error', 'true');
    }
  );
} catch (initError) {
  console.error("❌ Failed to initialize Firebase:", initError);
  console.log("⚠️ Continuing with limited functionality. Guest mode will still work.");
  
  // Set flag to use guest mode
  localStorage.setItem('auth_cors_error', 'true');
  
  // Create minimal mock objects to prevent crashes
  if (!app) app = {};
  if (!database) database = { ref: () => ({}) };
  if (!auth) auth = { 
    onAuthStateChanged: (callback: (user: null) => void) => { 
      callback(null); 
      return () => {}; 
    } 
  };
}

// Override fetch to add debugging for auth operations
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
  // Add timestamp to URL for cache busting
  if (typeof input === 'string') {
    // Debug Firebase auth requests
    if (input.includes('identitytoolkit') || input.includes('securetoken')) {
      console.log(`🔄 Firebase Auth API Request: ${input.split('?')[0]}`);
      
      // If there's a failure, we'll mark it for guest mode fallback
      const originalRequest = input;
      
      // Return the modified request with additional error handling
      return originalFetch(input, init).catch(error => {
        console.error(`❌ Firebase Auth API Error for ${originalRequest.split('?')[0]}:`, error);
        localStorage.setItem('auth_cors_error', 'true');
        throw error;
      });
    }
    
    input = addTimestampToUrl(input);
  } else if (input instanceof Request) {
    const url = input.url;
    
    // Debug Firebase auth requests
    if (url.includes('identitytoolkit') || url.includes('securetoken')) {
      console.log(`🔄 Firebase Auth API Request: ${url.split('?')[0]}`);
      
      // Create a new request to keep the original URL for logging
      input = new Request(addTimestampToUrl(url), input);
      
      // Return the modified request with additional error handling
      return originalFetch(input, init).catch(error => {
        console.error(`❌ Firebase Auth API Error for ${url.split('?')[0]}:`, error);
        localStorage.setItem('auth_cors_error', 'true');
        throw error;
      });
    } else {
      input = new Request(addTimestampToUrl(url), input);
    }
  }
  
  // Add cache control headers
  if (!init) init = {};
  if (!init.headers) init.headers = {};
  
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  init.headers = headers;
  
  return originalFetch(input, init);
};

// Force a new connection on every page load
const clearConnection = () => {
  try {
    console.log("🔄 Initializing connection check");
  } catch (error) {
    console.error("❌ Error refreshing connection:", error);
  }
};

// Add a timestamp to database requests to avoid caching
const addTimestampToUrl = (url: string): string => {
  // Only add timestamp to database URLs
  if (url && typeof url === 'string' && firebaseConfig.databaseURL && url.includes(firebaseConfig.databaseURL)) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}nocache=${Date.now()}`;
  }
  return url;
};

// Try to clear connection on load
clearConnection();

// Add a diagnostic function that can be called from devtools
(window as any).checkFirebaseAuth = () => {
  console.log("🔍 Firebase Diagnostic Info:");
  console.log("- Initialized:", firebaseInitialized);
  console.log("- Auth object:", auth);
  console.log("- CORS error flag:", localStorage.getItem('auth_cors_error'));
  console.log("- Current URL:", window.location.href);
  
  if (auth) {
    console.log("- Current user:", auth.currentUser);
  }
  
  return "Firebase diagnostics complete";
};

export { app, database, auth };