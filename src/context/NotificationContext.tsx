'use client';

import React, { createContext, useContext, useCallback } from "react";

interface NotificationContextType {
  refreshLotesSolicitados: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification debe usarse dentro de NotificationProvider");
  return ctx;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const refreshLotesSolicitados = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <NotificationContext.Provider value={{ refreshLotesSolicitados }}>
      {children}
    </NotificationContext.Provider>
  );
};
