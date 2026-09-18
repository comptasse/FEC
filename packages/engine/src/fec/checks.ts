import type { FecCheckResult, FecParsedFile } from "./types.js"
import { BIC_COLUMN_NAMES } from "./types.js"

// ---------------------------------------------------------------------------
// 1. checkFileName - Le nom du fichier doit respecter le format {SIREN}FEC{YYYYMMDD}
// ---------------------------------------------------------------------------

export function checkFileName(fileName: string): FecCheckResult[] {
    const results: FecCheckResult[] = []
    // Strip extension (.txt, .xml, etc.)
    const baseName = fileName.replace(/\.[^.]+$/, "")
    const pattern = /^\d{9}FEC\d{8}$/
    if (!pattern.test(baseName)) {
        results.push({
            id: "FILE_NAME",
            severity: "error",
            message: `Le nom du fichier "${fileName}" ne respecte pas le format requis : {SIREN sur 9 chiffres}FEC{YYYYMMDD}. Exemple : 123456789FEC20240101.txt`,
        })
    } else {
        // Validate the date part
        const dateStr = baseName.slice(12)
        if (!isValidDate(dateStr)) {
            results.push({
                id: "FILE_NAME",
                severity: "error",
                message: `La date dans le nom du fichier "${dateStr}" n'est pas une date valide (AAAAMMJJ).`,
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 2. checkHeaderPresence - La première ligne contient les noms des champs (fichiers plats)
// ---------------------------------------------------------------------------

export function checkHeaderPresence(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (parsed.fileType !== "flat") return results

    if (parsed.headers.length === 0) {
        results.push({
            id: "HEADER_PRESENCE",
            severity: "error",
            message: "Le fichier ne contient pas de ligne d'en-tête avec les noms des champs.",
        })
    }
    return results
}

// ---------------------------------------------------------------------------
// 3. checkColumnOrder - Les 18 colonnes obligatoires dans le bon ordre
// ---------------------------------------------------------------------------

export function checkColumnOrder(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const expected = BIC_COLUMN_NAMES

    for (let i = 0; i < expected.length; i++) {
        const expectedName = expected[i]!
        const actualName = parsed.headers[i]

        if (actualName === undefined) {
            results.push({
                id: "COLUMN_ORDER",
                severity: "error",
                message: `Colonne ${i + 1} manquante : "${expectedName}" attendue.`,
                field: expectedName,
            })
        } else if (actualName.toLowerCase() !== expectedName.toLowerCase()) {
            results.push({
                id: "COLUMN_ORDER",
                severity: "error",
                message: `Colonne ${i + 1} : "${actualName}" trouvée, "${expectedName}" attendue.`,
                field: expectedName,
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 4. checkColumnCount - Minimum 18 colonnes
// ---------------------------------------------------------------------------

export function checkColumnCount(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (parsed.headers.length < 18) {
        results.push({
            id: "COLUMN_COUNT",
            severity: "error",
            message: `Le fichier contient ${parsed.headers.length} colonne(s) au lieu des 18 obligatoires.`,
        })
    }
    return results
}

// ---------------------------------------------------------------------------
// 5. checkSeparator - Tabulation ou pipe uniquement (fichiers plats)
// ---------------------------------------------------------------------------

export function checkSeparator(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (parsed.fileType !== "flat") return results

    if (parsed.separator && parsed.separator !== "\t" && parsed.separator !== "|") {
        results.push({
            id: "SEPARATOR",
            severity: "error",
            message: `Le séparateur de champ détecté n'est ni une tabulation ni un pipe (|). Séparateur trouvé : "${parsed.separator}".`,
        })
    }
    return results
}

// ---------------------------------------------------------------------------
// 6. checkDateFormat - Dates au format AAAAMMJJ sans séparateur
// ---------------------------------------------------------------------------

export function checkDateFormat(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const dateFields = ["EcritureDate", "PieceDate", "ValidDate", "DateLet"]
    const datePattern = /^\d{8}$/

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        for (const field of dateFields) {
            const value = entry[field]
            if (value && value.trim() !== "" && !datePattern.test(value)) {
                results.push({
                    id: "DATE_FORMAT",
                    severity: "error",
                    message: `Ligne ${i + 2} : le champ "${field}" contient "${value}" qui n'est pas au format AAAAMMJJ.`,
                    line: i + 2,
                    field,
                })
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 7. checkNumericFormat - Virgule décimale, pas de séparateur de milliers
// ---------------------------------------------------------------------------

export function checkNumericFormat(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const numericFields = ["Debit", "Credit", "Montantdevise"]
    // Valid: optional minus, digits, optional comma + digits
    const numPattern = /^-?\d+(,\d+)?$/

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        for (const field of numericFields) {
            const value = entry[field]
            if (value && value.trim() !== "" && !numPattern.test(value)) {
                results.push({
                    id: "NUMERIC_FORMAT",
                    severity: "error",
                    message: `Ligne ${i + 2} : le champ "${field}" contient "${value}" qui n'est pas un nombre valide (virgule décimale, sans séparateur de milliers).`,
                    line: i + 2,
                    field,
                })
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 8. checkCompteNum - Les 3 premiers caractères doivent être des chiffres
// ---------------------------------------------------------------------------

export function checkCompteNum(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        const value = entry.CompteNum
        if (value && value.length >= 3) {
            const first3 = value.substring(0, 3)
            if (!/^\d{3}$/.test(first3)) {
                results.push({
                    id: "COMPTE_NUM",
                    severity: "error",
                    message: `Ligne ${i + 2} : les 3 premiers caractères du CompteNum "${value}" ne sont pas des chiffres ("${first3}").`,
                    line: i + 2,
                    field: "CompteNum",
                })
            }
        } else if (value !== undefined && value.length < 3 && value.length > 0) {
            results.push({
                id: "COMPTE_NUM",
                severity: "error",
                message: `Ligne ${i + 2} : le CompteNum "${value}" contient moins de 3 caractères.`,
                line: i + 2,
                field: "CompteNum",
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 9. checkMandatoryFields - Les champs obligatoires ne doivent pas être vides
// ---------------------------------------------------------------------------

export function checkMandatoryFields(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const mandatoryFields = [
        "JournalCode",
        "JournalLib",
        "EcritureNum",
        "EcritureDate",
        "CompteNum",
        "CompteLib",
        "PieceRef",
        "PieceDate",
        "EcritureLib",
        "ValidDate",
    ]

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        for (const field of mandatoryFields) {
            const value = entry[field]
            if (value === undefined || value.trim() === "") {
                results.push({
                    id: "MANDATORY_FIELD",
                    severity: "error",
                    message: `Ligne ${i + 2} : le champ obligatoire "${field}" est vide.`,
                    line: i + 2,
                    field,
                })
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 10. checkDebitCredit - Débit/Crédit OU Montant/Sens doivent être présents
// ---------------------------------------------------------------------------

export function checkDebitCredit(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const hasDebit = parsed.headers.includes("Debit")
    const hasCredit = parsed.headers.includes("Credit")
    const hasMontant = parsed.headers.includes("Montant")
    const hasSens = parsed.headers.includes("Sens")

    const hasDebitCredit = hasDebit && hasCredit
    const hasMontantSens = hasMontant && hasSens

    if (!hasDebitCredit && !hasMontantSens) {
        results.push({
            id: "DEBIT_CREDIT",
            severity: "error",
            message: "Le fichier ne contient ni la paire Débit/Crédit ni la paire Montant/Sens.",
        })
        return results
    }

    // Check that values are present in each row
    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!

        if (hasDebitCredit) {
            const debit = entry.Debit?.trim() ?? ""
            const credit = entry.Credit?.trim() ?? ""
            if (debit === "" && credit === "") {
                results.push({
                    id: "DEBIT_CREDIT",
                    severity: "error",
                    message: `Ligne ${i + 2} : les champs Débit et Crédit sont tous les deux vides.`,
                    line: i + 2,
                })
            }
        }

        if (hasMontantSens) {
            const montant = entry.Montant?.trim() ?? ""
            const sens = entry.Sens?.trim() ?? ""
            if (montant === "" || sens === "") {
                results.push({
                    id: "DEBIT_CREDIT",
                    severity: "error",
                    message: `Ligne ${i + 2} : le champ Montant ou Sens est vide.`,
                    line: i + 2,
                })
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 11. checkSensValues - "D"/"C" ou "+1"/"-1" sans espaces
// ---------------------------------------------------------------------------

export function checkSensValues(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (!parsed.headers.includes("Sens")) return results

    const validValues = new Set(["D", "C", "+1", "-1"])

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        const value = entry.Sens
        if (value && value.trim() !== "" && !validValues.has(value.trim())) {
            results.push({
                id: "SENS_VALUES",
                severity: "error",
                message: `Ligne ${i + 2} : le champ Sens contient "${value}", les valeurs acceptées sont "D", "C", "+1" ou "-1".`,
                line: i + 2,
                field: "Sens",
            })
        }
        // Check for leading/trailing spaces
        if (value && value !== value.trim()) {
            results.push({
                id: "SENS_VALUES",
                severity: "error",
                message: `Ligne ${i + 2} : le champ Sens contient des espaces superflus.`,
                line: i + 2,
                field: "Sens",
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 12. checkChronologicalOrder - Écritures triées par ValidDate (avertissement)
// ---------------------------------------------------------------------------

export function checkChronologicalOrder(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    let previousDate = ""

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        const validDate = entry.ValidDate ?? ""

        if (validDate && previousDate && validDate < previousDate) {
            results.push({
                id: "CHRONOLOGICAL_ORDER",
                severity: "warning",
                message: `Ligne ${i + 2} : la ValidDate "${validDate}" est antérieure à la ValidDate précédente "${previousDate}". Les écritures doivent être classées chronologiquement.`,
                line: i + 2,
                field: "ValidDate",
            })
            break // Report only the first occurrence
        }

        if (validDate) {
            previousDate = validDate
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 13. checkEcritureNumSequence - Séquence continue des numéros d'écriture
// ---------------------------------------------------------------------------

export function checkEcritureNumSequence(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const seen = new Set<string>()
    const nums: string[] = []

    for (const entry of parsed.entries) {
        const num = entry.EcritureNum ?? ""
        if (num && !seen.has(num)) {
            seen.add(num)
            nums.push(num)
        }
    }

    // Check if they are all numeric and sequential
    const allNumeric = nums.every((n) => /^\d+$/.test(n))
    if (allNumeric && nums.length > 1) {
        for (let i = 1; i < nums.length; i++) {
            const prev = parseInt(nums[i - 1]!, 10)
            const curr = parseInt(nums[i]!, 10)
            if (curr !== prev + 1) {
                results.push({
                    id: "ECRITURE_NUM_SEQUENCE",
                    severity: "warning",
                    message: `La séquence des numéros d'écriture n'est pas continue : saut de "${nums[i - 1]}" à "${nums[i]}".`,
                })
                break
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 14. checkOpeningEntries - Les premières écritures sont les à-nouveaux
// ---------------------------------------------------------------------------

export function checkOpeningEntries(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (parsed.entries.length === 0) return results

    // Opening entries typically use journal code starting with "AN", "OD" or "RAN"
    // or the EcritureLib contains "a-nouveau" / "a nouveau" / "report"
    const first = parsed.entries[0]!
    const journalCode = (first.JournalCode ?? "").toUpperCase()
    const lib = (first.EcritureLib ?? "").toLowerCase()

    const isOpeningJournal =
        journalCode === "AN" || journalCode === "RAN" || journalCode === "OD" || journalCode.startsWith("AN")

    const isOpeningLib =
        lib.includes("a-nouveau") ||
        lib.includes("a nouveau") ||
        lib.includes("à-nouveau") ||
        lib.includes("à nouveau") ||
        lib.includes("report") ||
        lib.includes("ouverture")

    if (!isOpeningJournal && !isOpeningLib) {
        results.push({
            id: "OPENING_ENTRIES",
            severity: "warning",
            message:
                'Les premières écritures ne semblent pas être des écritures d\'à-nouveau (balance d\'ouverture). Le journal d\'ouverture est généralement codé "AN" ou "RAN".',
        })
    }
    return results
}

// ---------------------------------------------------------------------------
// 15. checkDebitCreditBalance - Équilibre débit/crédit par écriture
// ---------------------------------------------------------------------------

export function checkDebitCreditBalance(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (!parsed.headers.includes("Debit") || !parsed.headers.includes("Credit")) {
        return results
    }

    // Group by EcritureNum
    const groups = new Map<string, { debit: number; credit: number; firstLine: number }>()

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        const num = entry.EcritureNum ?? ""
        if (!num) continue

        if (!groups.has(num)) {
            groups.set(num, { debit: 0, credit: 0, firstLine: i + 2 })
        }
        const group = groups.get(num)!

        const debit = parseDecimal(entry.Debit ?? "")
        const credit = parseDecimal(entry.Credit ?? "")
        group.debit += debit
        group.credit += credit
    }

    for (const [num, group] of groups) {
        // Allow a small tolerance for floating point
        if (Math.abs(group.debit - group.credit) > 0.005) {
            results.push({
                id: "DEBIT_CREDIT_BALANCE",
                severity: "warning",
                message: `L'écriture n°${num} (ligne ${group.firstLine}) n'est pas équilibrée : total débit = ${formatDecimal(group.debit)}, total crédit = ${formatDecimal(group.credit)}.`,
                line: group.firstLine,
                field: "EcritureNum",
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 16. checkEncoding - ASCII, ISO-8859-15 ou UTF-8
// ---------------------------------------------------------------------------

export function checkEncoding(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    // In the browser, content is already decoded as string.
    // We can only check for presence of replacement characters (U+FFFD)
    // which indicate encoding issues.
    if (
        parsed.encoding &&
        parsed.encoding !== "UTF-8" &&
        parsed.encoding !== "ISO-8859-15" &&
        parsed.encoding !== "ASCII"
    ) {
        results.push({
            id: "ENCODING",
            severity: "warning",
            message: `L'encodage détecté "${parsed.encoding}" n'est pas conforme. Les encodages acceptés sont ASCII, ISO-8859-15 ou UTF-8.`,
        })
    }
    return results
}

// ---------------------------------------------------------------------------
// 17. checkEmptyFile - Au moins l'en-tête + 1 ligne de données
// ---------------------------------------------------------------------------

export function checkEmptyFile(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (parsed.entries.length === 0) {
        results.push({
            id: "EMPTY_FILE",
            severity: "error",
            message:
                "Le fichier ne contient aucune ligne de données (seul l'en-tête est présent ou le fichier est vide).",
        })
    }
    return results
}

// ---------------------------------------------------------------------------
// 18. checkDateValidity - Les dates doivent être des dates calendaires valides
// ---------------------------------------------------------------------------

export function checkDateValidity(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const dateFields = ["EcritureDate", "PieceDate", "ValidDate", "DateLet"]

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        for (const field of dateFields) {
            const value = entry[field]
            if (value && /^\d{8}$/.test(value) && !isValidDate(value)) {
                results.push({
                    id: "DATE_VALIDITY",
                    severity: "error",
                    message: `Ligne ${i + 2} : le champ "${field}" contient "${value}" qui n'est pas une date calendaire valide.`,
                    line: i + 2,
                    field,
                })
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 19. checkPieceDateCoherence - PieceDate <= EcritureDate
// ---------------------------------------------------------------------------

export function checkPieceDateCoherence(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        const pieceDate = entry.PieceDate ?? ""
        const ecritureDate = entry.EcritureDate ?? ""

        if (
            pieceDate &&
            ecritureDate &&
            /^\d{8}$/.test(pieceDate) &&
            /^\d{8}$/.test(ecritureDate) &&
            pieceDate > ecritureDate
        ) {
            results.push({
                id: "PIECE_DATE_COHERENCE",
                severity: "warning",
                message: `Ligne ${i + 2} : la PieceDate "${pieceDate}" est postérieure à l'EcritureDate "${ecritureDate}".`,
                line: i + 2,
                field: "PieceDate",
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 20. checkFieldCountMismatch - Chaque ligne doit avoir le même nombre de champs que l'en-tête
// ---------------------------------------------------------------------------

export function checkFieldCountMismatch(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (!parsed.lineIssues) return results

    for (const issue of parsed.lineIssues) {
        if (issue.kind === "field_count_mismatch") {
            results.push({
                id: "FIELD_COUNT_MISMATCH",
                severity: "error",
                message: `La structure du fichier est incorrecte : en ligne ${issue.line} : il y a ${issue.actualFields} champs au lieu des ${issue.expectedFields} champs attendus.`,
                line: issue.line,
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 21. checkEmptyLines - Détection des lignes vides dans le fichier (hors fin de fichier)
// ---------------------------------------------------------------------------

export function checkEmptyLines(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (!parsed.lineIssues) return results

    for (const issue of parsed.lineIssues) {
        if (issue.kind === "empty") {
            results.push({
                id: "EMPTY_LINE",
                severity: "error",
                message: `La structure du fichier est incorrecte, la ligne ${issue.line} est vide.`,
                line: issue.line,
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 22. checkDebitCreditExclusive - Débit et Crédit ne doivent pas être tous deux renseignés ou tous deux nuls
// ---------------------------------------------------------------------------

export function checkDebitCreditExclusive(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    if (!parsed.headers.includes("Debit") || !parsed.headers.includes("Credit")) {
        return results
    }

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        const debitStr = entry.Debit?.trim() ?? ""
        const creditStr = entry.Credit?.trim() ?? ""

        // Only check lines where both fields have valid numeric values
        if (debitStr === "" || creditStr === "") continue

        const debit = parseDecimal(debitStr)
        const credit = parseDecimal(creditStr)

        // Both non-zero on the same line
        if (Math.abs(debit) > 0.005 && Math.abs(credit) > 0.005) {
            results.push({
                id: "DEBIT_CREDIT_EXCLUSIVE",
                severity: "warning",
                message: `Ligne ${i + 2} : débit (${debitStr}) et crédit (${creditStr}) sont tous les deux renseignés sur une même ligne.`,
                line: i + 2,
            })
        }
        // Both zero (debit = credit = 0)
        if (Math.abs(debit) <= 0.005 && Math.abs(credit) <= 0.005) {
            results.push({
                id: "DEBIT_CREDIT_EXCLUSIVE",
                severity: "warning",
                message: `Ligne ${i + 2} : débit et crédit sont tous les deux à zéro.`,
                line: i + 2,
            })
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 23. checkNumericDotSeparator - Le point est interdit comme séparateur décimal
// ---------------------------------------------------------------------------

export function checkNumericDotSeparator(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const numericFields = ["Debit", "Credit", "Montantdevise"]

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        for (const field of numericFields) {
            const value = entry[field]
            if (value && value.trim() !== "" && value.includes(".")) {
                results.push({
                    id: "NUMERIC_DOT_SEPARATOR",
                    severity: "error",
                    message: `Ligne ${i + 2} : le champ "${field}" contient "${value}" — un format numérique avec une virgule au lieu d'un point est attendu.`,
                    line: i + 2,
                    field,
                })
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 24. checkNumericThousandsSeparator - Pas de séparateur de milliers (espace ou caractères multiples)
// ---------------------------------------------------------------------------

export function checkNumericThousandsSeparator(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const numericFields = ["Debit", "Credit", "Montantdevise"]
    // Detects patterns like "1 000" or "1,000,000"
    const thousandsPattern = /^\s*[+-]?\d+\s+\d+/
    const multiSepPattern = /[.,].*[.,]/

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        for (const field of numericFields) {
            const value = entry[field]
            if (value && value.trim() !== "") {
                if (thousandsPattern.test(value) || multiSepPattern.test(value)) {
                    results.push({
                        id: "NUMERIC_THOUSANDS_SEPARATOR",
                        severity: "error",
                        message: `Ligne ${i + 2} : le champ "${field}" contient "${value}" — un format numérique sans séparateur de milliers est attendu.`,
                        line: i + 2,
                        field,
                    })
                }
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// 25. checkDateYearRange - Les dates doivent avoir une année entre 1900 et 2099
// ---------------------------------------------------------------------------

export function checkDateYearRange(parsed: FecParsedFile): FecCheckResult[] {
    const results: FecCheckResult[] = []
    const dateFields = ["EcritureDate", "PieceDate", "ValidDate", "DateLet"]

    for (let i = 0; i < parsed.entries.length; i++) {
        const entry = parsed.entries[i]!
        for (const field of dateFields) {
            const value = entry[field]
            if (value && /^\d{8}$/.test(value)) {
                const year = parseInt(value.substring(0, 4), 10)
                if (year < 1900 || year > 2099) {
                    results.push({
                        id: "DATE_YEAR_RANGE",
                        severity: "warning",
                        message: `Ligne ${i + 2} : le champ "${field}" contient une date (${value}) en dehors de la période 1900–2099.`,
                        line: i + 2,
                        field,
                    })
                }
            }
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidDate(yyyymmdd: string): boolean {
    if (yyyymmdd.length !== 8) return false
    const year = parseInt(yyyymmdd.substring(0, 4), 10)
    const month = parseInt(yyyymmdd.substring(4, 6), 10)
    const day = parseInt(yyyymmdd.substring(6, 8), 10)
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false
    // Use Date to validate
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function parseDecimal(value: string): number {
    if (!value || value.trim() === "") return 0
    // French format: comma as decimal separator
    return parseFloat(value.replace(",", ".")) || 0
}

function formatDecimal(value: number): string {
    return value.toFixed(2).replace(".", ",")
}
