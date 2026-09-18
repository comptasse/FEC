import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import type { FecValidationResult } from "../../packages/engine/src/fec/types.js"
import { validateFecFile } from "../../packages/engine/src/fec/validate.js"

const TXT_SAMPLES_DIR = path.resolve(__dirname, "../../samples/txt")
const XML_SAMPLES_DIR = path.resolve(__dirname, "../../samples/xml")

function readTxtSample(fileName: string): string {
    return readFileSync(path.join(TXT_SAMPLES_DIR, fileName), "utf-8")
}

function readXmlSample(fileName: string): string {
    return readFileSync(path.join(XML_SAMPLES_DIR, fileName), "utf-8")
}

function hasError(result: FecValidationResult, id: string): boolean {
    return result.checks.some((c) => c.id === id && c.severity === "error")
}

// ---------------------------------------------------------------------------
// Flat file samples
// ---------------------------------------------------------------------------

const FLAT_SAMPLES = [
    "0000000001FEC20220831.txt", // 10-digit SIREN => invalid filename
    "000000000FEC20231231.txt", // 9-digit SIREN, valid format
    "111111111FEC20221231.TXT", // valid format, uppercase extension
    "123456789FEC20500930.txt", // valid format, future date
]

const XML_SAMPLES = ["0000000001FEC20220831.xml", "000000000FEC20231231.xml"]

