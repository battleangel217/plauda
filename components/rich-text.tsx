'use client'

function safeHref(value: string) {
  return /^https?:\/\//i.test(value) ? value : null
}

function renderInline(text: string) {
  const pattern =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<>()]+)/g
  const parts = text.split(pattern)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      )
    }

    const markdownLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (markdownLink) {
      const href = safeHref(markdownLink[2])
      if (href) {
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {markdownLink[1]}
          </a>
        )
      }
      return <span key={index}>{markdownLink[1]}</span>
    }

    if (/^https?:\/\//i.test(part)) {
      const href = safeHref(part)
      if (href) {
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline underline-offset-2"
          >
            {part}
          </a>
        )
      }
    }

    return <span key={index}>{part}</span>
  })
}

function isTableRow(line: string) {
  return /^\s*\|.*\|\s*$/.test(line)
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableDivider(cells: string[]) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function Table({ rows }: { rows: string[][] }) {
  const [header, ...body] = rows
  if (!header) return null

  return (
    <div className="my-2 overflow-x-auto rounded-[6px] border">
      <table className="w-full min-w-max border-collapse text-left text-xs">
        <thead className="bg-muted/60">
          <tr>
            {header.map((cell, index) => (
              <th key={index} className="border-b px-2.5 py-1.5 font-semibold">
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-2.5 py-1.5 align-top">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let list: string[] = []
  let table: string[][] = []

  const flushList = () => {
    if (!list.length) return
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-1 list-disc space-y-0.5 pl-4">
        {list.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    list = []
  }

  const flushTable = () => {
    if (!table.length) return
    blocks.push(<Table key={`table-${blocks.length}`} rows={table} />)
    table = []
  }

  const flushAll = () => {
    flushList()
    flushTable()
  }

  lines.forEach((line, index) => {
    if (isTableRow(line)) {
      flushList()
      const cells = splitTableRow(line)
      if (!isTableDivider(cells)) table.push(cells)
      return
    }

    flushTable()

    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ''))
      return
    }

    flushList()

    if (!line.trim()) {
      blocks.push(<div key={`space-${index}`} className="h-2" />)
      return
    }

    const heading = line.match(/^\s*(#{1,4})\s+(.*)$/)
    if (heading) {
      blocks.push(
        <p key={`heading-${index}`} className="mt-1 font-semibold">
          {renderInline(heading[2])}
        </p>,
      )
      return
    }

    blocks.push(
      <p key={`line-${index}`} className="whitespace-pre-wrap">
        {renderInline(line)}
      </p>,
    )
  })

  flushAll()
  return <>{blocks}</>
}

export { RichText }
