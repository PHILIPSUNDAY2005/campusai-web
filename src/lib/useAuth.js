'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Tells any page who is logged in right now
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until Firebase has answered

  useEffect(() => {
    // Firebase calls this function when the page opens, and again whenever
    // someone logs in or out
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Stop listening when the page is closed
    return () => unsubscribe();
  }, []);

  return { user, loading };
}