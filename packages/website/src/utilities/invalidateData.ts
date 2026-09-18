import type { routeDefinition } from "@comptasse/application-metadata/utilities"
import type * as v from "valibot"
import { dataClient } from "../contexts/data/queryClient.js"

export async function invalidateData<
    TSchemaBody extends v.ObjectSchema<v.ObjectEntries, undefined>,
    TSchemaReturn extends
        | v.ObjectSchema<v.ObjectEntries, undefined>
        | v.ArraySchema<v.ObjectSchema<v.ObjectEntries, undefined>, undefined>,
>(parameters: {
    routeDefinition: ReturnType<typeof routeDefinition<string, TSchemaBody, TSchemaReturn>>
    body: v.InferOutput<TSchemaBody>
    exact?: boolean
}) {
    await dataClient.invalidateQueries({
        queryKey: [parameters.routeDefinition.path, parameters.body],
        exact: parameters.exact ?? true,
    })
}
