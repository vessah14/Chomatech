import Faq from '../Components/ui/Faq'
import Badge from '../Components/ui/Badge'
import Input from '../Components/ui/InputSearc'
import Button from '../Components/ui/Button'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

export default function FaqContainer () {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  return (
    <>
      <section className='faq-page flex flex-col'>
        <Herosection search={search} onSearchChange={setSearch} />
        <div className='faq-content px-4 py-12 sm:px-6 sm:py-16'>
          <div className='mx-auto mb-8 max-w-4xl'>
            <span className='faq-section-kicker'>{t.faqBadge}</span>
            <h2 className='mt-4 text-2xl font-bold text-slate-900 sm:text-3xl'>{t.faqTitle}</h2>
          </div>
          <Faq search={search} />
        </div>
      </section>
      <section className='faq-contact-section px-4 py-12 sm:px-6 sm:py-16'>
        <div className='faq-contact-card mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-7 rounded-3xl px-6 py-8 text-center sm:px-10 sm:py-10 lg:flex-row lg:text-left'>
          <div className='faq-contact-copy flex max-w-2xl flex-col items-center gap-3 lg:items-start'>
          <span className='text-4xl sm:text-4xl'>💬</span>
          <h2 className='text-4xl font-bold md:text-5xl'>{t.faqContact}</h2>
          <p className='text-sm text-gray-600 sm:text-lg'>{t.faqContactText}</p>
          </div>
          <div className='flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row'>
            <Button
              onClick={() => navigate('/contact')}
              children={t.writeUs}
              className='faq-contact-primary font-semibold'
            />
            <Button
              onClick={() => navigate('/contact')}
              children={t.callNow}
              className='faq-contact-secondary font-semibold'
            />
          </div>
        </div>
      </section>
    </>
  )
}

function Herosection ({ search, onSearchChange }) {
  const { t } = useLanguage()

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className='faq-hero business-page-hero flex flex-col items-center justify-center gap-7 px-4 py-12 sm:px-6 md:py-16 lg:min-h-[390px]'
      >
        <div className='flex w-full flex-col items-center'>
          <Badge
            children={t.faqBadge}
            className='bg-sky-200 px-3 py-1 text-sky-500 font-bold'
          />
          <h1 className='mt-4 max-w-[800px] text-center text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[3.4rem]'>
            {t.faqTitleBefore}{' '}
            <span className='text-sky-400'>{t.faqTitleHighlight}</span>
          </h1>
          <div className='faq-search mt-7 flex w-full max-w-xl items-center gap-3 rounded-2xl border px-4 py-1'>
            <Search size={19} className='shrink-0 text-sky-500' aria-hidden='true' />
            <Input value={search} onChange={e => onSearchChange(e.target.value)} />
          </div>
        </div>
      </motion.section>
    </>
  )
}
