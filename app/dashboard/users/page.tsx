import { getUsers } from "@/actions/users"
import { UserDialog } from "@/components/users/user-dialog"
import { UserTable } from "@/components/users/user-table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function UsersPage() {
    const session = await auth()

    // Security check: Only ADMIN can access
    if ((session?.user as any)?.role !== 'ADMIN') {
        redirect("/dashboard")
    }

    const { users } = await getUsers()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
                    <p className="text-muted-foreground">
                        Administra el acceso al sistema.
                    </p>
                </div>
                <UserDialog />
            </div>

            <UserTable users={users || []} />
        </div>
    )
}
