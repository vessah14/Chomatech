export default function Badge ({ children, className = '' ,icon}) {
  return (
    <>
      <span className={`inline-flex items-center justify-center rounded-full  ${className}`}>
        <span className='text-lg mr-2'>{icon}</span>
        <p className='text-sm'>{children}</p>
      </span>
    </>
  )
}
