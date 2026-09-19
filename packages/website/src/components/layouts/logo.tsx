import type { ComponentProps } from "react"
import { css } from "../../../styled-system/css/css"
import { cx } from "../../../styled-system/css/cx"
import { token } from "../../../styled-system/tokens/index"

export function Logo(props: { size?: number; className?: ComponentProps<"svg">["className"] }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={props.size ?? 24}
            height={props.size ?? 24}
            viewBox="0 0 24 24"
            fill="none"
            color={token("colors.primary")}
            strokeLinecap="round"
            className={cx(
                css({
                    padding: "0.125rem",
                }),
                props.className,
            )}
        >
            <g opacity=".2" fill="currentColor" stroke="none">
                <rect x="0" y="0" width="11" height="6" rx="2" />
                <rect x="13" y="0" width="11" height="6" rx="2" />
            </g>

            <g opacity=".5" fill="currentColor" stroke="none">
                <rect x="0" y="9" width="7" height="6" rx="2" />
                <rect x="9" y="9" width="15" height="6" rx="2" />
            </g>

            <g opacity="1" fill="currentColor" stroke="none">
                <rect x="0" y="18" width="17" height="6" rx="2" />
                <rect x="19" y="18" width="5" height="6" rx="2" />
            </g>
        </svg>
    )
}
