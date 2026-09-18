import type { routeDefinition } from "@comptasse/application-metadata/utilities"
import { useQuery } from "@tanstack/react-query"
import type * as v from "valibot"
import { ClientError } from "./clientError.js"
import { getResponseBodyFromAPI } from "./getResponseBodyFromAPI.js"

export function useDataFromAPI<
    TSchemaBody extends v.ObjectSchema<v.ObjectEntries, undefined>,
    TSchemaReturn extends
        | v.ObjectSchema<v.ObjectEntries, undefined>
        | v.ArraySchema<v.ObjectSchema<v.ObjectEntries, undefined>, undefined>,
    TSelected = v.InferOutput<TSchemaReturn>,
>(parameters: {
    routeDefinition: ReturnType<typeof routeDefinition<string, TSchemaBody, TSchemaReturn>>
    body: v.InferOutput<TSchemaBody>
    enabled?: boolean
    select?: (data: v.InferOutput<TSchemaReturn>) => TSelected
}) {
    return useQuery({
        queryKey: [parameters.routeDefinition.path, parameters.body],
        queryFn: async (context) => {
            const response = await getResponseBodyFromAPI({
                routeDefinition: parameters.routeDefinition,
                body: parameters.body,
                signal: context.signal,
            })
            if (response.ok === false) {
                throw new ClientError({
                    message: "Error with the data fetching",
                    rawError: response.error,
                })
            }

            return response.data
        },
        retry: 1,
        enabled: parameters.enabled ?? true,
        select: parameters.select,
    })
}
