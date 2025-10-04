// Simple global store for backend-managed Google Auth session
// This persists across component re-mounts caused by OrganizationProfile
// Only stores session ID - actual OAuth tokens are managed securely by backend

import React from 'react';

interface GoogleAuthStore {
  sessionId: string | null;
  sessionExpiry: number | null;
  listeners: Set<() => void>;
}

const store: GoogleAuthStore = {
  sessionId: null,
  sessionExpiry: null,
  listeners: new Set(),
};

// Clear session ID when page unloads (security measure)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    store.sessionId = null;
    store.sessionExpiry = null;
  });
}

export const googleAuthStore = {
  getSessionId: () => {
    // Check if session expired
    if (store.sessionExpiry && Date.now() > store.sessionExpiry) {
      console.log('[GoogleAuthStore] Session expired');
      store.sessionId = null;
      store.sessionExpiry = null;
      return null;
    }
    return store.sessionId;
  },
  
  setSessionId: (id: string | null, expiryMinutes = 60) => {
    console.log('[GoogleAuthStore] Setting sessionId:', id ? 'present' : 'null');
    store.sessionId = id;
    // Set expiry time (default 60 minutes)
    store.sessionExpiry = id ? Date.now() + (expiryMinutes * 60 * 1000) : null;
    store.listeners.forEach(listener => listener());
  },
  
  clear: () => {
    console.log('[GoogleAuthStore] Clearing session');
    store.sessionId = null;
    store.sessionExpiry = null;
    store.listeners.forEach(listener => listener());
  },
  
  subscribe: (listener: () => void) => {
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
    };
  },
};

// Custom hook to use the store in React components
export function useGoogleAuthStore() {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  
  React.useEffect(() => {
    // Subscribe to store changes
    return googleAuthStore.subscribe(forceUpdate);
  }, []);
  
  return {
    sessionId: googleAuthStore.getSessionId(),
    setSessionId: googleAuthStore.setSessionId,
    clear: googleAuthStore.clear,
  };
}