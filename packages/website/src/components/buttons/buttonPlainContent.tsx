import { sva } from "../../../styled-system/css/sva"
import { type ButtonContentProps, useRenderButtonContent } from "./buttonContent"

const plainRecipe = sva({
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
            borderColor: "primary",
            backgroundColor: "primary",
            color: "white",
            stroke: "white",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
            _hover: { backgroundColor: "primary/90" },
            _active: { backgroundColor: "primary/90" },
            _disabled: {
                opacity: 0.5,
                cursor: "not-allowed",
                backgroundColor: "primary",
            },
        },
        leftIcon: {
            minWidth: "1rem",
            width: "1rem",
            minHeight: "1rem",
            height: "1rem",
            flexShrink: 0,
            stroke: "white",
        },
        text: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "0.875rem",
            lineHeight: "1rem",
            fontWeight: "400",
            color: "white",
        },
        rightIcon: {
            minWidth: "1rem",
            width: "1rem",
            minHeight: "1rem",
            height: "1rem",
            stroke: "white/50",
        },
    },
    variants: {
        color: {
            neutral: {},
            danger: {
                container: {
                    backgroundColor: "error",
                    borderColor: "rgba(31, 35, 40, 0.15)",
                    _hover: { backgroundColor: "#c2341f" },
                    _active: { backgroundColor: "#a22015" },
                },
            },
            success: {},
        },
    },
    defaultVariants: {
        color: "neutral",
    },
})

export function ButtonPlainContent(props: ButtonContentProps) {
    const classes = plainRecipe({ color: props.color ?? "neutral" })
    return useRenderButtonContent(props, classes)
}
