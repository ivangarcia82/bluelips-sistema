import { getSupplies, getSupplyMovements } from "@/actions/supplies"
import { SuppliesView } from "@/components/supplies/supplies-view"

export default async function SuppliesPage() {
    const [supplies, movements] = await Promise.all([getSupplies(), getSupplyMovements()])
    return <SuppliesView supplies={supplies} movements={movements} />
}
