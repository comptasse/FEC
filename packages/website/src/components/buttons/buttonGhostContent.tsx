import { sva } from "../../../styled-system/css/sva"
import { type ButtonContentProps, useRenderButtonContent } from "./buttonContent"

const ghostRecipe = sva({
    slots: ["container", "leftIcon", "text", "rightIcon"],
    base: {
        container: {
            width: "fit-content",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem",
            borderRadius: "md",
            boxSizing: "border-box",
            cursor: "pointer",
            transition: "all",
            transitionDuration: "200ms",
            transitionTimingFunction: "ease-in-out",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "transparent",
            backgroundColor: "transparent",
            _hover: { backgroundColor: "neutral/5" },
            _current: { backgroundColor: "primary/5" },
            _disabled: {
                opacity: 0.5,
                cursor: "not-allowed",
            },
        },
        leftIcon: {
            minWidth: "1rem",
            width: "1rem",
            minHeight: "1rem",
            height: "1rem",
            flexShrink: 0,
            stroke: "neutral/70",
            _disabled: { stroke: "neutral/50" },
            _current: { stroke: "primary" },
        },
        text: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "0.875rem",
            lineHeight: "1rem",
            fontWeight: "400",
            color: "neutral",
            _disabled: { color: "neutral/50" },
            _current: { color: "primary" },
        },
        rightIcon: {
            minWidth: "1rem",
            width: "1rem",
            minHeight: "1rem",
            height: "1rem",
            stroke: "neutral/50",
        },
    },
    variants: {
        color: {
            neutral: {
                container: {},
            },
            danger: {
                container: {
                    _hover: {
                        backgroundColor: "error/5",
                        _disabled: { backgroundColor: "transparent" },
                    },
                },
                leftIcon: { stroke: "error", _disabled: { stroke: "neutral/50" } },
                text: { color: "error", _disabled: { color: "neutral/50" } },
            },
            success: {
                container: {
                    _hover: { backgroundColor: "success/8" },
                },
                leftIcon: { stroke: "success", _disabled: { stroke: "neutral/50" } },
                text: { color: "success", _disabled: { color: "neutral/50" } },
            },
        },
    },
    defaultVariants: {
        color: "neutral",
    },
})

export function ButtonGhostContent(props: ButtonContentProps) {
    const classes = ghostRecipe({ color: props.color ?? "neutral" })
    return useRenderButtonContent(props, classes)
}
