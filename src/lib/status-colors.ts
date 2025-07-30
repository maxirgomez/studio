import type { CSSProperties } from "react";

// Colores de estado según especificaciones del usuario
export const STATUS_COLORS = {
  "Tomar acción": "#669bbc",
  "Tomar Acción": "#669bbc", // Variante con tilde
  "Tasación": "#dda15e",
  "Tasacion": "#dda15e", // Variante sin tilde 
  "Evolucionando": "#219ebc",
  "Disponible": "#ffb703",
  "Descartado": "#0d1b2a",
  "No vende": "#c1121f",
  "Reservado": "#fb8500",
  "Vendido": "#4f772d"
} as const;

export type StatusType = keyof typeof STATUS_COLORS;

// Función para obtener estilos CSS para badges y elementos de UI
export const getStatusStyles = (status: string): CSSProperties => {
  const backgroundColor = STATUS_COLORS[status as StatusType];
  
  if (!backgroundColor) {
    return {
      backgroundColor: "#f3f4f6",
      color: "#374151"
    };
  }

  // Determinar el color del texto basado en el color de fondo
  const getTextColor = (bgColor: string): string => {
    // Para colores claros, usar texto negro
    if (bgColor === "#ffb703") { // Disponible - amarillo claro
      return "#000000";
    }
    // Para el resto, usar texto blanco
    return "#ffffff";
  };

  return {
    backgroundColor,
    color: getTextColor(backgroundColor)
  };
};

// Función para obtener clases de Tailwind CSS
export const getStatusClasses = (status: string): string => {
  const backgroundColor = STATUS_COLORS[status as StatusType];
  
  if (!backgroundColor) {
    return "bg-gray-100 text-gray-700";
  }

  // Mapear estados a clases de Tailwind usando los colores personalizados
  const statusClassMap: Record<string, string> = {
    "Tomar acción": "bg-status-tomar-accion text-white",
    "Tomar Acción": "bg-status-tomar-accion text-white", // Variante con tilde
    "Tasación": "bg-status-tasacion text-white",
    "Tasacion": "bg-status-tasacion text-white", // Variante sin tilde
    "Evolucionando": "bg-status-evolucionando text-white",
    "Disponible": "bg-status-disponible text-black",
    "Descartado": "bg-status-descartado text-white",
    "No vende": "bg-status-no-vende text-white",
    "Reservado": "bg-status-reservado text-white",
    "Vendido": "bg-status-vendido text-white"
  };

  return statusClassMap[status] || "bg-gray-100 text-gray-700";
};

// Función para obtener solo el color de fondo
export const getStatusBackgroundColor = (status: string): string => {
  return STATUS_COLORS[status as StatusType] || "#f3f4f6";
};

// Función para obtener solo el color del texto
export const getStatusTextColor = (status: string): string => {
  const backgroundColor = STATUS_COLORS[status as StatusType];
  
  if (!backgroundColor) {
    return "#374151";
  }

  if (backgroundColor === "#ffb703") { // Disponible - amarillo claro
    return "#000000";
  }
  
  return "#ffffff";
}; 