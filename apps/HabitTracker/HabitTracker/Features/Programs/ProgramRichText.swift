import SwiftUI

/// Module body from the hub. The API stores the same HTML the website renders.
/// This keeps headings, lists, breaks, and emphasis instead of collapsing them into one paragraph.
struct ProgramRichText: View {
    var source: String = ""
    var blocks: [ProgramHTML.Block]? = nil

    var body: some View {
        let rendered = blocks ?? ProgramHTML.blocks(from: source)
        VStack(alignment: .leading, spacing: 14) {
            ForEach(Array(rendered.enumerated()), id: \.offset) { _, block in
                blockView(block)
            }
        }
    }

    @ViewBuilder
    private func blockView(_ block: ProgramHTML.Block) -> some View {
        switch block {
        case .heading(let level, let text):
            Text(text)
                .font(headingFont(level))
                .foregroundStyle(HTTheme.forest)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, level == 1 ? 4 : 8)
        case .eyebrow(let label, let body):
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.gold)
                    .textCase(.uppercase)
                    .tracking(0.8)
                if !body.characters.isEmpty {
                    Text(body)
                        .font(.body)
                        .foregroundStyle(HTTheme.forest)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        case .paragraph(let text):
            Text(text)
                .font(.body)
                .foregroundStyle(HTTheme.forest)
                .fixedSize(horizontal: false, vertical: true)
        case .bullets(let items):
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text("•")
                            .font(.body.weight(.bold))
                            .foregroundStyle(HTTheme.gold)
                        Text(item)
                            .font(.body)
                            .foregroundStyle(HTTheme.forest)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        case .numbers(let items):
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text("\(index + 1).")
                            .font(.body.weight(.bold))
                            .foregroundStyle(HTTheme.gold)
                        Text(item)
                            .font(.body)
                            .foregroundStyle(HTTheme.forest)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        case .rule:
            Rectangle()
                .fill(HTTheme.roseBorder)
                .frame(height: 1)
                .padding(.vertical, 4)
        }
    }

    private func headingFont(_ level: Int) -> Font {
        switch level {
        case 1:
            return .system(.title, design: .serif).weight(.bold)
        case 2:
            return .system(.title2, design: .serif).weight(.bold)
        default:
            return .system(.title3, design: .serif).weight(.semibold)
        }
    }
}

struct ProgramLessonSection {
    var blocks: [ProgramHTML.Block]
    var answerAfter: Bool
}

/// Splits a lesson so a written answer can sit under the Homework heading.
func programLessonSections(from source: String) -> [ProgramLessonSection] {
    let blocks = ProgramHTML.blocks(from: source)
    var sections: [ProgramLessonSection] = []
    var current: [ProgramHTML.Block] = []
    var inHomework = false
    for block in blocks {
        if case .heading(_, let text) = block,
           text.trimmingCharacters(in: .whitespacesAndNewlines).caseInsensitiveCompare("Homework") == .orderedSame {
            if !current.isEmpty {
                sections.append(ProgramLessonSection(blocks: current, answerAfter: false))
                current = []
            }
            current.append(block)
            inHomework = true
            continue
        }
        if inHomework, case .heading = block {
            sections.append(ProgramLessonSection(blocks: current, answerAfter: true))
            current = [block]
            inHomework = false
            continue
        }
        current.append(block)
    }
    if !current.isEmpty {
        sections.append(ProgramLessonSection(blocks: current, answerAfter: inHomework))
    }
    if sections.isEmpty {
        return [ProgramLessonSection(blocks: [], answerAfter: false)]
    }
    return sections
}

enum ProgramHTML {
    enum Block {
        case heading(level: Int, text: String)
        case eyebrow(label: String, body: AttributedString)
        case paragraph(AttributedString)
        case bullets([AttributedString])
        case numbers([AttributedString])
        case rule
    }

