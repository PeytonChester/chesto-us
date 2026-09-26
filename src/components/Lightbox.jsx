import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { responsiveImage, fixedImage } from '../lib/images'

const MIN_SCALE = 1
const MAX_SCALE = 5
const DOUBLE_TAP_ZOOM = 2.5
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Fullscreen photo viewer: the photo sits above the thumbnail strip (never
// under it) and supports pinch, double-tap/click, wheel and button zoom,
// dragging to pan while zoomed, and swiping between photos when not zoomed.
export default function Lightbox({ photos, index, label, onIndexChange, onClose }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const [gesturing, setGesturing] = useState(false)
  const stageRef = useRef(null)
  const imgRef = useRef(null)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const lastTap = useRef({ time: 0, x: 0, y: 0 })
  const downTarget = useRef(null)
  const thumbStripRef = useRef(null)
  const activeThumbRef = useRef(null)
  const photo = photos[index]

  // Keep the zoomed photo covering the stage instead of drifting off it
  const constrain = useCallback((scale, x, y) => {
    const stage = stageRef.current, img = imgRef.current
    if (!stage || !img || scale <= 1) return { scale: Math.max(scale, 1), x: 0, y: 0 }
    const maxX = Math.max(0, (img.offsetWidth * scale - stage.clientWidth) / 2)
    const maxY = Math.max(0, (img.offsetHeight * scale - stage.clientHeight) / 2)
    return { scale, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) }
  }, [])

  // Zoom to `next` keeping the stage point (px, py), relative to its center, fixed
  const zoomAt = useCallback((next, px = 0, py = 0) => {
    setView(v => {
      const scale = clamp(next, MIN_SCALE, MAX_SCALE)
      const ratio = scale / v.scale
      return constrain(scale, px - (px - v.x) * ratio, py - (py - v.y) * ratio)
    })
  }, [constrain])

  const zoomBy = useCallback(factor => setView(v => {
    const scale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE)
    return constrain(scale, v.x * (scale / v.scale), v.y * (scale / v.scale))
  }), [constrain])

  const resetZoom = useCallback(() => setView({ scale: 1, x: 0, y: 0 }), [])

  useEffect(() => { resetZoom() }, [index, resetZoom])

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [index])

  // Lock page scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onIndexChange(Math.min(index + 1, photos.length - 1))
      else if (e.key === 'ArrowLeft') onIndexChange(Math.max(index - 1, 0))
      else if (e.key === '+' || e.key === '=') zoomBy(1.5)
      else if (e.key === '-') zoomBy(1 / 1.5)
      else if (e.key === '0') resetZoom()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photos.length, onClose, onIndexChange, zoomBy, resetZoom])

  // Wheel / trackpad pinch zoom; needs a non-passive listener to stop page zoom
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (e) => {
      e.preventDefault()
      const rect = stage.getBoundingClientRect()
      const px = e.clientX - rect.left - rect.width / 2
      const py = e.clientY - rect.top - rect.height / 2
      setView(v => {
        const scale = clamp(v.scale * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), MIN_SCALE, MAX_SCALE)
        const ratio = scale / v.scale
        return constrain(scale, px - (px - v.x) * ratio, py - (py - v.y) * ratio)
      })
    }
    // Safari's own pinch gesture events
    const stop = e => e.preventDefault()
    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('gesturestart', stop)
    stage.addEventListener('gesturechange', stop)
    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('gesturestart', stop)
      stage.removeEventListener('gesturechange', stop)
    }
  }, [constrain])

  const stagePoint = (e) => {
    const rect = stageRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 }
  }

  const startGesture = () => {
    const pts = [...pointers.current.values()]
    if (pts.length >= 2) {
      const [a, b] = pts
      gesture.current = {
        type: 'pinch',
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        view,
        moved: true,
      }
    } else if (pts.length === 1) {
      gesture.current = { type: 'pan', start: pts[0], view, moved: gesture.current?.moved ?? false }
    }
  }

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, stagePoint(e))
    if (pointers.current.size === 1) {
      gesture.current = null
      downTarget.current = e.target // pointer capture retargets later events to the stage
    }
    setGesturing(true)
    startGesture()
  }

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, stagePoint(e))
    const g = gesture.current
    if (!g) return
    const pts = [...pointers.current.values()]

    if (g.type === 'pinch' && pts.length >= 2) {
      const [a, b] = pts
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const scale = clamp(g.view.scale * dist / g.dist, MIN_SCALE, MAX_SCALE)
      const ratio = scale / g.view.scale
      setView(constrain(scale, mid.x - (g.mid.x - g.view.x) * ratio, mid.y - (g.mid.y - g.view.y) * ratio))
    } else if (g.type === 'pan' && pts.length === 1) {
      const dx = pts[0].x - g.start.x, dy = pts[0].y - g.start.y
      if (Math.hypot(dx, dy) > 6) g.moved = true
      if (g.view.scale > 1) setView(constrain(g.view.scale, g.view.x + dx, g.view.y + dy))
    }
  }

  const onPointerUp = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    const end = stagePoint(e)
    pointers.current.delete(e.pointerId)
    const g = gesture.current

    if (pointers.current.size > 0) {
      startGesture() // pinch -> pan with the remaining finger
      return
    }
    setGesturing(false)
    gesture.current = null
    if (!g) return

    // Swipe between photos when not zoomed
    if (g.type === 'pan' && g.view.scale === 1 && g.moved) {
      const dx = end.x - g.start.x, dy = end.y - g.start.y
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onIndexChange(clamp(index + (dx < 0 ? 1 : -1), 0, photos.length - 1))
      }
      return
    }
    if (g.moved) return

    // Tap: double tap toggles zoom; a single tap beside the photo closes
    const now = Date.now()
    const isDouble = now - lastTap.current.time < 300 && Math.hypot(end.x - lastTap.current.x, end.y - lastTap.current.y) < 30
    lastTap.current = { time: isDouble ? 0 : now, x: end.x, y: end.y }
    if (isDouble) {
      if (view.scale > 1) resetZoom()
      else zoomAt(DOUBLE_TAP_ZOOM, end.x, end.y)
    } else if (downTarget.current !== imgRef.current && view.scale === 1) {
      onClose()
    }
  }

  const zoomed = view.scale > 1

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={photo.title || label}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-14 flex-shrink-0 text-chesto-cream/60">
        <p className="text-xs font-mono">{index + 1} / {photos.length}</p>
        <div className="flex items-center gap-1">
          <button onClick={() => zoomBy(1 / 1.5)} disabled={!zoomed} className="lightbox-btn" aria-label="Zoom out">−</button>
          <button onClick={resetZoom} disabled={!zoomed} className="lightbox-btn text-xs font-mono w-14" aria-label="Reset zoom">
            {Math.round(view.scale * 100)}%
          </button>
          <button onClick={() => zoomBy(1.5)} disabled={view.scale >= MAX_SCALE} className="lightbox-btn" aria-label="Zoom in">+</button>
          <span className="w-px h-5 bg-chesto-cream/15 mx-2" />
          <button onClick={onClose} className="lightbox-btn text-2xl" aria-label="Close">×</button>
        </div>
      </div>

      {/* Photo */}
      <div
        ref={stageRef}
        className={`relative flex-1 min-h-0 flex items-center justify-center overflow-hidden touch-none select-none px-10 md:px-16 ${zoomed ? (gesturing ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          ref={imgRef}
          key={photo.id}
          {...(view.scale > 1.5
            ? fixedImage(photo.url, 3840, 85)
            : responsiveImage(photo.url, '100vw', { maxWidth: 3840 }))}
          alt={photo.title || label}
          draggable={false}
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: gesturing ? 'none' : 'transform 200ms ease-out',
          }}
        />

        {!zoomed && index > 0 && (
          <button
            className="absolute left-1 md:left-3 top-1/2 -translate-y-1/2 text-chesto-cream/60 hover:text-chesto-cream text-4xl leading-none p-3"
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onIndexChange(index - 1)}
            aria-label="Previous photo"
          >‹</button>
        )}
        {!zoomed && index < photos.length - 1 && (
          <button
            className="absolute right-1 md:right-3 top-1/2 -translate-y-1/2 text-chesto-cream/60 hover:text-chesto-cream text-4xl leading-none p-3"
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onIndexChange(index + 1)}
            aria-label="Next photo"
          >›</button>
        )}
      </div>

      {/* Caption + thumbnails, below the photo */}
      <div className="flex-shrink-0 pt-3 pb-4 px-4">
        {photo.title && (
          <p className="text-chesto-cream/70 text-sm font-body text-center mb-3">{photo.title}</p>
        )}
        <div ref={thumbStripRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              ref={i === index ? activeThumbRef : null}
              onClick={() => onIndexChange(i)}
              className={`flex-shrink-0 w-10 h-10 md:w-14 md:h-14 overflow-hidden transition-all duration-200 ${
                i === index ? 'ring-2 ring-chesto-gold opacity-100' : 'opacity-40 hover:opacity-70'
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              <img {...fixedImage(p.url, 128)} loading="lazy" alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
