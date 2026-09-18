import { createRootRouteWithContext, useRouterState } from "@tanstack/react-router"
import { Fragment } from "react/jsx-runtime"
import { RootLayout } from "../features/rootLayout.js"

const DEFAULT_DESCRIPTION =
    "Validez votre Fichier des Écritures Comptables (FEC) selon l'article A47 A-1 du Livre des procédures fiscales. Gratuit, open source, 100\u00a0% local."
const SITE_NAME = "FEC - Comptasse"
const BASE_URL = "https://fec.comptasse.com"
const OG_IMAGE_URL = `${BASE_URL}/og.png`
const OG_IMAGE_ALT = "FEC - Comptasse - Outil de validation de Fichier des Écritures Comptables"

export const rootLayoutRoute = createRootRouteWithContext<{
    title: string | undefined
    description: string | undefined
    robots: string | undefined
}>()({
    pendingComponent: () => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh" }}>
            <span>Chargement...</span>
        </div>
    ),
    beforeLoad: (_ctx) => {},
    component: () => {
        const matches = useRouterState({ select: (s) => s.matches })
        const pathname = useRouterState({ select: (s) => s.location.pathname })

        const reversedMatches = [...matches].reverse()

        const matchWithTitle = reversedMatches.find((d) => d.context.title)
        const matchWithDescription = reversedMatches.find((d) => d.context.description)
        const matchWithRobots = reversedMatches.find((d) => d.context.robots)

        const rawTitle = matchWithTitle?.context.title || SITE_NAME
        const title = rawTitle === SITE_NAME ? SITE_NAME : `${rawTitle} - ${SITE_NAME}`
        const description = matchWithDescription?.context.description || DEFAULT_DESCRIPTION
        const robots = matchWithRobots?.context.robots
        const canonicalUrl = `${BASE_URL}${pathname}`
        const isHomePage = pathname === "/"

        // JSON-LD: WebSite (homepage only)
        const websiteJsonLd = isHomePage
            ? {
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  name: SITE_NAME,
                  url: BASE_URL,
                  description: DEFAULT_DESCRIPTION,
                  inLanguage: "fr-FR",
                  publisher: {
                      "@type": "Organization",
                      name: "Barbote SAS",
                      url: "https://comptasse.com",
                  },
              }
            : null

        // JSON-LD: SoftwareApplication (homepage only)
        const softwareJsonLd = isHomePage
            ? {
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  name: SITE_NAME,
                  url: BASE_URL,
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  description: DEFAULT_DESCRIPTION,
                  inLanguage: "fr-FR",
                  license: "https://www.gnu.org/licenses/agpl-3.0.html",
                  offers: {
                      "@type": "Offer",
                      price: "0",
                      priceCurrency: "EUR",
                      description: "Outil gratuit et open source",
                  },
                  publisher: {
                      "@type": "Organization",
                      name: "Barbote SAS",
                      url: "https://comptasse.com",
                  },
              }
            : null

        // JSON-LD: BreadcrumbList (non-homepage pages)
        const breadcrumbJsonLd = !isHomePage
            ? {
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  itemListElement: [
                      {
                          "@type": "ListItem",
                          position: 1,
                          name: "Accueil",
                          item: BASE_URL,
                      },
                      {
                          "@type": "ListItem",
                          position: 2,
                          name: rawTitle,
                          item: canonicalUrl,
                      },
                  ],
              }
            : null

        return (
            <Fragment>
                <title>{title}</title>
                <meta name="description" content={description} />
                <link rel="canonical" href={canonicalUrl} />
                {robots && <meta name="robots" content={robots} />}

                {/* Open Graph */}
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={OG_IMAGE_URL} />
                <meta property="og:image:alt" content={OG_IMAGE_ALT} />
                <meta property="og:locale" content="fr_FR" />
                <meta property="og:site_name" content={SITE_NAME} />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content={OG_IMAGE_URL} />
                <meta name="twitter:image:alt" content={OG_IMAGE_ALT} />

                {/* JSON-LD Structured Data */}
                {websiteJsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                    />
                )}
                {softwareJsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
                    />
                )}
                {breadcrumbJsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
                    />
                )}

                <RootLayout />
            </Fragment>
        )
    },
})
