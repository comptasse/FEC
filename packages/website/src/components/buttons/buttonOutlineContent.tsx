import { sva } from "../../../styled-system/css/sva"
import { type ButtonContentProps, useRenderButtonContent } from "./buttonContent"

const outlineRecipe = sva({
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
            border: "1px solid",
            borderColor: "neutral/20",
            backgroundColor: "transparent",
            boxShadow: "inset 0 1px 0 rgba(87, 87, 87, 0.05)",
            _hover: { backgroundColor: "neutral/5", borderColor: "neutral/30" },
            _active: { backgroundColor: "neutral/10" },
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
            stroke: "neutral",
        },
        text: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "0.875rem",
            lineHeight: "1rem",
            fontWeight: "400",
            color: "neutral",
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
            neutral: {},
            danger: {
                container: {
                    borderColor: "error/40",
                    _hover: { backgroundColor: "error/5", borderColor: "error/50" },
                },
                leftIcon: { stroke: "error" },
                text: { color: "error" },
                rightIcon: { stroke: "error/50" },
            },
            success: {
                container: {
                    borderColor: "success/40",
                    _hover: { backgroundColor: "success/5", borderColor: "success/50" },
                },
                leftIcon: { stroke: "success" },
                text: { color: "success" },
                rightIcon: { stroke: "success/50" },
            },
        },
    },
    defaultVariants: {
        color: "neutral",
    },
})

export function ButtonOutlineContent(props: ButtonContentProps) {
    const classes = outlineRecipe({ color: props.color ?? "neutral" })
    return useRenderButtonContent(props, classes)
}
