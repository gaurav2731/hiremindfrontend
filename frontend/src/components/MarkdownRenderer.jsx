import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components = {
  // Only override for elements needing special behavior beyond CSS
  code: ({ children, inline, ...props }) => {
    if (inline) {
      return (
        <code className="markdown-inline-code" {...props}>{children}</code>
      )
    }
    return (
      <pre className="markdown-pre">
        <code {...props}>{children}</code>
      </pre>
    )
  },
  table: ({ children, ...props }) => (
    <div className="markdown-table-wrapper">
      <table {...props}>{children}</table>
    </div>
  ),
  tr: ({ children, ...props }) => (
    <tr className="markdown-tr" {...props}>{children}</tr>
  ),
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
