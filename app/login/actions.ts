'use server'

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(
    _prevState: string | undefined,
    formData: FormData
) {
    try {
        await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/dashboard",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Correo o contraseña incorrectos."
                default:
                    return "No se pudo iniciar sesión. Inténtalo de nuevo."
            }
        }
        // Re-lanza la redirección de éxito (NEXT_REDIRECT) y otros errores
        throw error
    }
}
