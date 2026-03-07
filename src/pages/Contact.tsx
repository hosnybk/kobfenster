import MotionPage from '../components/MotionPage'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import logoKob from '../assets/logo_KOB.svg'
import { contactServices as servicesData } from '../data/contactServices'
import { sendContact } from '../lib/api'

export default function Contact() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'de'
  const phoneNumber = '+49 170 8907480'
  const phoneHref = 'tel:+491708907480'
  const services = servicesData
  const [openService, setOpenService] = useState<(typeof services)[number]['id']>('fenster')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', service: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.message) {
      setStatus('error')
      return
    }
    try {
      setStatus('sending')
      await sendContact({ ...form })
      setStatus('success')
      setForm({ firstName: '', lastName: '', email: '', phone: '', service: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <MotionPage>
      <div className="container py-10 sm:py-14 space-y-8">
        <section className="glass-surface-strong rounded-3xl p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">{t('contact.badge')}</p>
          <div className="mt-4 grid gap-7 lg:grid-cols-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{t('contact.title')}</h1>
              <p className="mt-3 text-neutral-700">{t('contact.subtitle')}</p>

              <div className="glass-surface mt-6 divide-y divide-neutral-200 rounded-xl">
                {services.map((service) => {
                  const isOpen = openService === service.id
                  return (
                    <div key={service.id} className="p-4">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left"
                        onClick={() => setOpenService(service.id)}
                      >
                        <span className="font-semibold text-neutral-900">{service.title[locale]}</span>
                        <span className="text-cyan-600">{isOpen ? '−' : '+'}</span>
                      </button>
                      {isOpen && (
                        <div className="mt-3">
                          <p className="text-sm text-neutral-700">{service.description[locale]}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {service.tags[locale].map((tag) => (
                              <span key={`${service.id}-${tag}`} className="glass-chip rounded-full px-2.5 py-1 text-xs font-medium text-neutral-700">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="glass-surface rounded-2xl p-5">
              <img src={logoKob} alt={t('brand')} className="h-24 w-auto sm:h-28" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.15em] text-neutral-500">{t('contact.quickContact.title')}</p>
              <div className="mt-3 space-y-2 text-neutral-800">
                <a href={phoneHref} className="flex items-center gap-2 hover:text-neutral-900">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.95a16 16 0 0 0 6 6l1.5-1.28a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>{phoneNumber}</span>
                </a>
                <a href="mailto:kob.fenster@outlook.de" className="flex items-center gap-2 hover:text-neutral-900">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                  <span>kob.fenster@outlook.de</span>
                </a>
                <a href="mailto:info@kobfenster.de" className="flex items-center gap-2 hover:text-neutral-900">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                  <span>info@kobfenster.de</span>
                </a>
                <a
                  href="https://maps.google.com/?q=Kranenstraße%2019,%2065375%20Oestrich-Winkel"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-neutral-900"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 21s-6-5.33-6-10A6 6 0 0 1 18 11c0 4.67-6 10-6 10z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                  <span>{t('contact.quickContact.address')}</span>
                </a>
                <p className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  <span>{t('contact.quickContact.hours')}</span>
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=Kranenstra%C3%9Fe+19,+65375+Oestrich-Winkel,+Germany"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                {t('contact.quickContact.mapButton')}
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="glass-surface rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-neutral-900">{t('contact.formTitle')}</h2>
            <p className="mt-2 text-neutral-700">{t('contact.formSubtitle')}</p>
            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} type="text" placeholder={t('contact.form.firstName')} className="glass-input w-full rounded-lg pl-9 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring-2" />
                </label>
                <label className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} type="text" placeholder={t('contact.form.lastName')} className="glass-input w-full rounded-lg pl-9 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring-2" />
                </label>
              </div>
              <label className="relative block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="m22 6-10 7L2 6"/></svg>
                </span>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder={t('contact.form.email')} className="glass-input w-full rounded-lg pl-9 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring-2" />
              </label>
              <label className="relative block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.95a16 16 0 0 0 6 6l1.5-1.28a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" placeholder={t('contact.form.phone')} className="glass-input w-full rounded-lg pl-9 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring-2" />
              </label>
              <label className="relative block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
                    <rect x="3" y="6" width="18" height="15" rx="2" />
                    <path d="M3 12h18" />
                    <path d="M8 12v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" />
                  </svg>
                </span>
                <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="glass-input w-full rounded-lg pl-9 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring-2">
                  <option value="">{t('contact.form.service')}</option>
                  {services.map((service) => (
                    <option key={`option-${service.id}`} value={service.id}>{service.title[locale]}</option>
                  ))}
                </select>
              </label>
              <label className="relative block">
                <span className="pointer-events-none absolute left-3 top-3 text-neutral-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>
                </span>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t('contact.form.message')} rows={4} className="glass-input w-full rounded-lg pl-9 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring-2" />
              </label>
              <div className="flex items-center gap-3">
                <button disabled={status === 'sending'} type="submit" className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">
                  {status === 'sending' ? '…' : (
                    <span className="inline-flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M22 2 11 13" />
                        <path d="M22 2 15 22l-4-9-9-4z" />
                      </svg>
                      <span>{t('contact.form.submit')}</span>
                    </span>
                  )}
                </button>
                {status === 'success' && (
                  <span className="inline-flex items-center gap-2 text-sm text-green-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>{t('contact.form.success')}</span>
                  </span>
                )}
                {status === 'error' && (
                  <span className="inline-flex items-center gap-2 text-sm text-red-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v5" />
                      <path d="M12 16h.01" />
                    </svg>
                    <span>{t('contact.form.error')}</span>
                  </span>
                )}
              </div>
            </form>
          </article>

          <article className="glass-surface overflow-hidden rounded-2xl">
            <iframe
              title={t('contact.mapTitle')}
              src="https://www.google.com/maps?q=Kranenstra%C3%9Fe+19,+65375+Oestrich-Winkel,+Germany&output=embed"
              className="h-full min-h-80 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </article>
        </section>
      </div>
    </MotionPage>
  )
}
