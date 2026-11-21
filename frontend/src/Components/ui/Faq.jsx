import { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { getFaqs } from '../../api/faq'

export default function Faq ({ search = '' }) {
  const { t } = useLanguage()
  const [faqs, setFaqs] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false
    getFaqs()
      .then(data => {
        if (!annule) setFaqs(data.filter(f => f.statut === 'Publiée'))
      })
      .catch(err => {
        if (!annule) setErreur(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [])

  const faqsFiltrees = faqs.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase())
  )

  if (chargement) {
    return (
      <p className='faq-status mx-auto w-full max-w-4xl px-3 text-center text-gray-400 sm:px-0'>
        Chargement...
      </p>
    )
  }

  if (erreur) {
    return (
      <p role='alert' className='faq-status mx-auto w-full max-w-4xl px-3 text-center text-red-500 sm:px-0'>
        {erreur}
      </p>
    )
  }

  if (faqsFiltrees.length === 0) {
    return (
      <p className='faq-status mx-auto w-full max-w-4xl px-3 text-center text-gray-400 sm:px-0'>
        {t.noProducts}
      </p>
    )
  }

  return (
    <div className='faq-list mx-auto w-full max-w-4xl space-y-3 px-0'>
      {faqsFiltrees.map((faq, index) => (
        <details
          key={faq.id}
          className='faq-item group overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm'
          open={index === 0}
        >
          <summary className='faq-item__question flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-gray-900 sm:p-5'>
            <h3 className='text-sm font-semibold leading-snug sm:text-lg'>
              {faq.question}
            </h3>

            <svg
              aria-hidden='true'
              className='h-4 w-4 shrink-0 transition-transform duration-300 group-open:-rotate-180 sm:h-5 sm:w-5'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </summary>

          <p className='faq-item__answer border-t border-sky-50 px-4 pb-4 pt-3 text-sm leading-6 text-gray-700 sm:px-5 sm:text-base'>
            {faq.reponse}
          </p>
        </details>
      ))}
    </div>
  )
}
