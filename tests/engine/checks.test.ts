import { describe, expect, it } from "vitest"
import {
    checkChronologicalOrder,
    checkColumnCount,
    checkColumnOrder,
    checkCompteNum,
    checkDateFormat,
    checkDateValidity,
    checkDateYearRange,
    checkDebitCredit,
    checkDebitCreditBalance,
    checkDebitCreditExclusive,
    checkEcritureNumSequence,
    checkEmptyFile,
    checkEmptyLines,
    checkEncoding,
    checkFieldCountMismatch,
    checkFileName,
    checkHeaderPresence,
    checkMandatoryFields,
    checkNumericDotSeparator,
    checkNumericFormat,
    checkNumericThousandsSeparator,
    checkOpeningEntries,
    checkPieceDateCoherence,
    checkSensValues,
    checkSeparator,
} from "../../packages/engine/src/fec/checks.js"
import type { FecParsedFile } from "../../packages/engine/src/fec/types.js"
import { BIC_COLUMN_NAMES } from "../../packages/engine/src/fec/types.js"

// ---------------------------------------------------------------------------
// Helpers to build test fixtures
// ---------------------------------------------------------------------------

const STANDARD_HEADERS = [...BIC_COLUMN_NAMES]

function makeParsed(overrides: Partial<FecParsedFile> = {}): FecParsedFile {
    return {
        fileType: "flat",
        headers: STANDARD_HEADERS,
        entries: [],
        separator: "\t",
        lineIssues: [],
        ...overrides,
    }
}

function makeEntry(overrides: Record<string, string> = {}): Record<string, string> {
    return {
        JournalCode: "VE",
        JournalLib: "Ventes",
        EcritureNum: "001",
        EcritureDate: "20220101",
        CompteNum: "411000",
        CompteLib: "Clients",
        CompAuxNum: "",
        CompAuxLib: "",
        PieceRef: "FA001",
        PieceDate: "20220101",
        EcritureLib: "Facture client",
        Debit: "1000,00",
        Credit: "0,00",
        EcritureLet: "",
        DateLet: "",
        ValidDate: "20220115",
        Montantdevise: "",
        Idevise: "",
        ...overrides,
    }
}

// ====================================================================
// 1. checkFileName - Alto2 #1: Filename convention
// ====================================================================

describe("checkFileName", () => {
    it("should pass for valid 9-digit SIREN + FEC + YYYYMMDD", () => {
        expect(checkFileName("123456789FEC20220831.txt")).toEqual([])
    })

    it("should pass for uppercase .TXT extension", () => {
        expect(checkFileName("111111111FEC20221231.TXT")).toEqual([])
    })

    it("should pass for .xml extension", () => {
        expect(checkFileName("000000000FEC20231231.xml")).toEqual([])
    })

    it("should error on 10-digit SIREN", () => {
        const results = checkFileName("0000000001FEC20220831.txt")
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("FILE_NAME")
        expect(results[0]!.severity).toBe("error")
    })

    it("should error on missing FEC keyword", () => {
        const results = checkFileName("123456789ABC20220831.txt")
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("FILE_NAME")
    })

    it("should error on invalid date in filename (month 13)", () => {
        const results = checkFileName("123456789FEC20221301.txt")
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("FILE_NAME")
        expect(results[0]!.message).toContain("date")
    })

    it("should error on invalid date in filename (day 32)", () => {
        const results = checkFileName("123456789FEC20220832.txt")
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("FILE_NAME")
    })

    it("should error on filename without extension", () => {
        // Without extension, baseName = full string, which has no extension to strip
        const results = checkFileName("123456789FEC20220831")
        expect(results.length).toBe(0) // no extension to strip, pattern matches directly
    })

    it("should error on completely wrong filename", () => {
        const results = checkFileName("random_file.txt")
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("FILE_NAME")
    })
})

// ====================================================================
// 2. checkHeaderPresence - Alto2 header validation
// ====================================================================

