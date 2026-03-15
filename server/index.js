import express from 'express'
import cors from 'cors'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { kv } from '@vercel/kv'
import { handleUpload } from '@vercel/blob/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data')
const UPLOADS_DIR = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads')
const DIST_DIR = path.join(__dirname, 'dist')

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json')
const GALLERY_FILE = path.join(DATA_DIR, 'gallery.json')
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json')
const CATALOGS_FILE = path.join(DATA_DIR, 'catalogs.json')
const CONTACT_FILE = path.join(DATA_DIR, 'contact.json')

// --- DATA ACCESS LAYER ---
// Abstract storage to switch between File System (Dev) and Vercel KV (Prod)

const DB = {
  products: 'products',
  gallery: 'gallery',
  categories: 'categories',
  catalogs: 'catalogs',
  contact: 'contact'
}

// Default Data
const defaultProducts = [
  { id: 1, model: '6108', category: 'tueren', image: '/products/6108.jpg', color: 'RAL 7016 / Dekorfolie Golden Oak', glazing: '3D Edelstahl Lisenen', handle: 'PQ 40 x 20 - 160mm', application: 'Eingangstür' },
  { id: 2, model: '6110', category: 'tueren', image: '/products/6110.jpg', color: 'RAL 9007 / Dekorfolie Montana', glazing: 'Satiniert, durchsichtige Streifen', handle: 'PS 10 - 1200mm', application: 'Eingangstür' },
  { id: 7, model: 'F-220', category: 'fenster', image: '/products/F-220.jpg', color: 'Anthrazit matt', glazing: '3-fach Wärmeschutz', handle: 'Alu-Griff standard', application: 'Neubau & Sanierung' }
]
const defaultGallery = [
  { id: 1, category: 'fenster', image: '/gallery/1.jpg' },
  { id: 2, category: 'tueren', image: '/gallery/2.jpg' },
  { id: 3, category: 'rolllaeden', image: '/gallery/3.jpg' }
]
const defaultCategories = [
  { id: 'fenster', enabled: true, image: '/categories/fenster.jpg' },
  { id: 'tueren', enabled: true, image: '/categories/tueren.webp' },
  { id: 'rolllaeden', enabled: true, image: '/categories/rolllaeden.png' },
  { id: 'raffstore', enabled: true, image: '/categories/raffstore.webp' },
  { id: 'garagentor', enabled: true, image: '/categories/garagentor.svg' },
  { id: 'haustueren', enabled: true, image: '/categories/default.svg' },
  { id: 'insektenschutz', enabled: true, image: '/categories/default.svg' },
  { id: 'markisen', enabled: true, image: '/categories/default.svg' },
  { id: 'innenturen', enabled: true, image: '/categories/default.svg' },
  { id: 'terrassenueberdachungen', enabled: true, image: '/categories/default.svg' }
]
const defaultCatalogs = [
  { id: 1, title: 'Katalog Eingangstüren', subtitle: 'Despiro (DE)', cover: '/catalog-covers/1.jpg', pdf: '/catalogs/Katalog_Eingangsturen-Despiro_DE.pdf' },
  { id: 2, title: 'Katalog Innentüren', subtitle: 'Innenbereich (DE)', cover: '/catalog-covers/2.jpg', pdf: '/catalogs/Katalog_Innenturen_DE.pdf' },
  { id: 3, title: 'Katalog Holz', subtitle: 'Holzserie (DE)', cover: '/catalog-covers/3.jpg', pdf: '/catalogs/Katalog_Holz_DE.pdf' },
  { id: 4, title: 'Katalog Stahl', subtitle: 'Stahltüren (DE)', cover: '/catalog-covers/4.jpg', pdf: '/catalogs/Katalog_Stahl_DE.pdf' },
  { id: 5, title: 'Katalog Aluminium', subtitle: 'Aluminiumserie (DE)', cover: '/catalog-covers/5.jpg', pdf: '/catalogs/Katalog_Aluminium_DE.pdf' },
  { id: 6, title: 'Katalog Garagentor', subtitle: 'Garagentore (DE)', cover: '/catalog-covers/6.jpg', pdf: '/catalogs/Katalog_Garagentor_DE.pdf' },
  { id: 7, title: 'Katalog Fassadenjalousien', subtitle: 'Sonnenschutz (DE)', cover: '/catalog-covers/7.jpg', pdf: '/catalogs/Katalog_Fassadenjalousien_DE.pdf' },
  { id: 8, title: 'Katalog Produkt mini', subtitle: 'Produktauswahl (DE)', cover: '/catalog-covers/8.jpg', pdf: '/catalogs/Katalog_Produkt-mini_DE.pdf' }
]

