import './App.css'
import Footer from './Components/layout/Footer'
import Navbarre from './Components/layout/Navbarre'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Loading from './Components/common/Loading'
import { useLanguage } from './context/LanguageContext'
import { useNavigation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ChatbotWidget from './Components/layout/ChatbotWidget'

function App () {
  const location = useLocation()
  const { t } = useLanguage()
  const navigation = useNavigation()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
  }, [location.pathname])

  useEffect(() => {
    if (reduceMotion || !('IntersectionObserver' in window)) return

    const seen = new WeakSet()
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target)) return
        seen.add(entry.target)
        entry.target.classList.add('scroll-enter')
        entry.target.addEventListener('animationend', () => {
          entry.target.classList.remove('scroll-enter')
        }, { once: true })
        currentObserver.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' })

    const observePageElements = () => {
      document.querySelectorAll(
        '.public-page-main article.rounded-2xl, .public-page-main .pillar-card, .public-page-main .home-service-card, .public-page-main .business-service-card, .public-page-main .themed-page > div, .public-page-main .product-detail-page > div'
      ).forEach(element => {
        if (!seen.has(element)) observer.observe(element)
      })
    }

    observePageElements()
    const mutations = new MutationObserver(observePageElements)
    mutations.observe(document.querySelector('.public-page-main'), { childList: true, subtree: true })

    return () => {
      mutations.disconnect()
      observer.disconnect()
    }
  }, [location.pathname, reduceMotion])

  return (
    <>
      <Navbarre />
      <main id='main-content' className='public-page-main' tabIndex='-1' aria-busy={navigation.state !== 'idle'}>
        <AnimatePresence>
        {navigation.state !== 'idle' && (
          <motion.div
            className='route-progress'
            role='status'
            aria-live='polite'
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
          >
            <Loading message={t.welcomeLoading} />
          </motion.div>
        )}
        </AnimatePresence>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={location.pathname}
            className='page-transition-shell'
            initial={reduceMotion ? false : { opacity: 0, y: 10, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, filter: 'blur(2px)' }}
            transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <ChatbotWidget />
    </>
  )
}

export default App
