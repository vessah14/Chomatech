import { createContext, useContext, useState } from 'react'
import {
  highlightedText,
  transformationLabel,
  translations,
  validationMessages
} from '../i18n'
import { extraTranslations } from '../i18n/extraTranslations'

const LanguageContext = createContext(null)

export function LanguageProvider ({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('chomatech-language') || 'fr'
  })
  function toggleLanguage () {
    setLanguage(currentLanguage => {
      const nextLanguage = currentLanguage === 'fr' ? 'en' : 'fr'
      localStorage.setItem('chomatech-language', nextLanguage)
      return nextLanguage
    })
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        toggleLanguage,
        t: {
          ...translations[language].nav,
          ...translations[language].auth,
          ...translations[language].common,
          transformation: transformationLabel[language],
          ...highlightedText[language],
          ...validationMessages[language],
          ...extraTranslations[language]
        }
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage () {
  return useContext(LanguageContext)
}

