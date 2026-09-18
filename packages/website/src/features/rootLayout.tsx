import { Outlet } from "@tanstack/react-router"
import { css } from "../../styled-system/css/css"

export function RootLayout() {
    return (
        <div
            className={css({
                position: "relative",
                minHeight: "100dvh",
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                alignItems: "start",
                overflowX: "hidden",
                overflowY: "auto",
            })}
        >
            <Outlet />
        </div>
    )
}