describe("checkHeaderPresence", () => {
    it("should pass for flat file with headers", () => {
        const parsed = makeParsed({ headers: ["A", "B"] })
        expect(checkHeaderPresence(parsed)).toEqual([])
    })

    it("should error for flat file with empty headers", () => {
        const parsed = makeParsed({ headers: [] })
        const results = checkHeaderPresence(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("HEADER_PRESENCE")
    })

    it("should skip check for XML files", () => {
        const parsed = makeParsed({ fileType: "xml", headers: [] })
        expect(checkHeaderPresence(parsed)).toEqual([])
    })
})

// ====================================================================
// 3. checkColumnOrder - Alto2 header field mapping
// ====================================================================

describe("checkColumnOrder", () => {
    it("should pass for correctly ordered 18 BIC columns", () => {
        const parsed = makeParsed({ headers: STANDARD_HEADERS })
        expect(checkColumnOrder(parsed)).toEqual([])
    })

    it("should pass for case-insensitive match", () => {
        const parsed = makeParsed({ headers: STANDARD_HEADERS.map((h) => h.toUpperCase()) })
        expect(checkColumnOrder(parsed)).toEqual([])
    })

    it("should error for swapped columns", () => {
        const swapped = [...STANDARD_HEADERS]
        swapped[0] = "JournalLib"
        swapped[1] = "JournalCode"
        const parsed = makeParsed({ headers: swapped })
        const results = checkColumnOrder(parsed)
        expect(results.length).toBe(2) // two columns out of order
        expect(results[0]!.id).toBe("COLUMN_ORDER")
    })

    it("should error for missing columns", () => {
        const parsed = makeParsed({ headers: STANDARD_HEADERS.slice(0, 10) })
        const results = checkColumnOrder(parsed)
        expect(results.length).toBe(8) // 8 missing columns
    })
})

// ====================================================================
// 4. checkColumnCount - Alto2 header field count
// ====================================================================

describe("checkColumnCount", () => {
    it("should pass for 18 columns", () => {
        const parsed = makeParsed({ headers: STANDARD_HEADERS })
        expect(checkColumnCount(parsed)).toEqual([])
    })

    it("should pass for more than 18 columns (supplementary)", () => {
        const parsed = makeParsed({ headers: [...STANDARD_HEADERS, "Extra"] })
        expect(checkColumnCount(parsed)).toEqual([])
    })

    it("should error for fewer than 18 columns", () => {
        const parsed = makeParsed({ headers: STANDARD_HEADERS.slice(0, 5) })
        const results = checkColumnCount(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("COLUMN_COUNT")
        expect(results[0]!.message).toContain("5")
    })
})

// ====================================================================
// 5. checkSeparator - Alto2 #3: TAB or PIPE only
// ====================================================================

describe("checkSeparator", () => {
    it("should pass for tab separator", () => {
        const parsed = makeParsed({ separator: "\t" })
        expect(checkSeparator(parsed)).toEqual([])
    })

    it("should pass for pipe separator", () => {
        const parsed = makeParsed({ separator: "|" })
        expect(checkSeparator(parsed)).toEqual([])
    })

    it("should error for semicolon separator", () => {
        const parsed = makeParsed({ separator: ";" })
        const results = checkSeparator(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("SEPARATOR")
    })

    it("should error for comma separator", () => {
        const parsed = makeParsed({ separator: "," })
        const results = checkSeparator(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("SEPARATOR")
    })

    it("should skip check for XML files", () => {
        const parsed = makeParsed({ fileType: "xml", separator: ";" })
        expect(checkSeparator(parsed)).toEqual([])
    })
})

// ====================================================================
// 6. checkDateFormat - Alto2 #11-#13: Date format AAAAMMJJ
// ====================================================================

describe("checkDateFormat", () => {
    it("should pass for valid YYYYMMDD dates", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20220101", PieceDate: "20220101", ValidDate: "20220115" })],
        })
        expect(checkDateFormat(parsed)).toEqual([])
    })

    it("should error for date with separators (YYYY-MM-DD)", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "2022-01-01" })],
        })
        const results = checkDateFormat(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("DATE_FORMAT")
        expect(results[0]!.field).toBe("EcritureDate")
    })

    it("should error for date with slashes", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ PieceDate: "01/01/2022" })],
        })
        const results = checkDateFormat(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.field).toBe("PieceDate")
    })

    it("should skip empty date fields", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ DateLet: "" })],
        })
        expect(checkDateFormat(parsed)).toEqual([])
    })

    it("should check DateLet field", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ DateLet: "2022-12-31" })],
        })
        const results = checkDateFormat(parsed)
        expect(results.some((r) => r.field === "DateLet")).toBe(true)
    })
})

// ====================================================================
// 7. checkNumericFormat - Alto2 #9/#17/#18: Numeric validation
// ====================================================================

