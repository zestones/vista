import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Lazy-loaded (#92) so react-markdown stays out of the main bundle. GFM enabled. We do NOT add
 * rehype-raw, so raw HTML in a comment is escaped (not rendered) and react-markdown's default URL
 * transform strips dangerous protocols -> XSS-safe for untrusted GitHub comment bodies.
 */
export default function CommentMarkdown({ children }: { children: string }) {
  return (
    <div className='cmt-md'>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
