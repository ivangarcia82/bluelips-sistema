import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopServicesProps {
    data: {
        name: string
        value: number
    }[]
}

export function TopServices({ data }: TopServicesProps) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0)

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Servicios Más Solicitados</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium shrink-0 max-w-[70%] truncate" title={item.name}>{item.name}</span>
                                <span className="text-muted-foreground">{item.value} citas</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{
                                        width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    {data.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            No hay datos suficientes
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
