'use client'

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SpinnerContextType {
  show: () => void;
  hide: () => void;
  visible: boolean;
}

const SpinnerContext = createContext<SpinnerContextType | undefined>(undefined);

export const useSpinner = () => {
  const ctx = useContext(SpinnerContext);
  if (!ctx) throw new Error("useSpinner debe usarse dentro de SpinnerProvider");
  return ctx;
};

const SpinnerProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const show = () => setVisible(true);
  const hide = () => setVisible(false);
  return (
    <SpinnerContext.Provider value={{ show, hide, visible }}>
      {children}
    </SpinnerContext.Provider>
  );
};

export default SpinnerProvider; 