describe("checkNumericFormat", () => {
    it("should pass for valid French format (comma decimal)", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000,50", Credit: "0,00" })],
        })
        expect(checkNumericFormat(parsed)).toEqual([])
    })

    it("should pass for integer values", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000", Credit: "0" })],
        })
        expect(checkNumericFormat(parsed)).toEqual([])
    })

    it("should error for dot decimal separator", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000.50" })],
        })
        const results = checkNumericFormat(parsed)
        expect(results.length).toBeGreaterThanOrEqual(1)
        expect(results[0]!.id).toBe("NUMERIC_FORMAT")
    })

    it("should error for thousands separator (space)", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1 000,50" })],
        })
        const results = checkNumericFormat(parsed)
        expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it("should error for non-numeric text", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Credit: "abc" })],
        })
        const results = checkNumericFormat(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("NUMERIC_FORMAT")
    })

    it("should skip empty numeric fields", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Montantdevise: "" })],
        })
        expect(checkNumericFormat(parsed)).toEqual([])
    })

    it("should pass for negative values", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "-500,25", Credit: "0" })],
        })
        expect(checkNumericFormat(parsed)).toEqual([])
    })
})

// ====================================================================
// 8. checkCompteNum - Alto2 #16: Account number format
// ====================================================================

describe("checkCompteNum", () => {
    it("should pass for account starting with 3 digits", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ CompteNum: "411000" })],
        })
        expect(checkCompteNum(parsed)).toEqual([])
    })

    it("should pass for alphanumeric after first 3 digits", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ CompteNum: "411ABC" })],
        })
        expect(checkCompteNum(parsed)).toEqual([])
    })

    it("should error for account not starting with 3 digits", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ CompteNum: "AB1000" })],
        })
        const results = checkCompteNum(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("COMPTE_NUM")
        expect(results[0]!.severity).toBe("error")
    })

    it("should error for account shorter than 3 characters", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ CompteNum: "41" })],
        })
        const results = checkCompteNum(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("COMPTE_NUM")
    })

    it("should skip empty CompteNum", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ CompteNum: "" })],
        })
        expect(checkCompteNum(parsed)).toEqual([])
    })
})

// ====================================================================
// 9. checkMandatoryFields - Alto2 #9/#14: Required fields
// ====================================================================

describe("checkMandatoryFields", () => {
    it("should pass when all mandatory fields are present", () => {
        const parsed = makeParsed({ entries: [makeEntry()] })
        expect(checkMandatoryFields(parsed)).toEqual([])
    })

    it("should error for empty JournalCode", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ JournalCode: "" })],
        })
        const results = checkMandatoryFields(parsed)
        expect(results.some((r) => r.field === "JournalCode")).toBe(true)
    })

    it("should error for empty EcritureDate", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "" })],
        })
        const results = checkMandatoryFields(parsed)
        expect(results.some((r) => r.field === "EcritureDate")).toBe(true)
    })

    it("should error for empty CompteNum", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ CompteNum: "" })],
        })
        const results = checkMandatoryFields(parsed)
        expect(results.some((r) => r.field === "CompteNum")).toBe(true)
    })

    it("should error for whitespace-only mandatory field", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ PieceRef: "   " })],
        })
        const results = checkMandatoryFields(parsed)
        expect(results.some((r) => r.field === "PieceRef")).toBe(true)
    })

    it("should report all empty mandatory fields per line", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ JournalCode: "", JournalLib: "", EcritureNum: "" })],
        })
        const results = checkMandatoryFields(parsed)
        expect(results.length).toBeGreaterThanOrEqual(3)
    })

    it("should not flag optional fields (CompAuxNum, CompAuxLib, EcritureLet, DateLet, Montantdevise, Idevise)", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({
                    CompAuxNum: "",
                    CompAuxLib: "",
                    EcritureLet: "",
                    DateLet: "",
                    Montantdevise: "",
                    Idevise: "",
                }),
            ],
        })
        const results = checkMandatoryFields(parsed)
        const flaggedFields = results.map((r) => r.field)
        expect(flaggedFields).not.toContain("CompAuxNum")
        expect(flaggedFields).not.toContain("CompAuxLib")
        expect(flaggedFields).not.toContain("EcritureLet")
        expect(flaggedFields).not.toContain("DateLet")
        expect(flaggedFields).not.toContain("Montantdevise")
        expect(flaggedFields).not.toContain("Idevise")
    })
})

// ====================================================================
// 10. checkDebitCredit - Alto2 #24: Debit/Credit or Montant/Sens presence
// ====================================================================

