import { createRoute } from "@tanstack/react-router"
import { HomePage } from "../../../features/home/homePage.js"
import { homeLayoutRoute } from "./homeLayoutRoute.js"

export const homeRootRoute = createRoute({
    getParentRoute: () => homeLayoutRoute,
    path: "/",
    beforeLoad: () => ({
        title: "FEC - Comptasse",
        description:
            "Validez votre Fichier des Écritures Comptables (FEC) selon l'article A47 A-1 du Livre des procédures fiscales. Gratuit, open source, 100\u00a0% local.",
    }),
    component: () => <HomePage />,
})
