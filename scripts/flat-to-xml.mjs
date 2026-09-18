#!/usr/bin/env node
/**
 * Converts a flat-file FEC (TSV or pipe-delimited) to the official XML format
 * conforming to the XSD schema formatA47A-I-VII-1.xsd.
 *
 * Usage: node scripts/flat-to-xml.mjs <input.txt> [output.xml]
 *
 * If output is omitted, it is derived by replacing the extension with .xml.
 */

import { readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, join } from "node:path"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape XML special characters. */
function escapeXml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

/** Convert YYYYMMDD → YYYY-MM-DD. Returns empty string for blank/invalid. */
function convertDate(d) {
    if (!d || d.trim() === "") return ""
    const s = d.trim()
    if (s.length === 8 && /^\d{8}$/.test(s)) {
        return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    }
    // Already in ISO format or other — return as-is
    return s
}

/**
 * Convert a French-style numeric amount ("1 234,56") to xs:float ("1234.56").
 * Returns "0" for empty/blank values.
 */
function convertAmount(v) {
    if (!v || v.trim() === "") return "0"
    // Remove spaces (thousand separators), replace comma with dot
    const cleaned = v.trim().replace(/\s/g, "").replace(",", ".")
    const num = Number.parseFloat(cleaned)
    if (Number.isNaN(num)) return "0"
    return num.toString()
}

/** Indent helper: returns `depth * 2` spaces. */
function indent(depth) {
    return "  ".repeat(depth)
}

// ---------------------------------------------------------------------------
// Parse flat file
// ---------------------------------------------------------------------------

function parseFlatFile(content) {
    const lines = content.split(/\r?\n/)
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop()
    if (lines.length === 0) throw new Error("Empty file")

    const headerLine = lines[0]
    let separator
    if (headerLine.split("\t").length >= 5) separator = "\t"
    else if (headerLine.split("|").length >= 5) separator = "|"
    else separator = "\t"

    const headers = headerLine.split(separator).map((h) => h.trim())
    const entries = []
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue
        const values = lines[i].split(separator)
        const entry = {}
        for (let j = 0; j < headers.length; j++) {
            entry[headers[j]] = (values[j] ?? "").trim()
        }
        entries.push(entry)
    }
    return { headers, entries }
}

// ---------------------------------------------------------------------------
// Extract DateCloture from filename
// ---------------------------------------------------------------------------

function extractDateCloture(fileName) {
    // Pattern: SIRENFECyyyymmdd.txt → extract yyyymmdd
    const m = basename(fileName).match(/FEC(\d{8})/i)
    if (!m) throw new Error(`Cannot extract DateCloture from filename: ${fileName}`)
    return convertDate(m[1])
}

// ---------------------------------------------------------------------------
// Group entries into journal → ecriture → ligne hierarchy
// ---------------------------------------------------------------------------

function buildHierarchy(entries) {
    // Map: JournalCode → { JournalLib, ecritures: Map<EcritureNum, { ..., lignes }> }
    const journals = new Map()

    for (const entry of entries) {
        const jCode = entry.JournalCode ?? ""
        const jLib = entry.JournalLib ?? ""

        if (!journals.has(jCode)) {
            journals.set(jCode, { JournalCode: jCode, JournalLib: jLib, ecritures: new Map() })
        }
        const journal = journals.get(jCode)

        const eNum = entry.EcritureNum ?? ""
        if (!journal.ecritures.has(eNum)) {
            journal.ecritures.set(eNum, {
                EcritureNum: eNum,
                EcritureDate: entry.EcritureDate ?? "",
                EcritureLib: entry.EcritureLib ?? "",
                PieceRef: entry.PieceRef ?? "",
                PieceDate: entry.PieceDate ?? "",
                EcritureLet: entry.EcritureLet ?? "",
                DateLet: entry.DateLet ?? "",
                ValidDate: entry.ValidDate ?? "",
                lignes: [],
            })
        }

        journal.ecritures.get(eNum).lignes.push(entry)
    }

    return journals
}

// ---------------------------------------------------------------------------
// Build XML
// ---------------------------------------------------------------------------