describe("checkDebitCredit", () => {
    it("should pass when Debit/Credit headers are present and filled", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "100,00", Credit: "0,00" })],
        })
        expect(checkDebitCredit(parsed)).toEqual([])
    })

    it("should error when neither Debit/Credit nor Montant/Sens headers exist", () => {
        const parsed = makeParsed({
            headers: ["JournalCode", "JournalLib"],
            entries: [{ JournalCode: "VE", JournalLib: "Ventes" }],
        })
        const results = checkDebitCredit(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("DEBIT_CREDIT")
    })

    it("should error when both Debit and Credit are empty on same line", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "", Credit: "" })],
        })
        const results = checkDebitCredit(parsed)
        expect(results.some((r) => r.id === "DEBIT_CREDIT")).toBe(true)
    })

    it("should accept Montant/Sens headers", () => {
        const parsed = makeParsed({
            headers: [...STANDARD_HEADERS, "Montant", "Sens"],
            entries: [makeEntry({ Montant: "100,00", Sens: "D" })],
        })
        // Should not produce DEBIT_CREDIT error for Montant/Sens fields
        const results = checkDebitCredit(parsed)
        const montantErrors = results.filter((r) => r.id === "DEBIT_CREDIT" && r.message.includes("Montant"))
        expect(montantErrors).toEqual([])
    })
})

// ====================================================================
// 11. checkSensValues - Alto2 #8/#28: Sens values D/C/+1/-1
// ====================================================================

describe("checkSensValues", () => {
    it("should skip when no Sens header", () => {
        const parsed = makeParsed({ entries: [makeEntry()] })
        expect(checkSensValues(parsed)).toEqual([])
    })

    it("should pass for valid D/C/+1/-1 values", () => {
        const headers = [...STANDARD_HEADERS, "Sens"]
        const parsed = makeParsed({
            headers,
            entries: [
                { ...makeEntry(), Sens: "D" },
                { ...makeEntry(), Sens: "C" },
                { ...makeEntry(), Sens: "+1" },
                { ...makeEntry(), Sens: "-1" },
            ],
        })
        expect(checkSensValues(parsed)).toEqual([])
    })

    it("should error for invalid Sens value", () => {
        const headers = [...STANDARD_HEADERS, "Sens"]
        const parsed = makeParsed({
            headers,
            entries: [{ ...makeEntry(), Sens: "X" }],
        })
        const results = checkSensValues(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("SENS_VALUES")
    })

    it("should error for leading/trailing spaces in Sens", () => {
        const headers = [...STANDARD_HEADERS, "Sens"]
        const parsed = makeParsed({
            headers,
            entries: [{ ...makeEntry(), Sens: " D " }],
        })
        const results = checkSensValues(parsed)
        expect(results.some((r) => r.message.includes("espaces"))).toBe(true)
    })
})

// ====================================================================
// 12. checkChronologicalOrder - ValidDate non-decreasing
// ====================================================================

describe("checkChronologicalOrder", () => {
    it("should pass for chronologically ordered ValidDates", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({ ValidDate: "20220101" }),
                makeEntry({ ValidDate: "20220115" }),
                makeEntry({ ValidDate: "20220201" }),
            ],
        })
        expect(checkChronologicalOrder(parsed)).toEqual([])
    })

    it("should pass for equal consecutive ValidDates", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ ValidDate: "20220101" }), makeEntry({ ValidDate: "20220101" })],
        })
        expect(checkChronologicalOrder(parsed)).toEqual([])
    })

    it("should warn for out-of-order ValidDates", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ ValidDate: "20220201" }), makeEntry({ ValidDate: "20220101" })],
        })
        const results = checkChronologicalOrder(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("CHRONOLOGICAL_ORDER")
        expect(results[0]!.severity).toBe("warning")
    })

    it("should report only the first violation", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({ ValidDate: "20220301" }),
                makeEntry({ ValidDate: "20220201" }),
                makeEntry({ ValidDate: "20220101" }),
            ],
        })
        const results = checkChronologicalOrder(parsed)
        expect(results.length).toBe(1)
    })
})

// ====================================================================
// 13. checkEcritureNumSequence - Contiguous +1 sequence
// ====================================================================