    static func blocks(from source: String) -> [Block] {
        let trimmed = source.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return [] }
        if !trimmed.contains("<") {
            return plain(trimmed)
        }
        return parse(trimmed)
    }

    private struct Run {
        var text: String
        var bold: Bool
        var italic: Bool
        var link: URL?
    }

    private enum Token {
        case text(String)
        case open(String, String)
        case close(String)
        case empty(String)
    }

    private static func parse(_ html: String) -> [Block] {
        let cleaned = html.replacingOccurrences(
            of: "(?is)<!--.*?-->|<(script|style)\\b[^>]*>.*?</\\1>",
            with: "",
            options: .regularExpression
        )
        var builder = Builder()
        for token in tokenize(cleaned) {
            builder.consume(token)
        }
        builder.finish()
        return builder.blocks
    }

    private static func tokenize(_ html: String) -> [Token] {
        let pattern = "<\\s*(/?)\\s*([A-Za-z][A-Za-z0-9]*)\\b([^>]*)>"
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [.text(html)] }
        let ns = html as NSString
        let full = NSRange(location: 0, length: ns.length)
        let matches = regex.matches(in: html, range: full)
        var tokens: [Token] = []
        var cursor = 0
        for match in matches {
            let range = match.range
            if range.location > cursor {
                tokens.append(.text(ns.substring(with: NSRange(location: cursor, length: range.location - cursor))))
            }
            let slash = ns.substring(with: match.range(at: 1))
            let name = ns.substring(with: match.range(at: 2)).lowercased()
            let rest = ns.substring(with: match.range(at: 3))
            let selfClosing = slash.isEmpty && (rest.trimmingCharacters(in: .whitespaces).hasSuffix("/") || name == "br" || name == "hr" || name == "img")
            if !slash.isEmpty {
                tokens.append(.close(name))
            } else if selfClosing {
                tokens.append(.empty(name))
            } else {
                tokens.append(.open(name, rest))
            }
            cursor = range.location + range.length
        }
        if cursor < ns.length {
            tokens.append(.text(ns.substring(from: cursor)))
        }
        return tokens
    }

    private struct Builder {
        var blocks: [Block] = []
        var runs: [Run] = []
        var bold = 0
        var italic = 0
        var link: URL?
        var heading: Int?
        var listOrdered = false
        var inList = false
        var inItem = false
        var items: [[Run]] = []
        var inParagraph = false
        var skip = 0

        mutating func consume(_ token: Token) {
            switch token {
            case .text(let raw):
                guard skip == 0 else { return }
                let text = ProgramHTML.collapse(ProgramHTML.decode(raw))
                if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    if inParagraph || inItem || heading != nil, text.contains(" ") || !runs.isEmpty {
                        return
                    }
                    return
                }
                if heading == nil && !inParagraph && !inItem && !inList {
                    inParagraph = true
                }
                runs.append(Run(text: text, bold: bold > 0, italic: italic > 0, link: link))
            case .open(let name, let rest):
                guard skip == 0 else {
                    if name == "script" || name == "style" { skip += 1 }
                    return
                }
                open(name, rest)
            case .close(let name):
                if name == "script" || name == "style" {
                    skip = max(0, skip - 1)
                    return
                }
                guard skip == 0 else { return }
                close(name)
            case .empty(let name):
                guard skip == 0 else { return }
                if name == "br" {
                    runs.append(Run(text: "\n", bold: false, italic: false, link: nil))
                } else if name == "hr" {
                    flushParagraph()
                    closeList()
                    blocks.append(.rule)
                }
            }
        }

        mutating func finish() {
            flushParagraph()
            closeList()
        }

        mutating func open(_ name: String, _ rest: String) {
            switch name {
            case "script", "style":
                skip += 1
            case "h1", "h2", "h3", "h4", "h5", "h6":
                flushParagraph()
                closeList()
                heading = Int(String(name.dropFirst())) ?? 2
                inParagraph = true
            case "p", "blockquote":
                if !inItem {
                    flushParagraph()
                    inParagraph = true
                }
            case "ul":
                flushParagraph()
                closeList()
                inList = true
                listOrdered = false
            case "ol":
                flushParagraph()
                closeList()
                inList = true
                listOrdered = true
            case "li":
                if !inList {
                    inList = true
                    listOrdered = false
                }
                if inItem { closeItem() }
                inItem = true
                runs = []
            case "strong", "b":
                bold += 1
            case "em", "i":
                italic += 1
            case "a":
                if let href = ProgramHTML.attribute("href", in: rest), let url = URL(string: href) {
                    link = url
                }
            default:
                break
            }
        }

        mutating func close(_ name: String) {
            switch name {
            case "h1", "h2", "h3", "h4", "h5", "h6":
                let title = ProgramHTML.tidy(runs).map(\.text).joined().trimmingCharacters(in: .whitespacesAndNewlines)
                if !title.isEmpty {
                    blocks.append(.heading(level: heading ?? 2, text: title))
                }
                runs = []
                heading = nil
                inParagraph = false
            case "p", "blockquote":
                if inItem { return }
                flushParagraph()
            case "li":
                closeItem()
            case "ul", "ol":
                closeList()
            case "strong", "b":
                bold = max(0, bold - 1)
            case "em", "i":
                italic = max(0, italic - 1)
            case "a":
                link = nil
            default:
                break
            }
        }

        mutating func closeItem() {
            let item = ProgramHTML.tidy(runs)
            if !item.isEmpty { items.append(item) }
            runs = []
            inItem = false
        }

        mutating func closeList() {
            if inItem { closeItem() }
            guard inList else { return }
            let rendered = items.map { ProgramHTML.attributed($0) }.filter { !$0.characters.isEmpty }
            if !rendered.isEmpty {
                blocks.append(listOrdered ? .numbers(rendered) : .bullets(rendered))
            }
            items = []
            inList = false
            listOrdered = false
        }

        mutating func flushParagraph() {
            guard heading == nil else { return }
            let source = runs
            runs = []
            inParagraph = false
            guard !inItem && !inList else { return }
            for line in ProgramHTML.lines(from: source) {
                let row = ProgramHTML.tidy(line)
                guard !row.isEmpty else { continue }
                if let eyebrow = ProgramHTML.eyebrow(from: row) {
                    blocks.append(.eyebrow(label: eyebrow.label, body: eyebrow.body))
                } else {
                    let text = ProgramHTML.attributed(row)
                    if !text.characters.isEmpty {
                        blocks.append(.paragraph(text))
                    }
                }
            }
        }
    }

    private static func lines(from runs: [Run]) -> [[Run]] {
        var rows: [[Run]] = [[]]
        for run in runs {
            let parts = run.text.components(separatedBy: "\n")
            for (index, part) in parts.enumerated() {
                if index > 0 { rows.append([]) }
                if part.isEmpty { continue }
                var next = run
                next.text = part
                rows[rows.count - 1].append(next)
            }
        }
        return rows
    }

    private static func tidy(_ runs: [Run]) -> [Run] {
        var copy = runs
        while let first = copy.first, first.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            copy.removeFirst()
        }
        while let last = copy.last, last.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            copy.removeLast()
        }
        guard !copy.isEmpty else { return [] }
        copy[0].text = copy[0].text.replacingOccurrences(of: "^\\s+", with: "", options: .regularExpression)
        let last = copy.count - 1
        copy[last].text = copy[last].text.replacingOccurrences(of: "\\s+$", with: "", options: .regularExpression)
        return copy.filter { !$0.text.isEmpty }
    }

    private static func eyebrow(from runs: [Run]) -> (label: String, body: AttributedString)? {
        guard let first = runs.first, first.bold else { return nil }
        let label = first.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard label.count > 1, label.count <= 48, label.hasSuffix(":") else { return nil }
        let name = String(label.dropLast()).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return nil }
        return (name, attributed(Array(runs.dropFirst())))
    }

    private static func attributed(_ runs: [Run]) -> AttributedString {
        var out = AttributedString()
        for run in tidy(runs) {
            var piece = AttributedString(run.text)
            if run.bold && run.italic {
                piece.font = .body.bold().italic()
            } else if run.bold {
                piece.font = .body.bold()
            } else if run.italic {
                piece.font = .body.italic()
            }
            piece.foregroundColor = HTTheme.forest
            if let link = run.link {
                piece.link = link
            }
            out.append(piece)
        }
        return out
    }

    private static func collapse(_ text: String) -> String {
        text.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
    }

    private static func decode(_ raw: String) -> String {
        var text = raw.replacingOccurrences(of: "\u{00A0}", with: " ")
        var output = ""
        var index = text.startIndex
        while index < text.endIndex {
            if text[index] == "&", let end = text[index...].firstIndex(of: ";"), text.distance(from: index, to: end) < 12 {
                let token = String(text[index...end])
                if token.hasPrefix("&#") {
                    let body = token.dropFirst(2).dropLast()
                    let scalar: UInt32?
                    if body.first == "x" || body.first == "X" {
                        scalar = UInt32(body.dropFirst(), radix: 16)
                    } else {
                        scalar = UInt32(body)
                    }
                    if let scalar, let unicode = UnicodeScalar(scalar) {
                        output.append(Character(unicode))
                        index = text.index(after: end)
                        continue
                    }
                }
            }
            output.append(text[index])
            index = text.index(after: index)
        }
        text = output
        let named = [
            "&nbsp;": " ",
            "&ndash;": "–",
            "&mdash;": "—",
            "&rsquo;": "’",
            "&lsquo;": "‘",
            "&rdquo;": "”",
            "&ldquo;": "“",
            "&hellip;": "…",
            "&quot;": "\"",
            "&#39;": "'",
            "&apos;": "'",
            "&frac12;": "½",
            "&lt;": "<",
            "&gt;": ">",
            "&amp;": "&",
        ]
        for (key, value) in named {
            text = text.replacingOccurrences(of: key, with: value)
        }
        return text
    }

    private static func attribute(_ name: String, in rest: String) -> String? {
        let pattern = "\\b\(name)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return nil }
        let ns = rest as NSString
        guard let match = regex.firstMatch(in: rest, range: NSRange(location: 0, length: ns.length)) else { return nil }
        if match.range(at: 1).location != NSNotFound { return decode(ns.substring(with: match.range(at: 1))) }
        if match.range(at: 2).location != NSNotFound { return decode(ns.substring(with: match.range(at: 2))) }
        return nil
    }

    private static func plain(_ text: String) -> [Block] {
        let normalized = text.replacingOccurrences(of: "\r\n", with: "\n").replacingOccurrences(of: "\r", with: "\n")
        var blocks: [Block] = []
        for chunk in normalized.components(separatedBy: "\n\n") {
            let trimmed = chunk.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty { continue }
            if trimmed.hasPrefix("#") {
                let title = trimmed.drop(while: { $0 == "#" || $0 == " " })
                if !title.isEmpty {
                    blocks.append(.heading(level: 2, text: String(title)))
                }
                continue
            }
            let lines = trimmed.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            if !lines.isEmpty && lines.allSatisfy({ $0.hasPrefix("- ") || $0.hasPrefix("* ") || $0.hasPrefix("• ") }) {
                let items = lines.map { line -> AttributedString in
                    let body = line.hasPrefix("• ") ? String(line.dropFirst(2)) : String(line.dropFirst(2))
                    return inline(body)
                }
                blocks.append(.bullets(items))
                continue
            }
            blocks.append(.paragraph(inline(trimmed)))
        }
        return blocks
    }

    private static func inline(_ markdown: String) -> AttributedString {
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        if let parsed = try? AttributedString(markdown: markdown, options: options) {
            return parsed
        }
        return AttributedString(markdown)
    }
}