const isKvConfigured = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

const getDefaultsForKey = (key) => {
  if (key === DB.products) return defaultProducts
  if (key === DB.gallery) return defaultGallery
  if (key === DB.categories) return defaultCategories
  if (key === DB.catalogs) return defaultCatalogs
  return []
}

const requireKvForWrites = (_req, res, next) => {
  if (process.env.VERCEL && !isKvConfigured()) {
    return res.status(503).json({ error: 'KV not configured. Connect Vercel KV (Storage) and enable for this environment.' })
  }
  return next()
}

// Read Data
const readData = async (key, file) => {
  if (process.env.VERCEL) {
    // Vercel KV (if configured)
    if (!isKvConfigured()) return getDefaultsForKey(key)
    try {
      const data = await kv.get(key)
      if (!data && key === DB.products) return defaultProducts
      if (!data && key === DB.gallery) return defaultGallery
      if (!data && key === DB.categories) return defaultCategories
      if (!data && key === DB.catalogs) return defaultCatalogs
      return data || []
    } catch (e) {
      console.error('KV Read Error:', e)
      return getDefaultsForKey(key)
    }
  } else {
    // Local FS
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'))
    } catch {
      // Return defaults if file missing
      if (key === DB.products) return defaultProducts
      if (key === DB.gallery) return defaultGallery
      if (key === DB.categories) return defaultCategories
      if (key === DB.catalogs) return defaultCatalogs
      return []
    }
  }
}

// Write Data
const writeData = async (key, file, data) => {
  if (process.env.VERCEL) {
    // Vercel KV (if configured)
    if (!isKvConfigured()) return
    await kv.set(key, data)
  } else {
    // Local FS
    await fs.writeFile(file, JSON.stringify(data, null, 2))
  }
}

// Ensure Data (Local Only)
const ensureDataFiles = async () => {
  if (process.env.VERCEL) {
     // Ensure /tmp/uploads exists on Vercel
     try { await fs.mkdir(UPLOADS_DIR, { recursive: true }) } catch {}
     return
  }
  
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  try { await fs.access(PRODUCTS_FILE) } catch { await fs.writeFile(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2)) }
  try { await fs.access(GALLERY_FILE) } catch { await fs.writeFile(GALLERY_FILE, JSON.stringify(defaultGallery, null, 2)) }
  try { await fs.access(CATEGORIES_FILE) } catch { await fs.writeFile(CATEGORIES_FILE, JSON.stringify(defaultCategories, null, 2)) }
  try { await fs.access(CATALOGS_FILE) } catch { await fs.writeFile(CATALOGS_FILE, JSON.stringify(defaultCatalogs, null, 2)) }
  try { await fs.access(CONTACT_FILE) } catch { await fs.writeFile(CONTACT_FILE, '[]') }
}


const app = express()
app.set('etag', false)
app.use(cors({ origin: true, credentials: true }))
// Increase payload limit for Base64 image uploads
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
  app.use(express.static(DIST_DIR))
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-change-me'
const IS_PROD = process.env.NODE_ENV === 'production'
// On Render/Hostinger, we might be behind a proxy (HTTPS) but node sees HTTP.
// 'trust proxy' 1 is needed.
app.set('trust proxy', 1)

