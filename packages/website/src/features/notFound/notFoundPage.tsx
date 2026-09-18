import { Link } from "@tanstack/react-router"
import { css } from "../../../styled-system/css/css"

export function NotFoundPage() {
    return (
        <div
            className={css({
                width: "100%",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "background",
            })}
        >
            <div
                className={css({
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingX: "1rem",
                    paddingY: "4rem",
                })}
            >
                <div
                    className={css({
                        maxWidth: "24rem",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2rem",
                        textAlign: "center",
                    })}
                >
                    <span
                        className={css({
                            fontSize: "4rem",
                            fontWeight: "600",
                            color: "neutral/15",
                            lineHeight: 1,
                        })}
                    >
                        404
                    </span>
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        })}
                    >
                        <h1
                            className={css({
                                fontSize: "1.125rem",
                                fontWeight: "400",
                                color: "neutral",
                            })}
                        >
                            Page introuvable
                        </h1>
                        <p
                            className={css({
                                fontSize: "0.875rem",
                                color: "neutral/60",
                                lineHeight: "1.6",
                            })}
                        >
                            La page que vous recherchez n'existe pas ou a été déplacée.
                        </p>
                    </div>
                    <Link
                        to="/"
                        className={css({
                            fontSize: "0.875rem",
                            color: "primary",
                            textDecoration: "none",
                            _hover: { textDecoration: "underline" },
                        })}
                    >
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    )
}