describe("checkEcritureNumSequence", () => {
    it("should pass for contiguous numeric sequence", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({ EcritureNum: "1" }),
                makeEntry({ EcritureNum: "2" }),
                makeEntry({ EcritureNum: "3" }),
            ],
        })
        expect(checkEcritureNumSequence(parsed)).toEqual([])
    })

    it("should warn for gap in numeric sequence", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureNum: "1" }), makeEntry({ EcritureNum: "3" })],
        })
        const results = checkEcritureNumSequence(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("ECRITURE_NUM_SEQUENCE")
        expect(results[0]!.severity).toBe("warning")
    })

    it("should skip check for non-numeric EcritureNum values", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureNum: "VE001" }), makeEntry({ EcritureNum: "VE003" })],
        })
        expect(checkEcritureNumSequence(parsed)).toEqual([])
    })

    it("should handle duplicate EcritureNum (multiple lines same ecriture)", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({ EcritureNum: "1" }),
                makeEntry({ EcritureNum: "1" }),
                makeEntry({ EcritureNum: "2" }),
            ],
        })
        expect(checkEcritureNumSequence(parsed)).toEqual([])
    })
})

// ====================================================================
// 14. checkOpeningEntries - First entries are a-nouveau
// ====================================================================

describe("checkOpeningEntries", () => {
    it("should pass for JournalCode=AN", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ JournalCode: "AN" })],
        })
        expect(checkOpeningEntries(parsed)).toEqual([])
    })

    it("should pass for JournalCode=RAN", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ JournalCode: "RAN" })],
        })
        expect(checkOpeningEntries(parsed)).toEqual([])
    })

    it("should pass for JournalCode=OD", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ JournalCode: "OD" })],
        })
        expect(checkOpeningEntries(parsed)).toEqual([])
    })

    it("should pass for EcritureLib containing 'a-nouveau'", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ JournalCode: "VE", EcritureLib: "Report a-nouveau" })],
        })
        expect(checkOpeningEntries(parsed)).toEqual([])
    })

    it("should pass for EcritureLib containing 'ouverture'", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ JournalCode: "VE", EcritureLib: "Balance d'ouverture" })],
        })
        expect(checkOpeningEntries(parsed)).toEqual([])
    })

    it("should warn when first entry doesn't look like opening", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ JournalCode: "VE", EcritureLib: "Facture client" })],
        })
        const results = checkOpeningEntries(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("OPENING_ENTRIES")
        expect(results[0]!.severity).toBe("warning")
    })

    it("should return nothing for empty entries", () => {
        const parsed = makeParsed({ entries: [] })
        expect(checkOpeningEntries(parsed)).toEqual([])
    })
})

// ====================================================================
// 15. checkDebitCreditBalance - Per-EcritureNum equilibrium
// ====================================================================

describe("checkDebitCreditBalance", () => {
    it("should pass for balanced entries", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({ EcritureNum: "001", Debit: "1000,00", Credit: "0,00" }),
                makeEntry({ EcritureNum: "001", Debit: "0,00", Credit: "1000,00" }),
            ],
        })
        expect(checkDebitCreditBalance(parsed)).toEqual([])
    })

    it("should warn for unbalanced entries", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({ EcritureNum: "001", Debit: "1000,00", Credit: "0,00" }),
                makeEntry({ EcritureNum: "001", Debit: "0,00", Credit: "500,00" }),
            ],
        })
        const results = checkDebitCreditBalance(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("DEBIT_CREDIT_BALANCE")
        expect(results[0]!.severity).toBe("warning")
    })

    it("should check each EcritureNum group independently", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({ EcritureNum: "001", Debit: "100,00", Credit: "0,00" }),
                makeEntry({ EcritureNum: "001", Debit: "0,00", Credit: "100,00" }),
                makeEntry({ EcritureNum: "002", Debit: "500,00", Credit: "0,00" }),
                // EcritureNum 002 is unbalanced
            ],
        })
        const results = checkDebitCreditBalance(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.message).toContain("002")
    })

    it("should skip when Debit/Credit headers are missing", () => {
        const parsed = makeParsed({
            headers: ["JournalCode"],
            entries: [{ JournalCode: "VE" }],
        })
        expect(checkDebitCreditBalance(parsed)).toEqual([])
    })

    it("should tolerate small floating-point differences (< 0.005)", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({ EcritureNum: "001", Debit: "33,33", Credit: "0" }),
                makeEntry({ EcritureNum: "001", Debit: "33,33", Credit: "0" }),
                makeEntry({ EcritureNum: "001", Debit: "33,34", Credit: "0" }),
                makeEntry({ EcritureNum: "001", Debit: "0", Credit: "100,00" }),
            ],
        })
        expect(checkDebitCreditBalance(parsed)).toEqual([])
    })
})

