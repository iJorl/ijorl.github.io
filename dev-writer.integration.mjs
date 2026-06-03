// Dev-only authoring backend for "write mode".
//
// Registers a Vite middleware that handles /api/post during `astro dev`:
//   GET  /api/post?slug=<slug>   -> { slug, file, content }
//   POST /api/post  { slug, content } -> writes the file
//
// This lives only on the dev server. It is never part of `astro build`, so the
// static site / GitHub Pages deploy ships no writable endpoint and needs no
// SSR adapter.
import fs from 'node:fs/promises';
import path from 'node:path';

const POSTS_DIR = path.join(process.cwd(), 'src', 'pages', 'blog', 'posts');
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

// Resolve a slug to an existing post file, refusing anything outside POSTS_DIR.
async function resolveFile(slug) {
  for (const ext of ['.mdx', '.md']) {
    const file = path.join(POSTS_DIR, slug + ext);
    if (path.dirname(file) !== POSTS_DIR) return null; // traversal guard
    try {
      await fs.access(file);
      return file;
    } catch {
      /* try next extension */
    }
  }
  return null;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(obj));
}

export default function devWriter() {
  return {
    name: 'dev-writer',
    hooks: {
      'astro:server:setup': ({ server }) => {
        const handler = async (req, res, next) => {
          const url = new URL(req.url, 'http://localhost');
          if (url.pathname !== '/api/post') return next();

          try {
            if (req.method === 'GET') {
              const slug = url.searchParams.get('slug') ?? '';
              if (!SLUG_RE.test(slug)) return send(res, 400, { error: 'invalid slug' });
              const file = await resolveFile(slug);
              if (!file) return send(res, 404, { error: 'post not found' });
              const content = await fs.readFile(file, 'utf8');
              return send(res, 200, { slug, file: path.relative(process.cwd(), file), content });
            }

            if (req.method === 'POST') {
              let raw = '';
              for await (const chunk of req) raw += chunk;
              let body;
              try {
                body = JSON.parse(raw);
              } catch {
                return send(res, 400, { error: 'invalid JSON body' });
              }
              const slug = body.slug ?? '';
              if (!SLUG_RE.test(slug)) return send(res, 400, { error: 'invalid slug' });
              if (typeof body.content !== 'string')
                return send(res, 400, { error: 'content must be a string' });
              const file = await resolveFile(slug);
              if (!file) return send(res, 404, { error: 'post not found' });
              await fs.writeFile(file, body.content, 'utf8');
              return send(res, 200, { ok: true, bytes: Buffer.byteLength(body.content, 'utf8') });
            }

            return send(res, 405, { error: 'method not allowed' });
          } catch (err) {
            return send(res, 500, { error: String(err?.message || err) });
          }
        };

        // Run before Astro's own routing so /api/post isn't 404'd as a page.
        server.middlewares.stack.unshift({ route: '', handle: handler });
      },
    },
  };
}
