import { readUserSessionRouteDefinition } from "@comptasse/application-metadata/routes"
import { getResponseBodyFromAPI } from "../getResponseBodyFromAPI.js"
import { getIsAuthenticated } from "./getIsAuthenticated.js"

export async function getUserSession() {
    const isAuthenticated = getIsAuthenticated()

    if (isAuthenticated === true) {
        const response = await getResponseBodyFromAPI({
            routeDefinition: readUserSessionRouteDefinition,
            body: {},
        })
        if (!response.ok) return undefined
        return response.data
    }
    return undefined
}