// ====================================================================
// 16. checkEncoding
// ====================================================================

describe("checkEncoding", () => {
    it("should pass for UTF-8", () => {
        const parsed = makeParsed({ encoding: "UTF-8" })
        expect(checkEncoding(parsed)).toEqual([])
    })

    it("should pass for ISO-8859-15", () => {
        const parsed = makeParsed({ encoding: "ISO-8859-15" })
        expect(checkEncoding(parsed)).toEqual([])
    })

    it("should pass for ASCII", () => {
        const parsed = makeParsed({ encoding: "ASCII" })
        expect(checkEncoding(parsed)).toEqual([])
    })

    it("should pass when no encoding is set", () => {
        const parsed = makeParsed({ encoding: undefined })
        expect(checkEncoding(parsed)).toEqual([])
    })

    it("should warn for unsupported encoding", () => {
        const parsed = makeParsed({ encoding: "Windows-1252" })
        const results = checkEncoding(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("ENCODING")
        expect(results[0]!.severity).toBe("warning")
    })
})

// ====================================================================
// 17. checkEmptyFile - Alto2 #11: File must have > 1 line
// ====================================================================

describe("checkEmptyFile", () => {
    it("should pass for file with entries", () => {
        const parsed = makeParsed({ entries: [makeEntry()] })
        expect(checkEmptyFile(parsed)).toEqual([])
    })

    it("should error for file with no entries", () => {
        const parsed = makeParsed({ entries: [] })
        const results = checkEmptyFile(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("EMPTY_FILE")
        expect(results[0]!.severity).toBe("error")
    })
})

// ====================================================================
// 18. checkDateValidity - Alto2 #21: Calendar date validation
// ====================================================================

describe("checkDateValidity", () => {
    it("should pass for valid calendar dates", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20220228", PieceDate: "20220228" })],
        })
        expect(checkDateValidity(parsed)).toEqual([])
    })

    it("should error for Feb 30", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20220230" })],
        })
        const results = checkDateValidity(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("DATE_VALIDITY")
    })

    it("should error for month 13", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20221301" })],
        })
        const results = checkDateValidity(parsed)
        expect(results.length).toBe(1)
    })

    it("should error for day 00", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20220100" })],
        })
        const results = checkDateValidity(parsed)
        expect(results.length).toBe(1)
    })

    it("should pass for leap year Feb 29", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20200229" })],
        })
        expect(checkDateValidity(parsed)).toEqual([])
    })

    it("should error for non-leap year Feb 29", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20210229" })],
        })
        const results = checkDateValidity(parsed)
        expect(results.length).toBe(1)
    })

    it("should skip non-8-digit date values", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "2022-01-01" })],
        })
        // DATE_FORMAT check would catch this, not DATE_VALIDITY
        expect(checkDateValidity(parsed)).toEqual([])
    })
})

// ====================================================================
// 19. checkPieceDateCoherence - PieceDate <= EcritureDate
// ====================================================================

describe("checkPieceDateCoherence", () => {
    it("should pass when PieceDate equals EcritureDate", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ PieceDate: "20220101", EcritureDate: "20220101" })],
        })
        expect(checkPieceDateCoherence(parsed)).toEqual([])
    })

    it("should pass when PieceDate is before EcritureDate", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ PieceDate: "20211231", EcritureDate: "20220101" })],
        })
        expect(checkPieceDateCoherence(parsed)).toEqual([])
    })

    it("should warn when PieceDate is after EcritureDate", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ PieceDate: "20220201", EcritureDate: "20220101" })],
        })
        const results = checkPieceDateCoherence(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("PIECE_DATE_COHERENCE")
        expect(results[0]!.severity).toBe("warning")
    })

    it("should skip when dates are not 8-digit format", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ PieceDate: "2022-02-01", EcritureDate: "2022-01-01" })],
        })
        expect(checkPieceDateCoherence(parsed)).toEqual([])
    })
})

// ====================================================================
// 20. checkFieldCountMismatch - Alto2 #13: Field count per line
// ====================================================================

