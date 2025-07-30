import { getStatusStyles, STATUS_COLORS } from "@/lib/status-colors";

export default function TestColorsPage() {
  const estados = Object.keys(STATUS_COLORS);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Prueba de Colores de Estado</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {estados.map((estado) => {
          const styles = getStatusStyles(estado);
          return (
            <div key={estado} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">{estado}</h3>
              <div 
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                style={styles}
              >
                {estado}
              </div>
              <div className="mt-2 text-sm">
                <p>Hex: {STATUS_COLORS[estado as keyof typeof STATUS_COLORS]}</p>
                <p>Estilos: {JSON.stringify(styles)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 