import type { FecEntry, FecParsedFile, FecParsedLineIssue } from "./types.js"

export function parseFlatFile(content: string, _fileName: string): FecParsedFile {
    // Split lines, handling both \r\n and \n
    const lines = content.split(/\r?\n/)

    // Remove trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1]!.trim() === "") {
        lines.pop()
    }

    if (lines.length === 0) {
        return {
            fileType: "flat",
            headers: [],
            entries: [],
            separator: "\t",
            lineIssues: [],
        }
    }

    const headerLine = lines[0]!

    // Detect separator: try tab first, then pipe, default to tab
    let separator: string
    if (headerLine.split("\t").length >= 5) {
        separator = "\t"
    } else if (headerLine.split("|").length >= 5) {
        separator = "|"
    } else {
        separator = "\t"
    }

    // Parse header
    const headers = headerLine.split(separator).map((h) => h.trim())

    // Parse data rows
    const entries: FecEntry[] = []
    const lineIssues: FecParsedLineIssue[] = []

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]!
        const lineNumber = i + 1 // 1-based

        if (line.trim() === "") {
            lineIssues.push({ line: lineNumber, kind: "empty" })
            continue
        }

        const values = line.split(separator)

        // Track field count mismatch (Alto2 check #13)
        if (values.length !== headers.length) {
            lineIssues.push({
                line: lineNumber,
                kind: "field_count_mismatch",
                expectedFields: headers.length,
                actualFields: values.length,
            })
        }

        const entry: FecEntry = {}
        for (let j = 0; j < headers.length; j++) {
            entry[headers[j]!] = (values[j] ?? "").trim()
        }
        entries.push(entry)
    }

    return {
        fileType: "flat",
        headers,
        entries,
        separator,
        lineIssues,
    }
}
