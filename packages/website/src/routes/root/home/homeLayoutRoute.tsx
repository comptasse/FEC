import { createRoute } from "@tanstack/react-router"
import { HomeLayout } from "../../../features/home/homeLayout.js"
import { rootLayoutRoute } from "../../rootLayoutRoute.js"

export const homeLayoutRoute = createRoute({
    getParentRoute: () => rootLayoutRoute,
    id: "homeLayout",
    pendingComponent: () => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh" }}>
            <span>Chargement...</span>
        </div>
    ),
    beforeLoad: () => {},
    component: () => <HomeLayout />,
})
