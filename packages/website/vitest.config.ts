import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    resolve: {
        alias: {
            src: path.resolve(import.meta.dirname, "./src"),
        },
    },
    test: {
        include: ["../../tests/website/**/*.test.ts"],
        passWithNoTests: true,
        globals: true,
        testTimeout: 10000,
        environment: "node",
    },
})
