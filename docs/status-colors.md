# Colores de Estado para Lotes

## Especificación de Colores

Los siguientes colores han sido implementados para representar los diferentes estados de los lotes en toda la aplicación:

| Estado | Color Hex | Descripción |
|--------|-----------|-------------|
| **Tomar acción** | `#669bbc` | Azul medio - Lotes que requieren atención inmediata |
| **Tasación** | `#dda15e` | Amarillo dorado - Lotes en proceso de tasación |
| **Evolucionando** | `#219ebc` | Azul claro - Lotes en desarrollo/evolución |
| **Disponible** | `#ffb703` | Amarillo brillante - Lotes disponibles para venta |
| **Descartado** | `#0d1b2a` | Gris muy oscuro - Lotes descartados |
| **No vende** | `#c1121f` | Rojo - Lotes que no se venden |
| **Reservado** | `#fb8500` | Naranja - Lotes reservados |
| **Vendido** | `#4f772d` | Verde - Lotes vendidos |

## Implementación

### Archivos Principales

1. **`src/lib/status-colors.ts`** - Archivo centralizado con todas las funciones de colores
2. **`tailwind.config.ts`** - Configuración de Tailwind CSS con colores personalizados
3. **`src/lib/data.ts`** - Exporta `getStatusStyles` desde el archivo centralizado
4. **`src/hooks/use-dashboard-data.ts`** - Exporta `getStatusStyles` desde el archivo centralizado

### Funciones Disponibles

#### `getStatusStyles(status: string): CSSProperties`
Retorna estilos CSS inline para badges y elementos de UI.

#### `getStatusClasses(status: string): string`
Retorna clases de Tailwind CSS para usar en componentes.

#### `getStatusBackgroundColor(status: string): string`
Retorna solo el color de fondo en formato hex.

#### `getStatusTextColor(status: string): string`
Retorna solo el color del texto en formato hex.

### Clases de Tailwind CSS

Los colores están disponibles como clases de Tailwind CSS:

- `bg-status-tomar-accion`
- `bg-status-tasacion`
- `bg-status-evolucionando`
- `bg-status-disponible`
- `bg-status-descartado`
- `bg-status-no-vende`
- `bg-status-reservado`
- `bg-status-vendido`

## Componentes Actualizados

Los siguientes componentes han sido actualizados para usar los nuevos colores:

1. **`src/components/lotes/ListingCard.tsx`** - Badges de estado en las tarjetas de lotes
2. **`src/components/lotes/SmpDetailView.tsx`** - Badges de estado en la vista de detalles
3. **`src/app/lotes/[smp]/page.tsx`** - Badges de estado en la página de detalles
4. **`src/app/lotes/mapa/page.tsx`** - Colores en el mapa y leyenda
5. **`src/app/lotes/profile/page.tsx`** - Badges de estado en perfiles de usuario
6. **`src/components/dashboard/dashboard-client.tsx`** - Tarjetas de estado en el dashboard

## Uso

### En componentes React:

```tsx
import { getStatusStyles, getStatusClasses } from '@/lib/status-colors';

// Usando estilos CSS inline
<Badge style={getStatusStyles(listing.status)}>
  {listing.status}
</Badge>

// Usando clases de Tailwind
<div className={getStatusClasses(listing.status)}>
  {listing.status}
</div>
```

### En estilos CSS:

```css
.my-status-badge {
  background-color: var(--status-tomar-accion);
  color: white;
}
```

## Notas Importantes

1. **Consistencia**: Todos los colores están centralizados en `src/lib/status-colors.ts`
2. **Accesibilidad**: Los colores de texto se ajustan automáticamente para garantizar contraste adecuado
3. **Flexibilidad**: Se pueden usar tanto estilos CSS inline como clases de Tailwind
4. **Mantenimiento**: Para cambiar colores, solo es necesario modificar `src/lib/status-colors.ts` 