import type { FecCheckResult } from "@comptasse/fec-engine"
import { css } from "../../../styled-system/css/css"

export function CheckItem({ check }: { check: FecCheckResult }) {
    const isError = check.severity === "error"

    return (
        <div
            className={css({
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "1rem",
                borderBottom: "1px solid",
                borderBottomColor: "neutral/5",
                _last: {
                    borderBottom: "none",
                },
            })}
        >
            {/* Severity indicator */}
            <span
                className={css({
                    flexShrink: 0,
                    width: "0.5rem",
                    height: "0.5rem",
                    borderRadius: "9999px",
                    marginTop: "0.4rem",
                    backgroundColor: isError ? "red" : "orange",
                })}
            />

            {/* Content */}
            <div
                className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.125rem",
                    flex: 1,
                    minWidth: 0,
                })}
            >
                <span
                    className={css({
                        fontSize: "0.8125rem",
                        color: "neutral",
                        lineHeight: "1.4",
                    })}
                >
                    {check.message}
                </span>
                {(check.line !== undefined || check.field !== undefined) && (
                    <span
                        className={css({
                            fontSize: "0.6875rem",
                            color: "neutral/40",
                            fontFamily: "mono",
                        })}
                    >
                        {check.line !== undefined && `Ligne ${check.line}`}
                        {check.line !== undefined && check.field !== undefined && " - "}
                        {check.field !== undefined && `Champ : ${check.field}`}
                    </span>
                )}
            </div>

            {/* Severity badge */}
            <span
                className={css({
                    flexShrink: 0,
                    fontSize: "0.6875rem",
                    fontWeight: "400",
                    paddingX: "0.5rem",
                    paddingY: "0.125rem",
                    borderRadius: "9999px",
                    backgroundColor: isError ? "red/10" : "orange/10",
                    color: isError ? "red" : "orange",
                })}
            >
                {isError ? "erreur" : "avertissement"}
            </span>
        </div>
    )
}
