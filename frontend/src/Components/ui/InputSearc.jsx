import { useLanguage } from '../../context/LanguageContext'

export default function Input ({ value = '', onChange }) {
  const { t } = useLanguage()

  return (
    <>
      <label className='faq-search-field' htmlFor='Search'>
        <div className='relative w-full max-w-[700px]'>
          <input
            type='text'
            id='Search'
            value={value}
            onChange={onChange}
            className='faq-search__input mt-0.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pe-12 shadow-sm sm:text-sm'
            placeholder={t.searchQuestion}
          />

          <span className='absolute inset-y-0 right-2 grid w-8 place-content-center'>
            <button
              type='button'
              aria-label={t.search}
              className='rounded-full p-1.5 text-gray-700 transition-colors hover:bg-gray-100'
            >
              <svg
                aria-hidden='true'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
                className='size-4'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                />
              </svg>
            </button>
          </span>
        </div>
      </label>
    </>
  )
}