function buildXml(journals, dateCloture) {
    const parts = []

    parts.push('<?xml version="1.0" encoding="UTF-8"?>')
    parts.push("<comptabilite>")
    parts.push(`${indent(1)}<exercice>`)
    parts.push(`${indent(2)}<DateCloture>${dateCloture}</DateCloture>`)

    for (const [, journal] of journals) {
        parts.push(`${indent(2)}<journal>`)
        parts.push(`${indent(3)}<JournalCode>${escapeXml(journal.JournalCode)}</JournalCode>`)
        parts.push(`${indent(3)}<JournalLib>${escapeXml(journal.JournalLib)}</JournalLib>`)

        for (const [, ecriture] of journal.ecritures) {
            parts.push(`${indent(3)}<ecriture>`)
            parts.push(`${indent(4)}<EcritureNum>${escapeXml(ecriture.EcritureNum)}</EcritureNum>`)
            parts.push(`${indent(4)}<EcritureDate>${convertDate(ecriture.EcritureDate)}</EcritureDate>`)
            parts.push(`${indent(4)}<EcritureLib>${escapeXml(ecriture.EcritureLib)}</EcritureLib>`)
            parts.push(`${indent(4)}<PieceRef>${escapeXml(ecriture.PieceRef)}</PieceRef>`)
            parts.push(`${indent(4)}<PieceDate>${convertDate(ecriture.PieceDate)}</PieceDate>`)

            // Optional elements
            if (ecriture.EcritureLet) {
                parts.push(`${indent(4)}<EcritureLet>${escapeXml(ecriture.EcritureLet)}</EcritureLet>`)
            }
            if (ecriture.DateLet) {
                parts.push(`${indent(4)}<DateLet>${convertDate(ecriture.DateLet)}</DateLet>`)
            }

            parts.push(`${indent(4)}<ValidDate>${convertDate(ecriture.ValidDate)}</ValidDate>`)

            for (const ligne of ecriture.lignes) {
                parts.push(`${indent(4)}<ligne>`)
                parts.push(`${indent(5)}<CompteNum>${escapeXml(ligne.CompteNum ?? "")}</CompteNum>`)
                parts.push(`${indent(5)}<CompteLib>${escapeXml(ligne.CompteLib ?? "")}</CompteLib>`)

                // CompAuxNum / CompAuxLib — optional
                const compAuxNum = ligne.CompAuxNum ?? ""
                const compAuxLib = ligne.CompAuxLib ?? ""
                if (compAuxNum) {
                    parts.push(`${indent(5)}<CompAuxNum>${escapeXml(compAuxNum)}</CompAuxNum>`)
                }
                if (compAuxLib) {
                    parts.push(`${indent(5)}<CompAuxLib>${escapeXml(compAuxLib)}</CompAuxLib>`)
                }

                // Montantdevise / Idevise — optional
                const montantdevise = ligne.Montantdevise ?? ""
                const idevise = ligne.Idevise ?? ""
                if (montantdevise) {
                    parts.push(`${indent(5)}<Montantdevise>${escapeXml(montantdevise)}</Montantdevise>`)
                }
                if (idevise) {
                    parts.push(`${indent(5)}<Idevise>${escapeXml(idevise)}</Idevise>`)
                }

                // Debit/Credit: per XSD xs:choice, emit only one non-zero value
                const debitVal = convertAmount(ligne.Debit ?? "")
                const creditVal = convertAmount(ligne.Credit ?? "")
                const debitNum = Number.parseFloat(debitVal)
                const creditNum = Number.parseFloat(creditVal)

                if (debitNum !== 0 && creditNum === 0) {
                    parts.push(`${indent(5)}<Debit>${debitVal}</Debit>`)
                } else if (creditNum !== 0 && debitNum === 0) {
                    parts.push(`${indent(5)}<Credit>${creditVal}</Credit>`)
                } else if (debitNum !== 0 && creditNum !== 0) {
                    // Both non-zero — unusual, prefer debit
                    parts.push(`${indent(5)}<Debit>${debitVal}</Debit>`)
                } else {
                    // Both zero — emit Debit with 0
                    parts.push(`${indent(5)}<Debit>0</Debit>`)
                }

                parts.push(`${indent(4)}</ligne>`)
            }

            parts.push(`${indent(3)}</ecriture>`)
        }

        parts.push(`${indent(2)}</journal>`)
    }

    parts.push(`${indent(1)}</exercice>`)
    parts.push("</comptabilite>")

    return `${parts.join("\n")}\n`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const inputPath = process.argv[2]
if (!inputPath) {
    console.error("Usage: node scripts/flat-to-xml.mjs <input.txt> [output.xml]")
    process.exit(1)
}

const outputPath = process.argv[3] ?? join(dirname(inputPath), basename(inputPath).replace(/\.[^.]+$/, ".xml"))

console.log(`Reading: ${inputPath}`)
const content = readFileSync(inputPath, "utf-8")

const { entries } = parseFlatFile(content)
console.log(`Parsed ${entries.length} entries`)

const dateCloture = extractDateCloture(inputPath)
console.log(`DateCloture: ${dateCloture}`)

const journals = buildHierarchy(entries)
console.log(`Journals: ${journals.size}`)

let totalEcritures = 0
for (const [, j] of journals) totalEcritures += j.ecritures.size
console.log(`Ecritures: ${totalEcritures}`)

const xml = buildXml(journals, dateCloture)
writeFileSync(outputPath, xml, "utf-8")
console.log(`Written: ${outputPath} (${(xml.length / 1024).toFixed(1)} KB)`)
