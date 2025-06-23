import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function MapPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Lotes</h1>
        <p className="text-muted-foreground">Visualiza las propiedades en el mapa.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Mapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[60vh] bg-muted rounded-lg flex items-center justify-center">
             <p className="text-muted-foreground">El mapa se mostrará aquí.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