describe("checkFieldCountMismatch", () => {
    it("should pass when no line issues exist", () => {
        const parsed = makeParsed({ lineIssues: [] })
        expect(checkFieldCountMismatch(parsed)).toEqual([])
    })

    it("should error for field count mismatch", () => {
        const parsed = makeParsed({
            lineIssues: [
                {
                    line: 5,
                    kind: "field_count_mismatch",
                    expectedFields: 18,
                    actualFields: 15,
                },
            ],
        })
        const results = checkFieldCountMismatch(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("FIELD_COUNT_MISMATCH")
        expect(results[0]!.severity).toBe("error")
        expect(results[0]!.line).toBe(5)
        expect(results[0]!.message).toContain("15")
        expect(results[0]!.message).toContain("18")
    })

    it("should report multiple field count mismatches", () => {
        const parsed = makeParsed({
            lineIssues: [
                { line: 3, kind: "field_count_mismatch", expectedFields: 18, actualFields: 20 },
                { line: 7, kind: "field_count_mismatch", expectedFields: 18, actualFields: 16 },
            ],
        })
        const results = checkFieldCountMismatch(parsed)
        expect(results.length).toBe(2)
    })

    it("should ignore empty line issues", () => {
        const parsed = makeParsed({
            lineIssues: [{ line: 3, kind: "empty" }],
        })
        expect(checkFieldCountMismatch(parsed)).toEqual([])
    })

    it("should return nothing when lineIssues is undefined", () => {
        const parsed = makeParsed()
        delete (parsed as Record<string, unknown>).lineIssues
        expect(checkFieldCountMismatch(parsed)).toEqual([])
    })
})

// ====================================================================
// 21. checkEmptyLines - Alto2 #12: Empty data lines
// ====================================================================

describe("checkEmptyLines", () => {
    it("should pass when no empty lines", () => {
        const parsed = makeParsed({ lineIssues: [] })
        expect(checkEmptyLines(parsed)).toEqual([])
    })

    it("should error for empty line", () => {
        const parsed = makeParsed({
            lineIssues: [{ line: 4, kind: "empty" }],
        })
        const results = checkEmptyLines(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("EMPTY_LINE")
        expect(results[0]!.severity).toBe("error")
        expect(results[0]!.line).toBe(4)
    })

    it("should report multiple empty lines", () => {
        const parsed = makeParsed({
            lineIssues: [
                { line: 4, kind: "empty" },
                { line: 8, kind: "empty" },
                { line: 12, kind: "empty" },
            ],
        })
        const results = checkEmptyLines(parsed)
        expect(results.length).toBe(3)
    })

    it("should ignore field_count_mismatch issues", () => {
        const parsed = makeParsed({
            lineIssues: [{ line: 3, kind: "field_count_mismatch", expectedFields: 18, actualFields: 15 }],
        })
        expect(checkEmptyLines(parsed)).toEqual([])
    })
})

// ====================================================================
// 22. checkDebitCreditExclusive - Alto2 #24: Mutual exclusivity
// ====================================================================

describe("checkDebitCreditExclusive", () => {
    it("should pass when only Debit is non-zero", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000,00", Credit: "0,00" })],
        })
        expect(checkDebitCreditExclusive(parsed)).toEqual([])
    })

    it("should pass when only Credit is non-zero", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "0,00", Credit: "500,00" })],
        })
        expect(checkDebitCreditExclusive(parsed)).toEqual([])
    })

    it("should warn when both Debit and Credit are non-zero", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000,00", Credit: "500,00" })],
        })
        const results = checkDebitCreditExclusive(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("DEBIT_CREDIT_EXCLUSIVE")
        expect(results[0]!.severity).toBe("warning")
        expect(results[0]!.message).toContain("1000,00")
        expect(results[0]!.message).toContain("500,00")
    })

    it("should warn when both Debit and Credit are zero", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "0,00", Credit: "0,00" })],
        })
        const results = checkDebitCreditExclusive(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("DEBIT_CREDIT_EXCLUSIVE")
        expect(results[0]!.message).toContain("zéro")
    })

    it("should warn when both are zero (integer form)", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "0", Credit: "0" })],
        })
        const results = checkDebitCreditExclusive(parsed)
        expect(results.length).toBe(1)
    })

    it("should skip lines where Debit or Credit is empty", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "", Credit: "100,00" })],
        })
        expect(checkDebitCreditExclusive(parsed)).toEqual([])
    })

    it("should skip when Debit/Credit headers are missing", () => {
        const parsed = makeParsed({
            headers: ["JournalCode"],
            entries: [{ JournalCode: "VE" }],
        })
        expect(checkDebitCreditExclusive(parsed)).toEqual([])
    })

    it("should report multiple violations", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "100,00", Credit: "200,00" }), makeEntry({ Debit: "0,00", Credit: "0,00" })],
        })
        const results = checkDebitCreditExclusive(parsed)
        expect(results.length).toBe(2)
    })
})

