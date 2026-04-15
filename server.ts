import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url.startsWith('/api/')) {
    console.log('Body keys:', Object.keys(req.body));
  }
  next();
});

// Turso Database Setup
const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://bnhreport-bigbundit.aws-ap-northeast-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYyNjMxOTksImlkIjoiMDE5ZDkxODktNTkwMS03YTMyLTk3MzYtODM1NDBjN2IxMzkwIiwicmlkIjoiOTk4MjkzMDItNzIzOS00YjUzLTlhM2MtNmI3YTBiY2E5NmE5In0.AGXZB_qQzdsoZkOtiRJiEhyY5TiCH6z3aH4bJQI8dC8uOcST8tPWdsd8oN1kTpmUs6iMmG_JQXFWjNfv-rsoBQ';

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

// Initialize DB
async function initDb() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id TEXT PRIMARY KEY,
        tokens TEXT NOT NULL
      )
    `);
    console.log('Turso DB initialized successfully');
  } catch (e) {
    console.error('Failed to initialize Turso DB:', e);
  }
}
initDb();

async function saveTokens(tokens: any) {
  try {
    await db.execute({
      sql: `INSERT INTO oauth_tokens (id, tokens) VALUES ('default', ?)
            ON CONFLICT(id) DO UPDATE SET tokens = excluded.tokens`,
      args: [JSON.stringify(tokens)]
    });
  } catch (e) {
    console.error('Error saving tokens to Turso:', e);
  }
}

async function getTokens() {
  try {
    const result = await db.execute("SELECT tokens FROM oauth_tokens WHERE id = 'default'");
    if (result.rows.length > 0) {
      return JSON.parse(result.rows[0].tokens as string);
    }
  } catch (e) {
    console.error('Error reading tokens from Turso:', e);
  }
  return null;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Google OAuth Config
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const getBaseUrl = () => {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:3000`;
};

const REDIRECT_URI = `${getBaseUrl()}/auth/callback`;

app.get('/api/auth/url', (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not set in environment variables' });
  }

  const scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    }).toString();

  res.json({ url });
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const tokens = response.data;
    await saveTokens(tokens);

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error exchanging code:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/status', async (req, res) => {
  const tokens = await getTokens();
  res.json({ authenticated: !!tokens?.refresh_token });
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    await db.execute("DELETE FROM oauth_tokens WHERE id = 'default'");
  } catch (e) {
    console.error('Error deleting tokens from Turso:', e);
  }
  res.json({ success: true });
});

async function getAccessToken() {
  const tokens = await getTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh token available');
  }

  // If token is still valid (we could check expiry, but simpler to just refresh if needed or always refresh for now)
  // For simplicity, let's just refresh it
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token'
    });

    const newTokens = { ...tokens, ...response.data };
    await saveTokens(newTokens);
    return newTokens.access_token;
  } catch (error: any) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    throw new Error('Failed to refresh access token');
  }
}

// Proxy GA4/GSC requests - Using a very generic name to avoid proxy interference
app.post('/api/fetch-data/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { url, method, body } = req.body;

    console.log(`[Proxy] ${service} -> ${url}`);

    if (!url) {
      return res.status(400).json({ error: 'Missing URL in request body' });
    }

    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (e: any) {
      console.error('[Proxy] Auth failed:', e.message);
      return res.status(401).json({ error: 'Authentication failed', details: e.message });
    }

    try {
      const response = await axios({
        url,
        method: method || 'GET',
        data: body,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 30000 // 30s timeout
      });
      
      console.log(`[Proxy] ${service} Success: ${response.status}`);
      return res.json(response.data);
    } catch (error: any) {
      const errorStatus = error.response?.status || 500;
      const errorData = error.response?.data;
      
      console.error(`[Proxy] ${service} Google Error (${errorStatus}):`, 
        typeof errorData === 'object' ? JSON.stringify(errorData) : errorData || error.message
      );
      
      return res.status(errorStatus).json({
        error: error.message,
        status: errorStatus,
        service,
        details: errorData
      });
    }
  } catch (fatalError: any) {
    console.error('[Proxy] Fatal Error:', fatalError);
    return res.status(500).json({ error: 'Internal Server Error', details: fatalError.message });
  }
});

if (!process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Environment Check:');
      console.log(`- GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
      console.log(`- GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
      console.log(`- APP_URL: ${process.env.APP_URL || '❌ Missing (using localhost default)'}`);
      console.log(`- REDIRECT_URI: ${REDIRECT_URI}`);
    });
  }

  startServer();
}

export default app;
