import type { FecValidationResult } from "@comptasse/fec-engine"
import { validateFecFile } from "@comptasse/fec-engine"
import { Fragment, useCallback, useRef, useState } from "react"
import { css } from "../../../styled-system/css/css"
import { LinkContent } from "../../components/buttons/linkContent.tsx"
import { CircularLoader } from "../../components/layouts/circularLoader.tsx"
import { ResultSummary } from "./resultSummary.tsx"

export function HomePage() {
    const [result, setResult] = useState<FecValidationResult | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(async (file: File) => {
        setIsProcessing(true)
        setResult(null)
        try {
            const content = await file.text()
            const validationResult = validateFecFile(content, file.name)
            setResult(validationResult)
        } catch (err) {
            setResult({
                fileName: file.name,
                fileType: "flat",
                checks: [
                    {
                        id: "PARSE_ERROR",
                        severity: "error",
                        message: `Erreur lors de la lecture du fichier : ${err instanceof Error ? err.message : "Erreur inconnue"}`,
                    },
                ],
                summary: { errors: 1, warnings: 0, total: 1, lines: 0 },
            })
        } finally {
            setIsProcessing(false)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
        },
        [handleFile],
    )

    const handleClick = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            // Reset so the same file can be selected again
            e.target.value = ""
        },
        [handleFile],
    )

    return (
        <Fragment>
            {/* ------------------------------------------------------------------ */}
            {/* Hero section                                                        */}
            {/* ------------------------------------------------------------------ */}
            <section
                className={css({
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingX: "1rem",
                    paddingY: "4rem",
                    textAlign: "center",
                })}
            >
                <h1
                    className={css({
                        fontSize: "2rem",
                        fontWeight: "300",
                        color: "neutral",
                        letterSpacing: "-0.02em",
                        lineHeight: "1.3",
                        maxWidth: "40rem",
                    })}
                >
                    Validez votre Fichier des Écritures Comptables
                </h1>

                <p
                    className={css({
                        marginTop: "1rem",
                        fontSize: "0.9375rem",
                        color: "neutral/50",
                        lineHeight: "1.6",
                        maxWidth: "36rem",
                    })}
                >
                    Vérifiez la conformité de votre FEC.
                    <br />
                    Aucune donnée ne quitte votre navigateur.
                </p>

                {/* Badges */}
                <div
                    className={css({
                        marginTop: "1.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: "0.5rem",
                    })}
                >
                    {["Open source", "Gratuit", "100% local"].map((label) => (
                        <span
                            key={label}
                            className={css({
                                border: "1px solid",
                                borderColor: "primary/25",
                                borderRadius: "9999px",
                                paddingX: "0.75rem",
                                paddingY: "0.25rem",
                                fontSize: "0.75rem",
                                color: "primary",
                            })}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </section>

            {/* ------------------------------------------------------------------ */}
            {/* Drop zone                                                           */}
            {/* ------------------------------------------------------------------ */}
            <section
                className={css({
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingX: "1rem",
                })}
            >
                <div
                    role="button"
                    tabIndex={isProcessing ? -1 : 0}
                    aria-label="Zone de dépôt de fichier FEC - cliquez ou glissez un fichier .txt ou .xml"
                    aria-disabled={isProcessing}
                    onClick={isProcessing ? undefined : handleClick}
                    onKeyDown={
                        isProcessing
                            ? undefined
                            : (e) => {
                                  if (e.key === "Enter" || e.key === " ") handleClick()
                              }
                    }
                    onDragOver={isProcessing ? undefined : handleDragOver}
                    onDragLeave={isProcessing ? undefined : handleDragLeave}
                    onDrop={isProcessing ? undefined : handleDrop}
                    className={css({
                        width: "100%",
                        maxWidth: "40rem",
                        border: "2px dashed",
                        borderColor: isProcessing ? "primary/40" : isDragOver ? "primary" : "neutral/20",
                        borderRadius: "1rem",
                        padding: "3rem",
                        textAlign: "center",
                        cursor: isProcessing ? "default" : "pointer",
                        transition: "border-color 0.15s, background-color 0.15s, opacity 0.15s",
                        backgroundColor: isProcessing ? "primary/5" : isDragOver ? "primary/5" : "transparent",
                        _hover: isProcessing ? {} : { borderColor: "primary/40" },
                    })}
                >
                    {isProcessing ? (
                        <div
                            className={css({
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "1rem",
                            })}
                        >
                            <CircularLoader size={32} />
                            <p
                                className={css({
                                    fontSize: "0.9375rem",
                                    color: "primary",
                                    fontWeight: "400",
                                })}
                            >
                                Analyse en cours...
                            </p>
                            <p
                                className={css({
                                    fontSize: "0.8125rem",
                                    color: "neutral/40",
                                })}
                            >
                                Votre fichier est en cours de vérification
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Upload icon (SVG arrow-up) */}
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                focusable="false"
                                className={css({
                                    marginX: "auto",
                                    marginBottom: "1rem",
                                    color: isDragOver ? "primary" : "neutral/25",
                                })}
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>

                            <p
                                className={css({
                                    fontSize: "0.9375rem",
                                    color: "neutral/75",
                                    fontWeight: "400",
                                })}
                            >
                                Glissez votre fichier FEC ici
                            </p>
                            <p
                                className={css({
                                    marginTop: "0.25rem",
                                    fontSize: "0.8125rem",
                                    color: "neutral/50",
                                })}
                            >
                                ou cliquez pour sélectionner un fichier
                            </p>
                            <p
                                className={css({
                                    marginTop: "0.75rem",
                                    fontSize: "0.75rem",
                                    color: "neutral/25",
                                })}
                            >
                                .txt ou .xml
                            </p>
                        </>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.xml"
                        aria-label="Sélectionner un fichier FEC"
                        onChange={handleInputChange}
                        className={css({ display: "none" })}
                    />
                </div>
            </section>

            {/* ------------------------------------------------------------------ */}
            {/* Results (live region)                                               */}
            {/* ------------------------------------------------------------------ */}
            <div aria-live="polite" aria-atomic="false">
                {result && <ResultSummary result={result} />}
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Information section                                                 */}
            {/* ------------------------------------------------------------------ */}
            <section
                className={css({
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingX: "1rem",
                    paddingY: "3rem",
                })}
            >
                <div
                    className={css({
                        width: "100%",
                        maxWidth: "64rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2rem",
                    })}
                >
                    <h2
                        className={css({
                            fontSize: "1.25rem",
                            fontWeight: "400",
                            color: "neutral",
                            textAlign: "center",
                        })}
                    >
                        Comment ca marche ?
                    </h2>

                    <div
                        className={css({
                            display: "grid",
                            gridTemplateColumns: { base: "1fr", md: "1fr 1fr 1fr" },
                            gap: "2rem",
                        })}
                    >
                        {/* Card: 100% local */}
                        <div
                            className={css({
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                padding: "1.5rem",
                                borderRadius: "1rem",
                                border: "1px solid",
                                borderColor: "neutral/10",
                                backgroundColor: "white",
                            })}
                        >
                            <h3
                                className={css({
                                    fontSize: "0.9375rem",
                                    fontWeight: "400",
                                    color: "neutral",
                                })}
                            >
                                100% local
                            </h3>
                            <p
                                className={css({
                                    fontSize: "0.8125rem",
                                    color: "neutral/50",
                                    lineHeight: "1.6",
                                })}
                            >
                                Votre fichier est analysé directement dans votre navigateur. Aucune donnée n'est envoyée
                                à un serveur.
                            </p>
                        </div>

                        {/* Card: Conforme */}
                        <div
                            className={css({
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                padding: "1.5rem",
                                borderRadius: "1rem",
                                border: "1px solid",
                                borderColor: "neutral/10",
                                backgroundColor: "white",
                            })}
                        >
                            <h3
                                className={css({
                                    fontSize: "0.9375rem",
                                    fontWeight: "400",
                                    color: "neutral",
                                })}
                            >
                                Conforme à la réglementation
                            </h3>
                            <p
                                className={css({
                                    fontSize: "0.8125rem",
                                    color: "neutral/50",
                                    lineHeight: "1.6",
                                })}
                            >
                                Les vérifications sont basées sur l'
                                <a
                                    href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000027804775/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <LinkContent>article A47 A-1 du Livre des procédures fiscales</LinkContent>
                                </a>
                                .
                            </p>
                        </div>

                        {/* Card: Open source */}
                        <div
                            className={css({
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                padding: "1.5rem",
                                borderRadius: "1rem",
                                border: "1px solid",
                                borderColor: "neutral/10",
                                backgroundColor: "white",
                            })}
                        >
                            <h3
                                className={css({
                                    fontSize: "0.9375rem",
                                    fontWeight: "400",
                                    color: "neutral",
                                })}
                            >
                                Open source
                            </h3>
                            <p
                                className={css({
                                    fontSize: "0.8125rem",
                                    color: "neutral/50",
                                    lineHeight: "1.6",
                                })}
                            >
                                Le code source est disponible sur{" "}
                                <a href="https://github.com/comptasse/fec" target="_blank" rel="noopener noreferrer">
                                    <LinkContent>GitHub</LinkContent>
                                </a>
                                . sous licence AGPL-3.0.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </Fragment>
    )
}