app.use(cookieParser(SESSION_SECRET))

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store')
  next()
})

// Only use session in dev or Hostinger. Vercel uses JWT cookie.
if (!process.env.VERCEL) {
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax', 
        secure: IS_PROD
      }
    })
  )
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'kobfestner'
let ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ''
if (!ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD) {
  ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10)
}

const verifyToken = (req) => {
  const token = req.cookies?.auth_token
  if (!token) return null
  try {
    const decoded = jwt.verify(token, SESSION_SECRET)
    return decoded.user === ADMIN_USERNAME ? decoded.user : null
  } catch {
    return null
  }
}

const requireAuth = (req, res, next) => {
  // Check session (Hostinger/Dev)
  if (req.session && req.session.user === ADMIN_USERNAME) return next()
  
  // Check JWT (Vercel)
  if (process.env.VERCEL) {
    const user = verifyToken(req)
    if (user) {
      req.user = user
      return next()
    }
  }
  
  return res.status(401).json({ error: 'Unauthorized' })
}

const getFullUrl = (req) => {
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString()
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString()
  return `${proto}://${host}${req.originalUrl}`
}

const toWebHeaders = (nodeHeaders) => {
  const h = new Headers()
  for (const [k, v] of Object.entries(nodeHeaders || {})) {
    if (typeof v === 'string') h.set(k, v)
  }
  return h
}

// Uploads
const storage = multer.memoryStorage() // Use memory storage for Vercel compatibility
const upload = multer({ storage })

// Friendly root page (dev only) or serve SPA in production
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (_req, res) => {
    res.status(200).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>KOB API</title>
<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:2rem;color:#0f172a}a{color:#0369a1;text-decoration:none}</style></head>
<body>
  <h1>KOB Fenster API</h1>
  <p>API is running. Useful endpoints:</p>
  <ul>
    <li><a href="/api/health">/api/health</a></li>
    <li><a href="/api/products">/api/products</a></li>
    <li><a href="/api/gallery/projects">/api/gallery/projects</a></li>
  </ul>
  <p>In development, the frontend runs on <code>http://localhost:5173</code> and proxies <code>/api</code> to this server.</p>
</body></html>`)
  })
}

// Convenience redirect
app.get('/api', (_req, res) => res.redirect('/api/health'))

app.get('/api/health', (_req, res) => {
  const configured = Boolean(ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD)
  res.json({ ok: true, authConfigured: configured, username: ADMIN_USERNAME, kvConfigured: isKvConfigured() })
})

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' })
  }

  if (username !== ADMIN_USERNAME) return res.status(401).json({ error: 'Invalid credentials (user)' })
  
  if (!ADMIN_PASSWORD_HASH) {
     return res.status(500).json({ error: 'Server password not configured' })
  }

  // Debug hash comparison
  const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
  if (!ok) {
    console.error('Password mismatch. Hash:', ADMIN_PASSWORD_HASH.substring(0, 10) + '...')
    return res.status(401).json({ error: 'Invalid credentials (pass)' })
  }

  // Success!
  // Set session for Hostinger/Dev
  if (req.session) {
    req.session.user = ADMIN_USERNAME
    await new Promise((resolve) => req.session.save(resolve))
  }

  // Set JWT Cookie for Vercel
  const token = jwt.sign({ user: ADMIN_USERNAME }, SESSION_SECRET, { expiresIn: '2h' })
  
  // Use res.cookie only if available (Express)
  if (res.cookie) {
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    })
  } else {
    // Fallback: Set header manually if res.cookie is missing (unlikely in Express but safe)
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=7200; SameSite=Lax${IS_PROD ? '; Secure' : ''}`)
  }

  res.json({ ok: true, username: ADMIN_USERNAME })
})
app.post('/api/auth/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {})
  }
  res.clearCookie('auth_token')
  res.json({ ok: true })
})
app.get('/api/auth/me', (req, res) => {
  res.set('Cache-Control', 'no-store')
  
  let username = null
  if (req.session && req.session.user === ADMIN_USERNAME) {
    username = req.session.user
  } else if (process.env.VERCEL) {
    username = verifyToken(req)
  }

  console.log('Session check:', { username, sessionID: req.sessionID })
  res.json({ authenticated: Boolean(username), username })
})

