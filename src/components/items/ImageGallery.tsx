'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  title: string
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') setLightbox(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || images.length < 2) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (delta > 0) prev()
    else next()
  }

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
        <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div
          className="relative aspect-square sm:rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in group touch-pan-y"
          onClick={() => setLightbox(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Image
            src={images[active]}
            alt={`${title} — photo ${active + 1}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-end p-3 pointer-events-none">
            <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded-lg px-2.5 py-1.5 items-center gap-1.5 text-xs">
              <ZoomIn className="w-3.5 h-3.5" />
              View full size
            </div>
          </div>
          {images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
              {active + 1} / {images.length}
            </div>
          )}
          {/* Always visible on mobile; hover-reveal on desktop */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/45 active:bg-black/70 text-white rounded-full flex items-center justify-center transition md:opacity-0 md:group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/45 active:bg-black/70 text-white rounded-full flex items-center justify-center transition md:opacity-0 md:group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          {/* Dot indicators for mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden pointer-events-none">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition ${i === active ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden transition ring-2 ${
                  i === active ? 'ring-amber-500' : 'ring-transparent opacity-60'
                }`}
                aria-label={`Photo ${i + 1}`}
              >
                <Image src={img} alt={`${title} ${i + 1}`} fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-11 h-11 bg-white/10 active:bg-white/20 text-white rounded-full flex items-center justify-center transition z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {active + 1} / {images.length}
          </div>

          <div
            className="relative w-full h-full max-w-5xl max-h-[85dvh] mx-2 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[active]}
              alt={`${title} — photo ${active + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 active:bg-white/20 text-white rounded-full flex items-center justify-center transition"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 active:bg-white/20 text-white rounded-full flex items-center justify-center transition"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto scrollbar-hide px-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActive(i) }}
                  className={`relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden transition ring-2 ${
                    i === active ? 'ring-amber-400' : 'ring-transparent opacity-50'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
