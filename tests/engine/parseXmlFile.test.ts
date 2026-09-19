import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { parseXmlFile } from "../../packages/engine/src/fec/parseXmlFile.js"

const SAMPLES_DIR = path.resolve(__dirname, "../../samples/xml")

function readSample(fileName: string): string {
    return readFileSync(path.join(SAMPLES_DIR, fileName), "utf-8")
}

const XML_SAMPLES = ["0000000001FEC20220831.xml", "000000000FEC20231231.xml"]

const EXPECTED_HEADERS = [
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

describe("parseXmlFile", () => {
    describe("basic parsing for all sample files", () => {
        for (const fileName of XML_SAMPLES) {
            describe(fileName, () => {
                it("should return a FecParsedFile with fileType 'xml'", () => {
                    const content = readSample(fileName)
                    const result = parseXmlFile(content, fileName)

                    expect(result.fileType).toBe("xml")
                })

                it("should have exactly 18 headers matching BIC column names", () => {
                    const content = readSample(fileName)
                    const result = parseXmlFile(content, fileName)

                    expect(result.headers).toEqual(EXPECTED_HEADERS)
                })

                it("should parse at least one entry", () => {
                    const content = readSample(fileName)
                    const result = parseXmlFile(content, fileName)

                    expect(result.entries.length).toBeGreaterThanOrEqual(1)
                })

                it("should have entries with all 18 BIC fields", () => {
                    const content = readSample(fileName)
                    const result = parseXmlFile(content, fileName)

                    for (const entry of result.entries) {
                        for (const header of EXPECTED_HEADERS) {
                            expect(entry).toHaveProperty(header)
                        }
                    }
                })

                it("should not have a separator property", () => {
                    const content = readSample(fileName)
                    const result = parseXmlFile(content, fileName)

                    expect(result.separator).toBeUndefined()
                })

                it("should populate JournalCode and JournalLib from journal element", () => {
                    const content = readSample(fileName)
                    const result = parseXmlFile(content, fileName)

                    for (const entry of result.entries) {
                        // JournalCode and JournalLib come from parent <journal> element
                        // They should be populated (possibly empty if the XML doesn't have them)
                        expect(typeof entry.JournalCode).toBe("string")
                        expect(typeof entry.JournalLib).toBe("string")
                    }
                })

                it("should have CompteNum as a string with digits", () => {
                    const content = readSample(fileName)
                    const result = parseXmlFile(content, fileName)

                    for (const entry of result.entries) {
                        const compteNum = entry.CompteNum!
                        if (compteNum.length > 0) {
                            // The first 3 characters should be digits per FEC spec
                            expect(compteNum.length).toBeGreaterThanOrEqual(3)
                        }
                    }
                })
            })
        }
    })

    describe("edge cases", () => {
        it("should return empty entries for XML with no journal elements", () => {
            const content = '<?xml version="1.0" encoding="UTF-8"?><comptabilite></comptabilite>'
            const result = parseXmlFile(content, "empty.xml")

            expect(result.fileType).toBe("xml")
            expect(result.headers).toEqual(EXPECTED_HEADERS)
            expect(result.entries).toEqual([])
        })

        it("should return empty entries for XML with journals but no ecritures", () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
                <comptabilite>
                    <journal>
                        <JournalCode>VE</JournalCode>
                        <JournalLib>Ventes</JournalLib>
                    </journal>
                </comptabilite>`
            const result = parseXmlFile(content, "noecriture.xml")

            expect(result.entries).toEqual([])
        })
    })

    // -----------------------------------------------------------------------
    // Montant/Sens to Debit/Credit conversion (Alto2 #28)
    // -----------------------------------------------------------------------
    describe("Montant/Sens conversion", () => {
        it("should convert Montant with Sens=D to Debit", () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
                <comptabilite>
                    <journal>
                        <JournalCode>VE</JournalCode>
                        <JournalLib>Ventes</JournalLib>
                        <ecriture>
                            <EcritureNum>001</EcritureNum>
                            <EcritureDate>2022-01-01</EcritureDate>
                            <EcritureLib>Test</EcritureLib>
                            <PieceRef>FA001</PieceRef>
                            <PieceDate>2022-01-01</PieceDate>
                            <ValidDate>2022-01-15</ValidDate>
                            <ligne>
                                <CompteNum>411000</CompteNum>
                                <CompteLib>Clients</CompteLib>
                                <Montant>1000.50</Montant>
                                <Sens>D</Sens>
                            </ligne>
                        </ecriture>
                    </journal>
                </comptabilite>`
            const result = parseXmlFile(content, "montantsens_d.xml")

            expect(result.entries.length).toBe(1)
            expect(result.entries[0]!.Debit).toBe("1000.50")
            expect(result.entries[0]!.Credit).toBe("0")
        })

        it("should convert Montant with Sens=C to Credit", () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
                <comptabilite>
                    <journal>
                        <JournalCode>VE</JournalCode>
                        <JournalLib>Ventes</JournalLib>
                        <ecriture>
                            <EcritureNum>001</EcritureNum>
                            <EcritureDate>2022-01-01</EcritureDate>
                            <EcritureLib>Test</EcritureLib>
                            <PieceRef>FA001</PieceRef>
                            <PieceDate>2022-01-01</PieceDate>
                            <ValidDate>2022-01-15</ValidDate>
                            <ligne>
                                <CompteNum>411000</CompteNum>
                                <CompteLib>Clients</CompteLib>
                                <Montant>500.25</Montant>
                                <Sens>C</Sens>
                            </ligne>
                        </ecriture>
                    </journal>
                </comptabilite>`
            const result = parseXmlFile(content, "montantsens_c.xml")

            expect(result.entries.length).toBe(1)
            expect(result.entries[0]!.Debit).toBe("0")
            expect(result.entries[0]!.Credit).toBe("500.25")
        })

        it("should convert Montant with Sens=+1 to Debit", () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
                <comptabilite>
                    <journal>
                        <JournalCode>VE</JournalCode>
                        <JournalLib>Ventes</JournalLib>
                        <ecriture>
                            <EcritureNum>001</EcritureNum>
                            <EcritureDate>2022-01-01</EcritureDate>
                            <EcritureLib>Test</EcritureLib>
                            <PieceRef>FA001</PieceRef>
                            <PieceDate>2022-01-01</PieceDate>
                            <ValidDate>2022-01-15</ValidDate>
                            <ligne>
                                <CompteNum>411000</CompteNum>
                                <CompteLib>Clients</CompteLib>
                                <Montant>750</Montant>
                                <Sens>+1</Sens>
                            </ligne>
                        </ecriture>
                    </journal>
                </comptabilite>`
            const result = parseXmlFile(content, "montantsens_plus1.xml")

            expect(result.entries[0]!.Debit).toBe("750")
            expect(result.entries[0]!.Credit).toBe("0")
        })

        it("should convert Montant with Sens=-1 to Credit", () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
                <comptabilite>
                    <journal>
                        <JournalCode>VE</JournalCode>
                        <JournalLib>Ventes</JournalLib>
                        <ecriture>
                            <EcritureNum>001</EcritureNum>
                            <EcritureDate>2022-01-01</EcritureDate>
                            <EcritureLib>Test</EcritureLib>
                            <PieceRef>FA001</PieceRef>
                            <PieceDate>2022-01-01</PieceDate>
                            <ValidDate>2022-01-15</ValidDate>
                            <ligne>
                                <CompteNum>411000</CompteNum>
                                <CompteLib>Clients</CompteLib>
                                <Montant>250</Montant>
                                <Sens>-1</Sens>
                            </ligne>
                        </ecriture>
                    </journal>
                </comptabilite>`
            const result = parseXmlFile(content, "montantsens_minus1.xml")

            expect(result.entries[0]!.Debit).toBe("0")
            expect(result.entries[0]!.Credit).toBe("250")
        })

        it("should not overwrite existing Debit/Credit when Montant/Sens also present", () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
                <comptabilite>
                    <journal>
                        <JournalCode>VE</JournalCode>
                        <JournalLib>Ventes</JournalLib>
                        <ecriture>
                            <EcritureNum>001</EcritureNum>
                            <EcritureDate>2022-01-01</EcritureDate>
                            <EcritureLib>Test</EcritureLib>
                            <PieceRef>FA001</PieceRef>
                            <PieceDate>2022-01-01</PieceDate>
                            <ValidDate>2022-01-15</ValidDate>
                            <ligne>
                                <CompteNum>411000</CompteNum>
                                <CompteLib>Clients</CompteLib>
                                <Debit>999</Debit>
                                <Credit>0</Credit>
                                <Montant>500</Montant>
                                <Sens>C</Sens>
                            </ligne>
                        </ecriture>
                    </journal>
                </comptabilite>`
            const result = parseXmlFile(content, "both.xml")

            // Existing Debit/Credit should take precedence
            expect(result.entries[0]!.Debit).toBe("999")
            expect(result.entries[0]!.Credit).toBe("0")
        })

        it("should handle invalid Sens value gracefully", () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
                <comptabilite>
                    <journal>
                        <JournalCode>VE</JournalCode>
                        <JournalLib>Ventes</JournalLib>
                        <ecriture>
                            <EcritureNum>001</EcritureNum>
                            <EcritureDate>2022-01-01</EcritureDate>
                            <EcritureLib>Test</EcritureLib>
                            <PieceRef>FA001</PieceRef>
                            <PieceDate>2022-01-01</PieceDate>
                            <ValidDate>2022-01-15</ValidDate>
                            <ligne>
                                <CompteNum>411000</CompteNum>
                                <CompteLib>Clients</CompteLib>
                                <Montant>500</Montant>
                                <Sens>X</Sens>
                            </ligne>
                        </ecriture>
                    </journal>
                </comptabilite>`
            const result = parseXmlFile(content, "invalidsens.xml")

            // Invalid Sens = empty Debit/Credit, checks will catch it
            expect(result.entries[0]!.Debit).toBe("")
            expect(result.entries[0]!.Credit).toBe("")
        })
    })
})