// Products
app.get('/api/products', async (_req, res) => {
  const items = await readData(DB.products, PRODUCTS_FILE)
  res.json(items)
})
app.get('/api/products/:id', async (req, res) => {
  const items = await readData(DB.products, PRODUCTS_FILE)
  const item = items.find((p) => p.id === Number(req.params.id))
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})
app.post('/api/products', requireAuth, requireKvForWrites, upload.single('image'), async (req, res) => {
  const items = await readData(DB.products, PRODUCTS_FILE)
  const newItem = {
    id: Date.now(),
    ...req.body,
    image: req.file ? `/uploads/${req.file.filename}` : (req.body.image || '')
  }
  items.push(newItem)
  await writeData(DB.products, PRODUCTS_FILE, items)
  res.status(201).json(newItem)
})
app.delete('/api/products/:id', requireAuth, requireKvForWrites, async (req, res) => {
  let items = await readData(DB.products, PRODUCTS_FILE)
  items = items.filter((p) => String(p.id) !== String(req.params.id))
  await writeData(DB.products, PRODUCTS_FILE, items)
  res.json({ ok: true })
})
app.put('/api/products/:id', requireAuth, requireKvForWrites, upload.single('image'), async (req, res) => {
  let items = await readData(DB.products, PRODUCTS_FILE)
  const idx = items.findIndex((p) => String(p.id) === String(req.params.id))
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  
  // Logic: 
  // 1. If file uploaded -> use file path
  // 2. If body.image provided -> use body.image (URL)
  // 3. Else -> keep existing image
  let newImage = items[idx].image
  if (req.file) newImage = `/uploads/${req.file.filename}`
  else if (req.body.image) newImage = req.body.image

  items[idx] = {
    ...items[idx],
    ...req.body,
    image: newImage
  }
  await writeData(DB.products, PRODUCTS_FILE, items)
  res.json(items[idx])
})

app.get('/api/catalogs', async (_req, res) => {
  const items = await readData(DB.catalogs, CATALOGS_FILE)
  res.json(items)
})
app.post('/api/catalogs', requireAuth, requireKvForWrites, async (req, res) => {
  const { title, subtitle, cover, pdf } = req.body || {}
  const safeTitle = String(title || '').trim()
  const safeSubtitle = String(subtitle || '').trim()
  const safeCover = typeof cover === 'string' ? cover.trim() : ''
  const safePdf = String(pdf || '').trim()
  if (!safeTitle) return res.status(400).json({ error: 'Missing title' })
  if (!safePdf) return res.status(400).json({ error: 'Missing pdf' })
  const items = await readData(DB.catalogs, CATALOGS_FILE)
  const entry = { id: Date.now(), title: safeTitle, subtitle: safeSubtitle, cover: safeCover, pdf: safePdf }
  items.push(entry)
  await writeData(DB.catalogs, CATALOGS_FILE, items)
  res.status(201).json(entry)
})
app.delete('/api/catalogs/:id', requireAuth, requireKvForWrites, async (req, res) => {
  let items = await readData(DB.catalogs, CATALOGS_FILE)
  items = items.filter((c) => String(c.id) !== String(req.params.id))
  await writeData(DB.catalogs, CATALOGS_FILE, items)
  res.json({ ok: true })
})

