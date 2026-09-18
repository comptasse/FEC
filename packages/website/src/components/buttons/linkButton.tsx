import { Link, type LinkOptions } from "@tanstack/react-router"
import type { ComponentProps, MouseEventHandler, ReactNode } from "react"
import { css } from "../../../styled-system/css/css"
import { cx } from "../../../styled-system/css/cx"

/**
 * LinkButton - a neutral container wrapping TanStack Router's Link
 * Use with composition pattern (children)
 *
 * @example
 * <LinkButton to="/dashboard">
 *   <ButtonPlainContent text="Go to Dashboard" leftIcon={<IconHome />} />
 * </LinkButton>
 */
export function LinkButton(props: {
    to: LinkOptions["to"]
    params?: LinkOptions["params"]
    hash?: string
    target?: ComponentProps<typeof Link>["target"]
    rel?: ComponentProps<typeof Link>["rel"]
    title?: string
    disabled?: boolean
    className?: string
    onClick?: MouseEventHandler<HTMLAnchorElement> | undefined
    children: ReactNode
}) {
    return (
        <Link
            to={props.to}
            params={props.params}
            hash={props.hash}
            target={props.target}
            rel={props.rel}
            className={cx(
                css({
                    // display: "flex",
                    // justifyContent: "flex-start",
                    // alignItems: "center",
                    width: "fit-content",
                    maxWidth: "100%",
                    _disabled: { cursor: "not-allowed", pointerEvents: "none" },
                }),
                props.className,
            )}
            aria-disabled={props.disabled}
            title={props.title}
            onClick={props.onClick}
        >
            {props.children}
        </Link>
    )
}
