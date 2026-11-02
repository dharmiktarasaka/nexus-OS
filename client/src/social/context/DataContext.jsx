import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { accountsAPI, postsAPI } from '../api/index.js';
import { useAuth } from './AuthContext.jsx';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Prevent concurrent fetches
  const fetchingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoadingData(true);
    try {
      // Fire both requests in parallel for maximum speed
      const [accRes, postRes] = await Promise.all([
        accountsAPI.list(),
        postsAPI.list({}),
      ]);
      setAccounts(accRes.data);
      setPosts(postRes.data);
      setDataLoaded(true);
    } catch (err) {
      console.error('[DataContext] Failed to load data:', err.message);
    } finally {
      setLoadingData(false);
      fetchingRef.current = false;
    }
  }, []);

  // Load once when user logs in. Reset when they log out.
  useEffect(() => {
    if (user) {
      if (!dataLoaded) fetchAll();
    } else {
      // User logged out — clear cache so next login starts fresh
      setAccounts([]);
      setPosts([]);
      setDataLoaded(false);
    }
  }, [user, dataLoaded, fetchAll]);

  // Expose a manual refresh so pages can request a re-fetch after mutations
  const refresh = useCallback(() => {
    setDataLoaded(false); // triggers the useEffect above on next render
  }, []);

  // Helpers: pages can optimistically update without waiting for a full refresh
  const refreshAccounts = useCallback(async () => {
    try {
      const res = await accountsAPI.list();
      setAccounts(res.data);
    } catch (err) {
      console.error('[DataContext] Failed to refresh accounts:', err.message);
    }
  }, []);

  const refreshPosts = useCallback(async () => {
    try {
      const res = await postsAPI.list({});
      setPosts(res.data);
    } catch (err) {
      console.error('[DataContext] Failed to refresh posts:', err.message);
    }
  }, []);

  return (
    <DataContext.Provider value={{
      accounts,
      posts,
      loadingData,
      dataLoaded,
      refresh,
      refreshAccounts,
      refreshPosts,
      setAccounts,
      setPosts,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
