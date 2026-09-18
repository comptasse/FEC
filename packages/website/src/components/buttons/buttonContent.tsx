import type { Icon, IconProps } from "@tabler/icons-react"
import { cloneElement, type ReactElement } from "react"
import { css } from "../../../styled-system/css/css"
import { cx } from "../../../styled-system/css/cx"
import { CircularLoader } from "../layouts/circularLoader.tsx"
import { useButtonLoading } from "./button"

export type ButtonColor = "neutral" | "danger" | "success"

export type ButtonContentProps = {
    color?: ButtonColor
    text?: string
    title?: string
    leftIcon?: ReactElement<IconProps & React.RefAttributes<Icon>>
    rightIcon?: ReactElement<IconProps & React.RefAttributes<Icon>>
    isLoading?: boolean
    isDisabled?: boolean
    isCurrent?: boolean
    className?: string
}

export function useRenderButtonContent(
    props: ButtonContentProps,
    classes: Partial<Record<"container" | "leftIcon" | "text" | "rightIcon", string>>,
) {
    const contextLoading = useButtonLoading()
    const isLoading = props.isLoading ?? contextLoading
    const isDisabled = props.isDisabled || isLoading

    const iconOnlyStyles =
        props.text === undefined
            ? css({
                  width: "auto",
                  justifyContent: "center",
              })
            : ""

    // const activeContainerStyles = props.isActive ? css({ backgroundColor: "neutral/5" }) : ""
    // const activeLeftIconStyles = props.isActive ? css({ color: "primary" }) : ""
    // const activeTextStyles = props.isActive ? css({ color: "primary" }) : ""

    return (
        <div
            title={props.title ?? props.text}
            aria-current={props.isCurrent}
            aria-disabled={isDisabled}
            className={cx(classes.container, iconOnlyStyles, props.className)}
        >
            {isLoading ? (
                <CircularLoader size={16} className={classes.leftIcon} />
            ) : (
                props.leftIcon &&
                cloneElement(props.leftIcon, {
                    "aria-disabled": isDisabled,
                    "aria-current": props.isCurrent,
                    size: 16,
                    className: cx(classes.leftIcon),
                    strokeWidth: 1.75,
                })
            )}

            {props.text && (
                <span aria-disabled={isDisabled} aria-current={props.isCurrent} className={cx(classes.text)}>
                    {props.text}
                </span>
            )}

            {props.rightIcon && (
                <div className={css({ display: "flex", alignItems: "center", justifyContent: "center" })}>
                    {isLoading ? (
                        <CircularLoader size={16 - 4} className={classes.rightIcon} />
                    ) : (
                        cloneElement(props.rightIcon, {
                            "aria-disabled": isDisabled,
                            size: 16 - 4,
                            className: cx(classes.rightIcon, css({ _disabled: { color: "neutral/50" } })),
                            strokeWidth: 1.75,
                        })
                    )}
                </div>
            )}
        </div>
    )
}
