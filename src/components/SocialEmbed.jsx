import { useEffect, useRef, useState } from 'react'
import { parseEmbed, PROVIDER_LABELS } from '../lib/embeds'

// Instagram and X iframes report their content height via postMessage;
// read it so the card fits the post instead of scrolling inside a fixed box.
function readReportedHeight(provider, data) {
  let d = data
  if (typeof d === 'string') {
    try { d = JSON.parse(d) } catch { return null }
  }
  if (!d || typeof d !== 'object') return null
  if (provider === 'instagram' && d.type === 'MEASURE') return d.details?.height ?? null
  if (provider === 'twitter') {
    const msg = d['twttr.embed']
    if (msg?.method === 'twttr.private.resize') return msg.params?.[0]?.height ?? null
  }
  return null
}

export default function SocialEmbed({ url }) {
  const embed = parseEmbed(url)
  const iframeRef = useRef(null)
  const [height, setHeight] = useState(embed?.initialHeight ?? null)

  useEffect(() => {
    if (!embed || embed.layout !== 'card') return
    const onMessage = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return
      const h = readReportedHeight(embed.provider, e.data)
      if (h && h > 50) setHeight(Math.ceil(h))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [embed?.provider, embed?.id])

  if (!embed || embed.error) return null

  const title = `${PROVIDER_LABELS[embed.provider]} embed`
  const common = {
    ref: iframeRef,
    src: embed.src,
    title,
    loading: 'lazy',
    allowFullScreen: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share',
    className: 'block w-full h-full border-0',
  }

  if (embed.layout === 'video') {
    return (
      <div className="social-embed w-full aspect-video bg-black">
        <iframe {...common} />
      </div>
    )
  }

  if (embed.layout === 'vertical') {
    return (
      <div className="social-embed mx-auto w-full max-w-[340px] aspect-[9/16] bg-black">
        <iframe {...common} />
      </div>
    )
  }

  return (
    <div className="social-embed mx-auto w-full max-w-[540px]">
      <iframe {...common} className="block w-full border-0 bg-white rounded-lg" style={{ height }} />
    </div>
  )
}
