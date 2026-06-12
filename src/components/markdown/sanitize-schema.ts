import { defaultSchema } from 'rehype-sanitize'

type Schema = typeof defaultSchema

/**
 * Sanitize schema for raw-HTML markdown (#261). We enable `rehype-raw` so HTML `<img>` embedded in
 * GitHub bodies/comments renders at all — but raw HTML from synced repos is untrusted, so everything
 * passes through `rehype-sanitize` first. This extends GitHub's defaultSchema to:
 *   - allow `<img>` with safe attrs (src restricted to http/https — no data:/javascript: URIs),
 *   - allow `className` everywhere so fenced-code `language-*` (incl. our mermaid sentinel) and the
 *     remark-alert callout classes survive sanitization (class values can't execute script),
 *   - allow the inline `<svg>`/`<path>` that remark-github-blockquote-alert emits for callout icons.
 * Event handlers (onerror, onclick, …) and `<script>` are not in any allowlist, so they're stripped.
 * Order matters in the pipeline: raw -> sanitize -> highlight, so highlight's own classes are trusted.
 */
export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'img', 'svg', 'path'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    svg: ['className', 'viewBox', 'width', 'height', 'ariaHidden', 'role', 'version'],
    path: ['d', 'fillRule', 'clipRule'],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ['http', 'https'],
  },
}
