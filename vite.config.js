import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function emailMiddlewarePlugin() {
  return {
    name: 'email-middleware',
    configureServer(server) {
      server.middlewares.use('/api/send-email', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              console.log(`[EMAIL ALERT] Til: ${data.to} | Emne: ${data.subject}`)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, deliveredTo: data.to, time: new Date().toISOString() }))
            } catch (err) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        } else {
          res.statusCode = 405
          res.end()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emailMiddlewarePlugin()],
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, '')
      }
    }
  }
})
