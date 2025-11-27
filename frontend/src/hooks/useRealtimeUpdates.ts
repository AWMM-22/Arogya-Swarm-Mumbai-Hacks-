import { useState, useEffect } from 'react';
import { getWebSocketManager } from '../lib/websocket';

export function useRealtimeUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<any>(null);
  const [wsManager] = useState(() => getWebSocketManager());
  
  useEffect(() => {
    const unsubscribe = wsManager.onMessage((data: any) => {
      setIsConnected(true);
      setLatestUpdate(data);
    });
    
    wsManager.connect();
    
    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, [wsManager]);
  
  const sendMessage = (message: any) => {
    wsManager.send(message);
  };
  
  return { isConnected, latestUpdate, sendMessage };
}
