'use client';

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSpinner } from "./SpinnerProvider";

const SHOW_DELAY = 200; // ms
const MIN_VISIBLE = 2000; // ms (2 segundos)

export default function NavigationSpinnerHandler() {
  const pathname = usePathname();
  const { show, hide } = useSpinner();
  const firstLoad = useRef(true);
  const showTimeout = useRef<NodeJS.Timeout | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const spinnerShownAt = useRef<number | null>(null);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    // Limpiar timeouts previos
    if (showTimeout.current) clearTimeout(showTimeout.current);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    spinnerShownAt.current = null;

    // Esperar un pequeño delay antes de mostrar el spinner
    showTimeout.current = setTimeout(() => {
      show();
      spinnerShownAt.current = Date.now();
    }, SHOW_DELAY);

    // Cuando el pathname cambia, ocultar el spinner después del mínimo visible
    hideTimeout.current = setTimeout(() => {
      if (spinnerShownAt.current) {
        const elapsed = Date.now() - spinnerShownAt.current;
        if (elapsed < MIN_VISIBLE) {
          setTimeout(hide, MIN_VISIBLE - elapsed);
        } else {
          hide();
        }
      } else {
        // Si nunca se mostró el spinner, cancelamos
        if (showTimeout.current) clearTimeout(showTimeout.current);
      }
    }, SHOW_DELAY + MIN_VISIBLE);

    return () => {
      if (showTimeout.current) clearTimeout(showTimeout.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
} 