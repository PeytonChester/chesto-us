// Shown while a page's code is loading
export default function PageLoading({ fullScreen = false }) {
  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'} flex items-center justify-center`}>
      <span className="text-chesto-charcoal/40 text-sm tracking-widest uppercase animate-pulse">Loading…</span>
    </div>
  )
}
