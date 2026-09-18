import {
    readAllAccountsRouteDefinition,
    readAllBalanceSheetsRouteDefinition,
    readAllComputationIncomeStatementsRouteDefinition,
    readAllComputationsRouteDefinition,
    readAllFilesRouteDefinition,
    readAllFoldersRouteDefinition,
    readAllIncomeStatementsRouteDefinition,
    readAllJournalsRouteDefinition,
    readAllRecordLabelsRouteDefinition,
    readAllRecordRowsRouteDefinition,
    readAllRecordsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type * as v from "valibot"
import { dataClient } from "../contexts/data/queryClient.js"
import { getResponseBodyFromAPI } from "./getResponseBodyFromAPI.js"

type YearScopedBody = { idYear: string }

type YearScopedRouteDefinition = {
    path: string
    schemas: {
        body: v.ObjectSchema<v.ObjectEntries, undefined>
        return:
            | v.ObjectSchema<v.ObjectEntries, undefined>
            | v.ArraySchema<v.ObjectSchema<v.ObjectEntries, undefined>, undefined>
    }
}

const yearScopedRouteDefinitions: YearScopedRouteDefinition[] = [
    readAllAccountsRouteDefinition,
    readAllRecordsRouteDefinition,
    readAllRecordRowsRouteDefinition,
    readAllJournalsRouteDefinition,
    readAllRecordLabelsRouteDefinition,
    readAllFilesRouteDefinition,
    readAllFoldersRouteDefinition,
    readAllBalanceSheetsRouteDefinition,
    readAllIncomeStatementsRouteDefinition,
    readAllComputationsRouteDefinition,
    readAllComputationIncomeStatementsRouteDefinition,
]

/**
 * Prefetches all year-scoped data into the React Query cache.
 *
 * Called when entering a year layout. Each query is set to `staleTime: Infinity`
 * so it is only refetched on explicit invalidation (after mutations) or hard refresh.
 *
 * This is fire-and-forget - it does not block navigation.
 */
export function prefetchYearData(params: YearScopedBody) {
    const body: YearScopedBody = {
        idYear: params.idYear,
    }

    for (const routeDefinition of yearScopedRouteDefinitions) {
        dataClient.setQueryDefaults([routeDefinition.path], {
            staleTime: Number.POSITIVE_INFINITY,
        })

        dataClient.prefetchQuery({
            queryKey: [routeDefinition.path, body],
            queryFn: async ({ signal }) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition,
                    body,
                    signal,
                })
                if (response.ok === false) {
                    throw response.error
                }
                return response.data
            },
        })
    }
}
