import type { routeDefinition } from "@comptasse/application-metadata/utilities"
import type * as v from "valibot"
import { toast } from "../contexts/toasts/useToast.js"
import { ClientError } from "./clientError.js"
import { getCookie } from "./cookies/getCookie.js"
import { validate } from "./validate.js"
import { cookiePrefix } from "./variables.js"

export async function getResponseBodyFromAPI<
    TSchemaBody extends v.ObjectSchema<v.ObjectEntries, undefined>,
    TSchemaReturn extends
        | v.ObjectSchema<v.ObjectEntries, undefined>
        | v.ArraySchema<v.ObjectSchema<v.ObjectEntries, undefined>, undefined>,
>(parameters: {
    routeDefinition: ReturnType<typeof routeDefinition<string, TSchemaBody, TSchemaReturn>>
    body: v.InferOutput<TSchemaBody>
    signal?: AbortSignal
    hasToastMessage?: boolean
}) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
    if (!apiBaseUrl) {
        console.error(
            "VITE_API_BASE_URL is not defined. The request will not be sent. " +
                "Make sure the environment variable is set at build time.",
        )
        return <const>{
            ok: false,
            data: undefined,
            error: new ClientError({
                message: "VITE_API_BASE_URL is not defined",
            }),
        }
    }

    const abortController = parameters.signal ? undefined : new AbortController()
    const signal = parameters.signal ?? abortController!.signal
    try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
        if (!apiBaseUrl) {
            console.error(
                "VITE_API_BASE_URL is not defined. The request will not be sent. " +
                    "Make sure the environment variable is set at build time.",
            )
            return <const>{
                ok: false,
                data: undefined,
                error: new ClientError({
                    message: "VITE_API_BASE_URL is not defined",
                }),
            }
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        }

        const idOrganization = getCookie(`${cookiePrefix}_id_organization`)
        if (idOrganization) {
            headers["X-Organization-Id"] = idOrganization
        }

        const response = await fetch(new URL(`${apiBaseUrl}${parameters.routeDefinition.path}`), {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(parameters.body),
            signal,
        })
        const jsonResponse = JSON.parse((await response.text()) || "{}")
        if (response.ok === false) {
            throw new ClientError({
                message: "Error with the POST request response",
                cause: jsonResponse.cause ?? jsonResponse.message,
            })
        }

        const parsedData = validate({
            schema: parameters.routeDefinition.schemas.return,
            data: jsonResponse,
        })

        if (parsedData.success === false) {
            throw new ClientError({
                message: "Error with the POST request body data validation",
                rawError: parsedData.error,
            })
        }

        return <const>{
            ok: true,
            data: parsedData.data,
            error: undefined,
        }
    } catch (error: unknown) {
        abortController?.abort()

        if (parameters.hasToastMessage) {
            const clientError = error instanceof ClientError ? error : new ClientError({ rawError: error })

            let validationMessages: string | undefined
            try {
                const parsed = JSON.parse(clientError.cause ?? "")
                if (parsed?.nested && typeof parsed.nested === "object") {
                    validationMessages = Object.entries(parsed.nested as Record<string, string[]>)
                        .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
                        .join(" | ")
                }
            } catch {
                // cause is not a JSON validation error string, ignore
            }

            if (validationMessages) {
                toast({
                    title: "Requête invalide",
                    description: validationMessages,
                    variant: "error",
                })
            } else {
                toast({
                    title: clientError.cause ?? "Erreur avec l'API.",
                    variant: "error",
                })
            }
        }

        return <const>{
            ok: false,
            data: undefined,
            error:
                error instanceof ClientError
                    ? error
                    : new ClientError({
                          rawError: error,
                      }),
        }
    }
}
