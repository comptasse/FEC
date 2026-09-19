import { IconBrandGithub, IconClipboardList } from "@tabler/icons-react"
import { Outlet } from "@tanstack/react-router"
import { css } from "../../../styled-system/css/css"
import { ButtonGhostContent } from "../../components/buttons/buttonGhostContent.tsx"
import { LinkButton } from "../../components/buttons/linkButton.tsx"
import { Logo } from "../../components/layouts/logo.tsx"

export function HomeLayout() {
    return (
        <div
            className={css({
                width: "100%",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
            })}
        >
            {/* ------------------------------------------------------------------ */}
            {/* Header                                                              */}
            {/* ------------------------------------------------------------------ */}
            <header
                className={css({
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "1rem",
                    borderBottom: "1px solid",
                    borderBottomColor: "neutral/10",
                    backgroundColor: "white",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                })}
            >
                <div
                    className={css({
                        width: "100%",
                        maxWidth: "xl",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem",
                    })}
                >
                    <div
                        className={css({
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        })}
                    >
                        <a href="https://comptasse.com" target="_blank" rel="noopener noreferrer">
                            <ButtonGhostContent leftIcon={<Logo />} text="Comptasse" />
                        </a>

                        <span className={css({ color: "neutral/20", display: { base: "none", sm: "block" } })}>/</span>

                        <LinkButton to="/">
                            <ButtonGhostContent
                                leftIcon={<IconClipboardList />}
                                text="Fichier des Écritures Comptables"
                            />
                        </LinkButton>
                    </div>

                    <nav
                        className={css({
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        })}
                    >
                        <a href="https://github.com/comptasse/fec" target="_blank" rel="noopener noreferrer">
                            <ButtonGhostContent leftIcon={<IconBrandGithub />} />
                        </a>
                    </nav>
                </div>
            </header>

            <main
                className={css({
                                   minHeight: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "start",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "auto",
                })}
            >
                <Outlet />
            </main>
        </div>
    )
}
