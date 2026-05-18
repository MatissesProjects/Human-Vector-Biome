import { useState, useEffect } from 'react';

export function useIsStale(timestamp: string | undefined | null, timeoutMs: number = 10000) {
  const [isStale, setIsStale] = useState(true);

  useEffect(() => {
    if (!timestamp) {
      setIsStale(true);
      return;
    }

    const checkStaleness = () => {
      const timeDiff = new Date().getTime() - new Date(timestamp).getTime();
      setIsStale(timeDiff > timeoutMs);
    };

    // Check immediately
    checkStaleness();

    // Set an interval to keep checking
    const interval = setInterval(checkStaleness, 1000);
    return () => clearInterval(interval);
  }, [timestamp, timeoutMs]);

  return isStale;
}
