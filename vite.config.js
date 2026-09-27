import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import nodemailer from 'nodemailer'

function emailMiddlewarePlugin() {
  return {
    name: 'email-middleware',
    configureServer(server) {
      server.middlewares.use('/api/send-email', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const data = JSON.parse(body)
              console.log(`[EMAIL ALERT] Til: ${data.to} | Emne: ${data.subject}`)

              const appPass = data.appPassword || process.env.GMAIL_APP_PASSWORD
              const resendKey = data.resendApiKey || process.env.RESEND_API_KEY
              let deliveryMethod = 'local_logged'
              let externalResult = null

              // 1. Send via Resend hvis API-nøgle er angivet
              if (resendKey) {
                try {
                  const resendResp = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${resendKey}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      from: 'Sincity Aktie Radar <onboarding@resend.dev>',
                      to: [data.to],
                      subject: data.subject,
                      html: data.html
                    })
                  })
                  externalResult = await resendResp.json()
                  deliveryMethod = 'resend'
                  console.log(`[RESEND SUCCESS]`, externalResult)
                } catch (resendErr) {
                  console.warn(`[RESEND ERROR]`, resendErr.message)
                }
              }
              // 2. Send via Google Gmail SMTP hvis App Password er angivet
              else if (appPass) {
                try {
                  const cleanPass = appPass.replace(/\s+/g, '')
                  const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: data.senderEmail || 'sincity888@gmail.com',
                      pass: cleanPass
                    }
                  })
                  const info = await transporter.sendMail({
                    from: `"Sincity Aktie Radar" <${data.senderEmail || 'sincity888@gmail.com'}>`,
                    to: data.to,
                    subject: data.subject,
                    text: data.text,
                    html: data.html
                  })
                  deliveryMethod = 'gmail_smtp'
                  externalResult = { messageId: info.messageId }
                  console.log(`[GMAIL SMTP SUCCESS] Sendt til ${data.to}! MessageID:`, info.messageId)
                } catch (smtpErr) {
                  console.warn(`[GMAIL SMTP ERROR]`, smtpErr.message)
                  externalResult = { error: smtpErr.message }
                }
              }

              // Send også altid en direkte live push-notifikation via ntfy.sh
              try {
                const asciiTitle = (data.subject || 'Aktiealarm')
                  .replace(/[^a-zA-Z0-9\s\-\:\.\,\(\)\%\+]/g, '')
                  .trim()
                await fetch('https://ntfy.sh/sincity_aktie_radar', {
                  method: 'POST',
                  headers: {
                    'Title': asciiTitle || 'Sincity Aktie Radar',
                    'Priority': 'high'
                  },
                  body: data.text || data.subject
                })
              } catch (ntfyErr) {
                // Ignore ntfy background errors
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                deliveredTo: data.to,
                method: deliveryMethod,
                externalResult,
                time: new Date().toISOString()
              }))
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