// Categories
const normalizeSlug = (input) => {
  const raw = String(input || '').trim().toLowerCase()
  if (!raw) return ''
  const mapped = raw
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return mapped
}
app.get('/api/categories', async (_req, res) => {
  const items = await readData(DB.categories, CATEGORIES_FILE)
  res.json(items)
})
app.post('/api/categories', requireAuth, requireKvForWrites, async (req, res) => {
  const { id, image } = req.body || {}
  const slug = normalizeSlug(id)
  if (!slug) return res.status(400).json({ error: 'Invalid id' })
  const items = await readData(DB.categories, CATEGORIES_FILE)
  if (items.find((c) => c.id === slug)) return res.status(409).json({ error: 'Already exists' })
  const entry = { id: slug, enabled: true, image: typeof image === 'string' ? image : '' }
  items.push(entry)
  await writeData(DB.categories, CATEGORIES_FILE, items)
  res.status(201).json(entry)
})
app.put('/api/categories/:id', requireAuth, requireKvForWrites, async (req, res) => {
  const items = await readData(DB.categories, CATEGORIES_FILE)
  const idx = items.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  items[idx] = { ...items[idx], ...req.body }
  await writeData(DB.categories, CATEGORIES_FILE, items)
  res.json(items[idx])
})
app.delete('/api/categories/:id', requireAuth, requireKvForWrites, async (req, res) => {
  const items = await readData(DB.categories, CATEGORIES_FILE)
  const next = items.filter((c) => c.id !== req.params.id)
  if (next.length === items.length) return res.status(404).json({ error: 'Not found' })
  await writeData(DB.categories, CATEGORIES_FILE, next)
  res.status(204).end()
})

// Gallery
app.get('/api/gallery/projects', async (_req, res) => {
  const items = await readData(DB.gallery, GALLERY_FILE)
  res.json(items)
})
app.post('/api/gallery/projects', requireAuth, requireKvForWrites, async (req, res) => {
  const items = await readData(DB.gallery, GALLERY_FILE)
  const category = String(req.body?.category || '').trim()
  const image = String(req.body?.image || '').trim()

  const normalizeI18nText = (val) => {
    if (!val) return { de: '', en: '' }
    if (typeof val === 'string') return { de: val.trim(), en: val.trim() }
    if (typeof val === 'object') {
      const de = typeof val.de === 'string' ? val.de.trim() : ''
      const en = typeof val.en === 'string' ? val.en.trim() : ''
      return { de, en }
    }
    return { de: '', en: '' }
  }

  const title = normalizeI18nText(req.body?.title || { de: req.body?.titleDe, en: req.body?.titleEn })
  const description = normalizeI18nText(req.body?.description || { de: req.body?.descriptionDe, en: req.body?.descriptionEn })
  const location = normalizeI18nText(req.body?.location || { de: req.body?.locationDe, en: req.body?.locationEn })
  const newItem = {
    id: Date.now(),
    category,
    image,
    title,
    description,
    location
  }
  items.push(newItem)
  await writeData(DB.gallery, GALLERY_FILE, items)
  res.status(201).json(newItem)
})
app.delete('/api/gallery/projects/:id', requireAuth, requireKvForWrites, async (req, res) => {
  let items = await readData(DB.gallery, GALLERY_FILE)
  items = items.filter((g) => String(g.id) !== String(req.params.id))
  await writeData(DB.gallery, GALLERY_FILE, items)
  res.json({ ok: true })
})

// Contact Messages
app.get('/api/contact', requireAuth, async (_req, res) => {
  const items = await readData(DB.contact, CONTACT_FILE)
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  res.json(items)
})
app.delete('/api/contact/:id', requireAuth, requireKvForWrites, async (req, res) => {
  let items = await readData(DB.contact, CONTACT_FILE)
  items = items.filter((c) => String(c.id) !== String(req.params.id))
  await writeData(DB.contact, CONTACT_FILE, items)
  res.json({ ok: true })
})
app.post('/api/contact', async (req, res) => {
  const entry = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() }
  
  // Save to DB
  let items = await readData(DB.contact, CONTACT_FILE)
  items.push(entry)
  await writeData(DB.contact, CONTACT_FILE, items)

  // Send Email
  try {
    const host = process.env.SMTP_HOST
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const port = Number(process.env.SMTP_PORT || '587')
    if (host && user && pass) {
      const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
      const to = process.env.NOTIFY_EMAIL || 'kob.fenster@outlook.de'
      const subject = `Neuer Kontakt: ${entry.firstName} ${entry.lastName}`
      const text = `Von: ${entry.firstName} ${entry.lastName}\nE-Mail: ${entry.email}\nTelefon: ${entry.phone}\nService: ${entry.service}\n\n${entry.message}\n\n${entry.createdAt}`
      await transporter.sendMail({ from: `"KOB Fenster" <${user}>`, to, subject, text })
    }
  } catch (e) {
    console.error('Email error:', e)
  }
  // Vercel: Data is not persisted, but email is sent.
  res.status(201).json({ ok: true })
})

