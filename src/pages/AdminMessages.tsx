import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MotionPage from '../components/MotionPage'
import { authMe, deleteContactMessage, listContactMessages, type ContactMessage } from '../lib/adminApi'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function AdminMessages() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<ContactMessage[]>([])
  useEffect(() => {
    let on = true
    authMe().then((me) => {
      if (!on) return
      if (!me.authenticated) {
        navigate('/admin', { replace: true })
        return
      }
      listContactMessages().then((rows) => {
        if (!on) return
        setItems(rows)
        setIsLoading(false)
      })
    })
    return () => { on = false }
  }, [navigate])
  if (isLoading) {
    return (
      <MotionPage>
        <div className="container py-10 sm:py-14">
          <p className="text-neutral-700">{t('admin.dashboard.loading')}</p>
        </div>
      </MotionPage>
    )
  }
  return (
    <MotionPage>
      <div className="container py-10 sm:py-14 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">{t('admin.messages.title')}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button className="glass-chip rounded-lg px-3 py-1.5 text-sm inline-flex items-center gap-2" onClick={() => navigate('/admin/dashboard')}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
              </svg>
              <span>Dashboard</span>
            </button>
            <button className="glass-chip rounded-lg px-3 py-1.5 text-sm inline-flex items-center gap-2" onClick={async () => setItems(await listContactMessages())}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              <span>{t('admin.messages.refresh')}</span>
            </button>
          </div>
        </div>
        {items.length === 0 ? (
          <p className="text-neutral-700">{t('admin.messages.empty')}</p>
        ) : (
          <div className="grid gap-3">
            {items.map((m) => (
              <article key={m.id} className="glass-surface rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 inline-flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>{m.firstName} {m.lastName}</span>
                    </p>
                    <p className="text-xs text-neutral-600 inline-flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" />
                      </svg>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${m.email}`} className="glass-chip rounded-lg px-2 py-1 text-xs inline-flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                        <path d="m22 6-10 7L2 6" />
                      </svg>
                      <span>{m.email}</span>
                    </a>
                    {m.phone && (
                      <a href={`tel:${m.phone.replace(/[^0-9+]/g,'')}`} className="glass-chip rounded-lg px-2 py-1 text-xs inline-flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.95a16 16 0 0 0 6 6l1.5-1.28a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{m.phone}</span>
                      </a>
                    )}
                    {m.service && (
                      <span className="glass-chip rounded-lg px-2 py-1 text-xs inline-flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
                          <rect x="3" y="6" width="18" height="15" rx="2" />
                          <path d="M3 12h18" />
                          <path d="M8 12v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" />
                        </svg>
                        <span>{m.service}</span>
                      </span>
                    )}
                    <button className="glass-chip rounded-lg px-2 py-1 text-xs inline-flex items-center gap-2" onClick={async () => {
                      await deleteContactMessage(m.id)
                      setItems((arr) => arr.filter((x) => x.id !== m.id))
                    }}>
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M7 6l1 16h8l1-16" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                      <span>{t('admin.dashboard.delete')}</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap">{m.message}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MotionPage>
  )
}
