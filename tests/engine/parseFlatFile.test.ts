import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { parseFlatFile } from "../../packages/engine/src/fec/parseFlatFile.js"

const SAMPLES_DIR = path.resolve(__dirname, "../../samples/txt")

function readSample(fileName: string): string {
    return readFileSync(path.join(SAMPLES_DIR, fileName), "utf-8")
}

// Available flat sample files
const FLAT_SAMPLES = [
    "0000000001FEC20220831.txt",
    "000000000FEC20231231.txt",
    "111111111FEC20221231.TXT",
    "123456789FEC20500930.txt",
]

describe("parseFlatFile", () => {
    describe("basic parsing for all sample files", () => {
        for (const fileName of FLAT_SAMPLES) {
            describe(fileName, () => {
                it("should return a FecParsedFile with fileType 'flat'", () => {
                    const content = readSample(fileName)
                    const result = parseFlatFile(content, fileName)

                    expect(result.fileType).toBe("flat")
                })

                it("should detect a valid separator (tab or pipe)", () => {
                    const content = readSample(fileName)
                    const result = parseFlatFile(content, fileName)

                    expect(["\t", "|"]).toContain(result.separator)
                })

                it("should parse headers as a non-empty array", () => {
                    const content = readSample(fileName)
                    const result = parseFlatFile(content, fileName)

                    expect(result.headers).toBeInstanceOf(Array)
                    expect(result.headers.length).toBeGreaterThanOrEqual(1)
                })

                it("should have at least 18 columns in the header", () => {
                    const content = readSample(fileName)
                    const result = parseFlatFile(content, fileName)

                    expect(result.headers.length).toBeGreaterThanOrEqual(18)
                })

                it("should parse at least one data entry", () => {
                    const content = readSample(fileName)
                    const result = parseFlatFile(content, fileName)

                    expect(result.entries.length).toBeGreaterThanOrEqual(1)
                })

                it("should have entries with keys matching headers", () => {
                    const content = readSample(fileName)
                    const result = parseFlatFile(content, fileName)

                    if (result.entries.length > 0) {
                        const firstEntry = result.entries[0]!
                        for (const header of result.headers) {
                            expect(firstEntry).toHaveProperty(header)
                        }
                    }
                })
            })
        }
    })

    describe("standard BIC column names", () => {
        const EXPECTED_COLUMNS = [
            "JournalCode",
            "JournalLib",
            "EcritureNum",
            "EcritureDate",
            "CompteNum",
            "CompteLib",
            "CompAuxNum",
            "CompAuxLib",
            "PieceRef",
            "PieceDate",
            "EcritureLib",
            "Debit",
            "Credit",
            "EcritureLet",
            "DateLet",
            "ValidDate",
            "Montantdevise",
            "Idevise",
        ]

        for (const fileName of FLAT_SAMPLES) {
            it(`${fileName} should contain the 18 BIC columns in order`, () => {
                const content = readSample(fileName)
                const result = parseFlatFile(content, fileName)

                for (let i = 0; i < EXPECTED_COLUMNS.length; i++) {
                    expect(result.headers[i]?.toLowerCase()).toBe(EXPECTED_COLUMNS[i]!.toLowerCase())
                }
            })
        }
    })

    describe("edge cases", () => {
        it("should return an empty result for an empty string", () => {
            const result = parseFlatFile("", "empty.txt")

            expect(result.fileType).toBe("flat")
            expect(result.headers).toEqual([])
            expect(result.entries).toEqual([])
        })

        it("should return headers but no entries for a header-only file", () => {
            const headerLine = "JournalCode\tJournalLib\tEcritureNum\tEcritureDate\tCompteNum"
            const result = parseFlatFile(headerLine, "headeronly.txt")

            expect(result.headers.length).toBe(5)
            expect(result.entries).toEqual([])
        })

        it("should handle trailing empty lines", () => {
            const content = "A\tB\tC\tD\tE\n1\t2\t3\t4\t5\n\n\n"
            const result = parseFlatFile(content, "trailing.txt")

            expect(result.entries.length).toBe(1)
        })

        it("should handle pipe-separated files", () => {
            const content = "A|B|C|D|E\n1|2|3|4|5"
            const result = parseFlatFile(content, "pipe.txt")

            expect(result.separator).toBe("|")
            expect(result.headers).toEqual(["A", "B", "C", "D", "E"])
            expect(result.entries.length).toBe(1)
        })

        it("should trim header and value whitespace", () => {
            const content = " A \t B \t C \t D \t E \n 1 \t 2 \t 3 \t 4 \t 5 "
            const result = parseFlatFile(content, "whitespace.txt")

            expect(result.headers[0]).toBe("A")
            expect(result.entries[0]!.A).toBe("1")
        })
    })

    // -----------------------------------------------------------------------
    // Line issue tracking (Alto2 #12 empty lines, #13 field count mismatch)
    // -----------------------------------------------------------------------
    describe("line issue tracking", () => {
        it("should have lineIssues array for valid files", () => {
            for (const fileName of FLAT_SAMPLES) {
                const content = readSample(fileName)
                const result = parseFlatFile(content, fileName)

                expect(result.lineIssues).toBeInstanceOf(Array)
            }
        })

        it("should track empty lines within file data", () => {
            const content = "A\tB\tC\tD\tE\n1\t2\t3\t4\t5\n\n6\t7\t8\t9\t10"
            const result = parseFlatFile(content, "emptyline.txt")

            expect(result.entries.length).toBe(2) // empty line skipped for entries
            expect(result.lineIssues!.length).toBe(1)
            expect(result.lineIssues![0]!.kind).toBe("empty")
            expect(result.lineIssues![0]!.line).toBe(3) // 1-based line number
        })

        it("should track field count mismatch when line has fewer fields", () => {
            const content = "A\tB\tC\tD\tE\n1\t2\t3"
            const result = parseFlatFile(content, "fewerfields.txt")

            expect(result.entries.length).toBe(1) // still parsed
            expect(result.lineIssues!.length).toBe(1)
            expect(result.lineIssues![0]!.kind).toBe("field_count_mismatch")
            expect(result.lineIssues![0]!.expectedFields).toBe(5)
            expect(result.lineIssues![0]!.actualFields).toBe(3)
        })

        it("should track field count mismatch when line has more fields", () => {
            const content = "A\tB\tC\tD\tE\n1\t2\t3\t4\t5\t6\t7"
            const result = parseFlatFile(content, "morefields.txt")

            expect(result.lineIssues!.length).toBe(1)
            expect(result.lineIssues![0]!.kind).toBe("field_count_mismatch")
            expect(result.lineIssues![0]!.expectedFields).toBe(5)
            expect(result.lineIssues![0]!.actualFields).toBe(7)
        })

        it("should track both empty lines and field count mismatches", () => {
            const content = "A\tB\tC\n1\t2\t3\n\n4\t5"
            const result = parseFlatFile(content, "mixed.txt")

            expect(result.lineIssues!.length).toBe(2)
            const kinds = result.lineIssues!.map((i) => i.kind)
            expect(kinds).toContain("empty")
            expect(kinds).toContain("field_count_mismatch")
        })

        it("should have no line issues for well-formed files", () => {
            const content = "A\tB\tC\tD\tE\n1\t2\t3\t4\t5\n6\t7\t8\t9\t10"
            const result = parseFlatFile(content, "wellformed.txt")

            expect(result.lineIssues).toEqual([])
        })

        it("should have lineIssues for empty file", () => {
            const result = parseFlatFile("", "empty.txt")
            expect(result.lineIssues).toEqual([])
        })

        it("sample files should have no field count mismatches", () => {
            for (const fileName of FLAT_SAMPLES) {
                const content = readSample(fileName)
                const result = parseFlatFile(content, fileName)
                const mismatches = result.lineIssues!.filter((i) => i.kind === "field_count_mismatch")
                expect(mismatches).toEqual([])
            }
        })
    })
})
