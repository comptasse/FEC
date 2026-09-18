import type { FecValidationResult } from "@comptasse/fec-engine"
import { css } from "../../../styled-system/css/css"
import { CheckItem } from "./checkItem.tsx"

export function ResultSummary({ result }: { result: FecValidationResult }) {
    const hasErrors = result.summary.errors > 0

    return (
        <section
            className={css({
                width: "100%",
                maxWidth: "40rem",
                marginX: "auto",
                marginTop: "2rem",
            })}
        >
            {/* Summary bar */}
            <div
                className={css({
                    padding: "1rem 1.25rem",
                    borderRadius: "1rem 1rem 0 0",
                    // backgroundColor: hasErrors ? "red/1" : "primary/1",
                    backgroundColor: "neutral/1",
                    border: "1px solid",
                    borderColor: "neutral/10",
                    borderBottomColor: "neutral/10",
                })}
            >
                <div
                    className={css({
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                    })}
                >
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                        })}
                    >
                        <span
                            className={css({
                                fontSize: "0.875rem",
                                fontWeight: "400",
                                color: "neutral",
                            })}
                        >
                            {result.fileName}
                        </span>
                        <span
                            className={css({
                                fontSize: "0.75rem",
                                color: "neutral/40",
                            })}
                        >
                            Format : {result.fileType === "xml" ? "XML" : "Fichier plat (TSV)"}
                        </span>
                    </div>
                    <div
                        className={css({
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                        })}
                    >
                        {result.summary.errors > 0 && (
                            <span
                                className={css({
                                    fontSize: "0.8125rem",
                                    fontWeight: "400",
                                    color: "red",
                                })}
                            >
                                {result.summary.errors} erreur{result.summary.errors > 1 ? "s" : ""}
                            </span>
                        )}
                        {result.summary.warnings > 0 && (
                            <span
                                className={css({
                                    fontSize: "0.8125rem",
                                    fontWeight: "400",
                                    color: "orange",
                                })}
                            >
                                {result.summary.warnings} avertissement{result.summary.warnings > 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </div>

                <p
                    className={css({
                        marginTop: "0.5rem",
                        fontSize: "0.8125rem",
                        color: "neutral/60",
                    })}
                >
                    {result.summary.errors} erreur{result.summary.errors > 1 ? "s" : ""}, {result.summary.warnings}{" "}
                    avertissement{result.summary.warnings > 1 ? "s" : ""} sur {result.summary.lines} ligne
                    {result.summary.lines > 1 ? "s" : ""} analysée{result.summary.lines > 1 ? "s" : ""}
                </p>

                {!hasErrors && (
                    <p
                        className={css({
                            marginTop: "0.5rem",
                            fontSize: "0.875rem",
                            fontWeight: "400",
                            color: "primary",
                        })}
                    >
                        Votre FEC semble conforme !
                    </p>
                )}
            </div>

            {/* Check list */}
            {result.checks.length > 0 && (
                <div
                    className={css({
                        maxHeight: "24rem",
                        overflowY: "auto",
                        backgroundColor: "white",
                        borderRadius: "0 0 1rem 1rem",
                        border: "1px solid",
                        borderColor: "neutral/10",
                        borderTop: "none",
                    })}
                >
                    {result.checks.map((check, index) => (
                        <CheckItem key={`${check.id}-${index}`} check={check} />
                    ))}
                </div>
            )}
        </section>
    )
}