describe("validateFecFile", () => {
    // -----------------------------------------------------------------------
    // Structure: every result must have the expected shape
    // -----------------------------------------------------------------------
    describe("result structure", () => {
        for (const fileName of FLAT_SAMPLES) {
            it(`flat file ${fileName} should return a valid FecValidationResult`, () => {
                const content = readTxtSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(result).toHaveProperty("fileName", fileName)
                expect(result).toHaveProperty("fileType", "flat")
                expect(result).toHaveProperty("checks")
                expect(result).toHaveProperty("summary")
                expect(Array.isArray(result.checks)).toBe(true)
                expect(result.summary).toHaveProperty("errors")
                expect(result.summary).toHaveProperty("warnings")
                expect(result.summary).toHaveProperty("total")
                expect(result.summary).toHaveProperty("lines")
                expect(typeof result.summary.errors).toBe("number")
                expect(typeof result.summary.warnings).toBe("number")
                expect(typeof result.summary.total).toBe("number")
                expect(typeof result.summary.lines).toBe("number")
            })
        }

        for (const fileName of XML_SAMPLES) {
            it(`XML file ${fileName} should return a valid FecValidationResult`, () => {
                const content = readXmlSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(result).toHaveProperty("fileName", fileName)
                expect(result).toHaveProperty("fileType", "xml")
                expect(result).toHaveProperty("checks")
                expect(result).toHaveProperty("summary")
                expect(Array.isArray(result.checks)).toBe(true)
            })
        }
    })

    // -----------------------------------------------------------------------
    // Summary consistency
    // -----------------------------------------------------------------------
    describe("summary consistency", () => {
        const allSamples = [
            ...FLAT_SAMPLES.map((f) => ({ name: f, reader: readTxtSample })),
            ...XML_SAMPLES.map((f) => ({ name: f, reader: readXmlSample })),
        ]

        for (const { name, reader } of allSamples) {
            it(`${name}: summary.total should equal checks.length`, () => {
                const content = reader(name)
                const result = validateFecFile(content, name)

                expect(result.summary.total).toBe(result.checks.length)
            })

            it(`${name}: summary.errors should equal error check count`, () => {
                const content = reader(name)
                const result = validateFecFile(content, name)

                const errorCount = result.checks.filter((c) => c.severity === "error").length
                expect(result.summary.errors).toBe(errorCount)
            })

            it(`${name}: summary.warnings should equal warning check count`, () => {
                const content = reader(name)
                const result = validateFecFile(content, name)

                const warningCount = result.checks.filter((c) => c.severity === "warning").length
                expect(result.summary.warnings).toBe(warningCount)
            })

            it(`${name}: summary.lines should be >= 0`, () => {
                const content = reader(name)
                const result = validateFecFile(content, name)

                expect(result.summary.lines).toBeGreaterThanOrEqual(0)
            })
        }
    })

    // -----------------------------------------------------------------------
    // Check result shape
    // -----------------------------------------------------------------------
    describe("individual check result shape", () => {
        it("each check should have id, severity, and message", () => {
            const content = readTxtSample(FLAT_SAMPLES[0]!)
            const result = validateFecFile(content, FLAT_SAMPLES[0]!)

            for (const check of result.checks) {
                expect(check).toHaveProperty("id")
                expect(check).toHaveProperty("severity")
                expect(check).toHaveProperty("message")
                expect(typeof check.id).toBe("string")
                expect(["error", "warning"]).toContain(check.severity)
                expect(typeof check.message).toBe("string")
                expect(check.message.length).toBeGreaterThan(0)
            }
        })

        it("checks with a line number should have a positive integer", () => {
            const content = readTxtSample(FLAT_SAMPLES[0]!)
            const result = validateFecFile(content, FLAT_SAMPLES[0]!)

            for (const check of result.checks) {
                if (check.line !== undefined) {
                    expect(check.line).toBeGreaterThanOrEqual(2) // 1-based, data starts at line 2
                    expect(Number.isInteger(check.line)).toBe(true)
                }
            }
        })
    })

    // -----------------------------------------------------------------------
    // FILE_NAME check
    // -----------------------------------------------------------------------
    describe("FILE_NAME check", () => {
        it("0000000001FEC20220831.txt should have FILE_NAME error (10-digit SIREN)", () => {
            const content = readTxtSample("0000000001FEC20220831.txt")
            const result = validateFecFile(content, "0000000001FEC20220831.txt")

            expect(hasError(result, "FILE_NAME")).toBe(true)
        })

        it("000000000FEC20231231.txt should NOT have FILE_NAME error (valid 9-digit SIREN)", () => {
            const content = readTxtSample("000000000FEC20231231.txt")
            const result = validateFecFile(content, "000000000FEC20231231.txt")

            expect(hasError(result, "FILE_NAME")).toBe(false)
        })

        it("111111111FEC20221231.TXT should NOT have FILE_NAME error (valid format)", () => {
            const content = readTxtSample("111111111FEC20221231.TXT")
            const result = validateFecFile(content, "111111111FEC20221231.TXT")

            expect(hasError(result, "FILE_NAME")).toBe(false)
        })

        it("123456789FEC20500930.txt should NOT have FILE_NAME error (valid format, future date)", () => {
            const content = readTxtSample("123456789FEC20500930.txt")
            const result = validateFecFile(content, "123456789FEC20500930.txt")

            expect(hasError(result, "FILE_NAME")).toBe(false)
        })

        it("0000000001FEC20220831.xml should have FILE_NAME error (10-digit SIREN)", () => {
            const content = readXmlSample("0000000001FEC20220831.xml")
            const result = validateFecFile(content, "0000000001FEC20220831.xml")

            expect(hasError(result, "FILE_NAME")).toBe(true)
        })

        it("000000000FEC20231231.xml should NOT have FILE_NAME error (valid 9-digit SIREN)", () => {
            const content = readXmlSample("000000000FEC20231231.xml")
            const result = validateFecFile(content, "000000000FEC20231231.xml")

            expect(hasError(result, "FILE_NAME")).toBe(false)
        })
    })

    // -----------------------------------------------------------------------
    // File type detection
    // -----------------------------------------------------------------------
    describe("file type detection", () => {
        for (const fileName of FLAT_SAMPLES) {
            it(`${fileName} should be detected as 'flat'`, () => {
                const content = readTxtSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(result.fileType).toBe("flat")
            })
        }

        for (const fileName of XML_SAMPLES) {
            it(`${fileName} should be detected as 'xml'`, () => {
                const content = readXmlSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(result.fileType).toBe("xml")
            })
        }
    })

    // -----------------------------------------------------------------------
    // Flat-file specific checks
    // -----------------------------------------------------------------------
    describe("flat-file specific checks", () => {
        for (const fileName of FLAT_SAMPLES) {
            it(`${fileName}: should not have SEPARATOR errors (valid separator)`, () => {
                const content = readTxtSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(hasError(result, "SEPARATOR")).toBe(false)
            })

            it(`${fileName}: should not have EMPTY_FILE error`, () => {
                const content = readTxtSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(hasError(result, "EMPTY_FILE")).toBe(false)
            })

            it(`${fileName}: should not have HEADER_PRESENCE error`, () => {
                const content = readTxtSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(hasError(result, "HEADER_PRESENCE")).toBe(false)
            })

            it(`${fileName}: should not have COLUMN_COUNT error`, () => {
                const content = readTxtSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(hasError(result, "COLUMN_COUNT")).toBe(false)
            })
        }
    })

    // -----------------------------------------------------------------------
    // XML-specific checks
    // -----------------------------------------------------------------------
    describe("xml-specific checks", () => {
        for (const fileName of XML_SAMPLES) {
            it(`${fileName}: should not have EMPTY_FILE error`, () => {
                const content = readXmlSample(fileName)
                const result = validateFecFile(content, fileName)

                expect(hasError(result, "EMPTY_FILE")).toBe(false)
            })

            it(`${fileName}: should not have DEBIT_CREDIT error (has Debit and Credit fields)`, () => {
                const content = readXmlSample(fileName)
                const result = validateFecFile(content, fileName)

                // XML files should have Debit/Credit in headers
                expect(hasError(result, "DEBIT_CREDIT")).toBe(false)
            })
        }
    })

    // -----------------------------------------------------------------------
    // Cross-format consistency
    // -----------------------------------------------------------------------
    describe("cross-format consistency for matching samples", () => {
        // 0000000001FEC20220831 and 000000000FEC20231231 exist in both formats
        const pairs = [
            { txt: "0000000001FEC20220831.txt", xml: "0000000001FEC20220831.xml" },
            { txt: "000000000FEC20231231.txt", xml: "000000000FEC20231231.xml" },
        ]

        for (const { txt, xml } of pairs) {
            it(`${txt} and ${xml} should produce the same number of parsed lines`, () => {
                const txtContent = readTxtSample(txt)
                const xmlContent = readXmlSample(xml)

                const txtResult = validateFecFile(txtContent, txt)
                const xmlResult = validateFecFile(xmlContent, xml)

                expect(txtResult.summary.lines).toBe(xmlResult.summary.lines)
            })
        }
    })
})
