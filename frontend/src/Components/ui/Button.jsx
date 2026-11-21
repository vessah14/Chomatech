export default function Button ({ children, className = '', icon, onClick }) {
  return (
    <>
      <button
        type='button'
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-offset-4 ${className}`}
      >
        {children}
        {icon && <span className='text-lg'>{icon}</span>}
      </button>
    </>
  )
}
