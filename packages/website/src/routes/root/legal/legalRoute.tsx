import { createRoute } from "@tanstack/react-router"
import { LegalPage } from "../../../features/legal/legalPage.js"
import { rootLayoutRoute } from "../../rootLayoutRoute.js"

export const legalRoute = createRoute({
    getParentRoute: () => rootLayoutRoute,
    path: "/mentions-legales",
    beforeLoad: () => ({
        title: "Mentions légales",
        description: "Mentions légales et politique de confidentialité du service Comptasse FEC.",
    }),
    component: () => <LegalPage />,
})
