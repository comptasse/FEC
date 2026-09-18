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
} from "./checks.js"
import { parseFlatFile } from "./parseFlatFile.js"
import { parseXmlFile } from "./parseXmlFile.js"
import type { FecParsedFile, FecValidationResult } from "./types.js"

function detectFileType(fileName: string, content: string): "flat" | "xml" {
    const lower = fileName.toLowerCase()
    if (lower.endsWith(".xml")) return "xml"
    if (lower.endsWith(".txt")) return "flat"
    // Heuristic: if content starts with < it's probably XML
    const trimmed = content.trimStart()
    if (trimmed.startsWith("<?xml") || trimmed.startsWith("<comptabilite")) {
        return "xml"
    }
    return "flat"
}

export function validateFecFile(content: string, fileName: string): FecValidationResult {
    const fileType = detectFileType(fileName, content)

    // Parse
    let parsed: FecParsedFile
    if (fileType === "xml") {
        parsed = parseXmlFile(content, fileName)
    } else {
        parsed = parseFlatFile(content, fileName)
    }

    // Run all checks
    const checks = [
        ...checkFileName(fileName),
        ...checkEmptyFile(parsed),
        ...checkHeaderPresence(parsed),
        ...checkColumnCount(parsed),
        ...checkColumnOrder(parsed),
        ...checkSeparator(parsed),
        ...checkFieldCountMismatch(parsed),
        ...checkEmptyLines(parsed),
        ...checkDebitCredit(parsed),
        ...checkDateFormat(parsed),
        ...checkNumericFormat(parsed),
        ...checkNumericDotSeparator(parsed),
        ...checkNumericThousandsSeparator(parsed),
        ...checkCompteNum(parsed),
        ...checkMandatoryFields(parsed),
        ...checkSensValues(parsed),
        ...checkDateValidity(parsed),
        ...checkDateYearRange(parsed),
        ...checkPieceDateCoherence(parsed),
        ...checkDebitCreditExclusive(parsed),
        ...checkChronologicalOrder(parsed),
        ...checkEcritureNumSequence(parsed),
        ...checkOpeningEntries(parsed),
        ...checkDebitCreditBalance(parsed),
        ...checkEncoding(parsed),
    ]

    const errors = checks.filter((c) => c.severity === "error").length
    const warnings = checks.filter((c) => c.severity === "warning").length

    return {
        fileName,
        fileType,
        checks,
        summary: {
            errors,
            warnings,
            total: checks.length,
            lines: parsed.entries.length,
        },
    }
}
