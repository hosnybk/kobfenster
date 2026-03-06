import { useState } from 'react'
import { login } from '../lib/adminApi'
import MotionPage from '../components/MotionPage'
import logoKob from '../assets/logo_KOB.svg'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Admin() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const navigate = useNavigate()

  const onLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    const formEl = event.currentTarget as HTMLFormElement
    const formData = new FormData(formEl)
    const username = String(formData.get('username') || '').trim()
    const password = String(formData.get('password') || '').trim()
    
    if (!username || !password) {
      setSuccess(false)
      setError(t('admin.login.error') || 'Missing credentials')
      return
    }
    
    try {
      await login(username, password)
      setSuccess(true)
      setError(null)
      // Redirect to dashboard, ensuring session is set
      navigate('/admin/dashboard', { replace: true })
    } catch (e) {
      const err = e as { message?: string }
      setSuccess(false)
      setError(err?.message || t('admin.login.error') || 'Identifiants invalides')
    }
  }

  return (
    <MotionPage>
      <div className="min-h-[calc(100dvh-6rem)] px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-center justify-end">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="mx-auto flex max-w-md flex-col items-center">
          <img src={logoKob} alt="KOB Fenster" className="h-24 w-auto sm:h-28" />
          <section className="glass-surface mt-6 w-full rounded-2xl p-6">
            <h1 className="text-xl font-semibold text-neutral-900 text-center">{t('admin.login.title')}</h1>
            <p className="mt-1 text-center text-sm text-neutral-600">{t('admin.login.subtitle')}</p>
            <form className="mt-5 space-y-3" onSubmit={onLogin}>
              <input name="username" type="text" required aria-label="Username" placeholder={t('admin.login.username')} className="glass-input w-full rounded-lg px-3 py-2 text-sm" defaultValue="kobfestner" />
              <input name="password" type="password" required aria-label="Password" placeholder={t('admin.login.password')} className="glass-input w-full rounded-lg px-3 py-2 text-sm" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-700">{t('admin.login.success')}</p>}
              <button type="submit" className="glass-chip w-full rounded-lg px-4 py-2 font-semibold">{t('admin.login.submit')}</button>
            </form>
          </section>
        </div>
      </div>
    </MotionPage>
  )
}
