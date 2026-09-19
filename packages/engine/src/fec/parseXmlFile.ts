import type { FecEntry, FecParsedFile } from "./types.js"

const HEADERS: readonly string[] = [
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

function getChildText(parent: Element, tagName: string): string {
    const el = parent.querySelector(tagName)
    return el?.textContent?.trim() ?? ""
}

/**
 * Convert Montant/Sens to Debit/Credit.
 * Sens values: "D" or "+1" => debit; "C" or "-1" => credit.
 */
function convertMontantSens(montant: string, sens: string): { debit: string; credit: string } {
    const trimmedSens = sens.trim().toUpperCase()
    const amount = montant.trim()

    if (trimmedSens === "D" || trimmedSens === "+1") {
        return { debit: amount, credit: "0" }
    }
    if (trimmedSens === "C" || trimmedSens === "-1") {
        return { debit: "0", credit: amount }
    }
    // Invalid SENS value — leave as-is, checks will catch it
    return { debit: "", credit: "" }
}

export function parseXmlFile(content: string, _fileName: string): FecParsedFile {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, "application/xml")

    const entries: FecEntry[] = []

    const journals = doc.querySelectorAll("journal")

    for (const journal of journals) {
        const journalCode = getChildText(journal, "JournalCode")
        const journalLib = getChildText(journal, "JournalLib")

        const ecritures = journal.querySelectorAll("ecriture")

        for (const ecriture of ecritures) {
            const ecritureNum = getChildText(ecriture, "EcritureNum")
            const ecritureDate = getChildText(ecriture, "EcritureDate")
            const ecritureLib = getChildText(ecriture, "EcritureLib")
            const pieceRef = getChildText(ecriture, "PieceRef")
            const pieceDate = getChildText(ecriture, "PieceDate")
            const ecritureLet = getChildText(ecriture, "EcritureLet")
            const dateLet = getChildText(ecriture, "DateLet")
            const validDate = getChildText(ecriture, "ValidDate")

            const lignes = ecriture.querySelectorAll("ligne")

            for (const ligne of lignes) {
                const compAuxNum = getChildText(ligne, "CompAuxNum") || getChildText(ligne, "CompteAuxNum")
                const compAuxLib = getChildText(ligne, "CompAuxLib") || getChildText(ligne, "CompteAuxLib")

                // Check for Montant/Sens vs Debit/Credit
                let debit = getChildText(ligne, "Debit")
                let credit = getChildText(ligne, "Credit")
                const montant = getChildText(ligne, "Montant")
                const sens = getChildText(ligne, "Sens")

                // If Montant/Sens are present and Debit/Credit are not, convert
                if (montant && sens && !debit && !credit) {
                    const converted = convertMontantSens(montant, sens)
                    debit = converted.debit
                    credit = converted.credit
                }

                const entry: FecEntry = {
                    JournalCode: journalCode,
                    JournalLib: journalLib,
                    EcritureNum: ecritureNum,
                    EcritureDate: ecritureDate,
                    CompteNum: getChildText(ligne, "CompteNum"),
                    CompteLib: getChildText(ligne, "CompteLib"),
                    CompAuxNum: compAuxNum,
                    CompAuxLib: compAuxLib,
                    PieceRef: pieceRef,
                    PieceDate: pieceDate,
                    EcritureLib: ecritureLib,
                    Debit: debit,
                    Credit: credit,
                    EcritureLet: ecritureLet,
                    DateLet: dateLet,
                    ValidDate: validDate,
                    Montantdevise: getChildText(ligne, "Montantdevise"),
                    Idevise: getChildText(ligne, "Idevise"),
                }

                entries.push(entry)
            }
        }
    }

    return {
        fileType: "xml",
        headers: [...HEADERS],
        entries,
    }
}