app.get('/api/blob/session', requireAuth, async (_req, res) => {
  const token = jwt.sign({ purpose: 'blob-upload', user: ADMIN_USERNAME }, SESSION_SECRET, { expiresIn: '10m' })
  res.json({ token })
})

app.post('/api/blob/upload', async (req, res) => {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) return res.status(500).json({ error: 'Blob not configured (missing BLOB_READ_WRITE_TOKEN)' })

    const q = typeof req.query?.u === 'string' ? req.query.u : ''
    let ok = false
    if (req.session && req.session.user === ADMIN_USERNAME) ok = true
    if (!ok && process.env.VERCEL) {
      const u = verifyToken(req)
      if (u) ok = true
    }
    if (!ok && q) {
      try {
        const decoded = jwt.verify(q, SESSION_SECRET)
        if (decoded && decoded.purpose === 'blob-upload' && decoded.user === ADMIN_USERNAME) ok = true
      } catch {
        ok = false
      }
    }
    if (!ok) return res.status(401).json({ error: 'Unauthorized' })

    const body = req.body || {}
    const request = new Request(getFullUrl(req), {
      method: 'POST',
      headers: toWebHeaders({ ...req.headers, 'content-type': 'application/json' }),
      body: JSON.stringify(body)
    })

    const jsonResponse = await handleUpload({
      token,
      request,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'],
        maximumSizeInBytes: 50 * 1024 * 1024,
        addRandomSuffix: true
      }),
      onUploadCompleted: async () => {}
    })

    return res.json(jsonResponse)
  } catch (e) {
    console.error('Blob client upload handler error:', e)
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Upload handler error' })
  }
})


// Upload endpoint (auth required)
app.post('/api/uploads', requireAuth, (req, res, next) => {
  // Debug logging
  console.log('Upload request start')
  next()
}, upload.single('file'), async (req, res) => {
  console.log('Upload file processed:', req.file)
  
  if (!req.file) {
    console.error('Upload error: No file received')
    return res.status(400).json({ error: 'No file' })
  }
  
  try {
    if (process.env.VERCEL) {
      return res.status(410).json({ error: 'Use /api/blob/upload (client upload) on Vercel' })
    }

    // Local environment: Write buffer to disk
    const ext = path.extname(req.file.originalname)
    const filename = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`
    const filepath = path.join(UPLOADS_DIR, filename)
    
    await fs.writeFile(filepath, req.file.buffer)
    const url = `/uploads/${filename}`
    
    console.log('Upload successful (local disk):', url)
    res.status(201).json({ url })
  } catch (err) {
    console.error('Upload processing error:', err)
    res.status(500).json({ error: 'Upload failed internal' })
  }
})

// SPA fallback in production (all non-API routes)
if (process.env.NODE_ENV === 'production') {
  app.get(/^\/(?!api\/).*$/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

const PORT = process.env.PORT || 5174

// Export for Vercel
if (process.env.VERCEL) {
  // On Vercel, we can't write to filesystem (except /tmp which is ephemeral)
  // We need to mock ensureDataFiles or handle it gracefully
} else {
  ensureDataFiles().then(() => {
    app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`)
    })
  })
}

export default app
