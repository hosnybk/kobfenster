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
            <button className="glass-chip rounded-lg px-3 py-1.5 text-sm" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
            <button className="glass-chip rounded-lg px-3 py-1.5 text-sm" onClick={async () => setItems(await listContactMessages())}>{t('admin.messages.refresh')}</button>
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
                    <p className="text-sm font-semibold text-neutral-900">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-neutral-600">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${m.email}`} className="glass-chip rounded-lg px-2 py-1 text-xs">{m.email}</a>
                    {m.phone && <a href={`tel:${m.phone.replace(/[^0-9+]/g,'')}`} className="glass-chip rounded-lg px-2 py-1 text-xs">{m.phone}</a>}
                    {m.service && <span className="glass-chip rounded-lg px-2 py-1 text-xs">{m.service}</span>}
                    <button className="glass-chip rounded-lg px-2 py-1 text-xs" onClick={async () => {
                      await deleteContactMessage(m.id)
                      setItems((arr) => arr.filter((x) => x.id !== m.id))
                    }}>{t('admin.dashboard.delete')}</button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-neutral-800 whitespace-pre-wrap">{m.message}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </MotionPage>
  )
}
