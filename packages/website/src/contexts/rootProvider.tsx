import { Suspense } from "react"
import { RouterProvider } from "./router/routerProvider.js"

export function RootProvider() {
    return (
        <Suspense
            fallback={
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh" }}>
                    <span>Chargement...</span>
                </div>
            }
        >
            <RouterProvider />
        </Suspense>
    )
}