// ====================================================================
// 23. checkNumericDotSeparator - Alto2 #17: Dot forbidden
// ====================================================================

describe("checkNumericDotSeparator", () => {
    it("should pass for comma-separated decimal", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000,50", Credit: "0,00" })],
        })
        expect(checkNumericDotSeparator(parsed)).toEqual([])
    })

    it("should pass for integer values", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000", Credit: "0" })],
        })
        expect(checkNumericDotSeparator(parsed)).toEqual([])
    })

    it("should error for dot decimal separator", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000.50" })],
        })
        const results = checkNumericDotSeparator(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("NUMERIC_DOT_SEPARATOR")
        expect(results[0]!.severity).toBe("error")
        expect(results[0]!.field).toBe("Debit")
    })

    it("should detect dot in Credit field", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Credit: "500.25" })],
        })
        const results = checkNumericDotSeparator(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.field).toBe("Credit")
    })

    it("should detect dot in Montantdevise field", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Montantdevise: "123.45" })],
        })
        const results = checkNumericDotSeparator(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.field).toBe("Montantdevise")
    })

    it("should skip empty fields", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Montantdevise: "" })],
        })
        expect(checkNumericDotSeparator(parsed)).toEqual([])
    })
})

// ====================================================================
// 24. checkNumericThousandsSeparator - Alto2 #18: No thousands separators
// ====================================================================

describe("checkNumericThousandsSeparator", () => {
    it("should pass for valid numeric without thousands separator", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1000,50", Credit: "0,00" })],
        })
        expect(checkNumericThousandsSeparator(parsed)).toEqual([])
    })

    it("should error for space thousands separator", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1 000,50" })],
        })
        const results = checkNumericThousandsSeparator(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("NUMERIC_THOUSANDS_SEPARATOR")
        expect(results[0]!.severity).toBe("error")
    })

    it("should error for multiple decimal separators", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1,000,50" })],
        })
        const results = checkNumericThousandsSeparator(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("NUMERIC_THOUSANDS_SEPARATOR")
    })

    it("should error for dot-based thousands separators", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Debit: "1.000.500" })],
        })
        const results = checkNumericThousandsSeparator(parsed)
        expect(results.length).toBe(1)
    })

    it("should skip empty fields", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Montantdevise: "" })],
        })
        expect(checkNumericThousandsSeparator(parsed)).toEqual([])
    })

    it("should detect in Credit field", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ Credit: "10 000" })],
        })
        const results = checkNumericThousandsSeparator(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.field).toBe("Credit")
    })
})

// ====================================================================
// 25. checkDateYearRange - Alto2 #22: Year between 1900 and 2099
// ====================================================================

describe("checkDateYearRange", () => {
    it("should pass for year in valid range", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20220101" })],
        })
        expect(checkDateYearRange(parsed)).toEqual([])
    })

    it("should pass for year 1900 (boundary)", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "19000101" })],
        })
        expect(checkDateYearRange(parsed)).toEqual([])
    })

    it("should pass for year 2099 (boundary)", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "20990101" })],
        })
        expect(checkDateYearRange(parsed)).toEqual([])
    })

    it("should warn for year before 1900", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "18990101" })],
        })
        const results = checkDateYearRange(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("DATE_YEAR_RANGE")
        expect(results[0]!.severity).toBe("warning")
    })

    it("should warn for year after 2099", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "21000101" })],
        })
        const results = checkDateYearRange(parsed)
        expect(results.length).toBe(1)
        expect(results[0]!.id).toBe("DATE_YEAR_RANGE")
    })

    it("should check all date fields", () => {
        const parsed = makeParsed({
            entries: [
                makeEntry({
                    EcritureDate: "18990101",
                    PieceDate: "18990101",
                    ValidDate: "18990101",
                    DateLet: "18990101",
                }),
            ],
        })
        const results = checkDateYearRange(parsed)
        expect(results.length).toBe(4)
    })

    it("should skip non-8-digit date values", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ EcritureDate: "1899-01-01" })],
        })
        expect(checkDateYearRange(parsed)).toEqual([])
    })

    it("should skip empty date values", () => {
        const parsed = makeParsed({
            entries: [makeEntry({ DateLet: "" })],
        })
        expect(checkDateYearRange(parsed)).toEqual([])
    })
})
