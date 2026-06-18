import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'Chesto.us'
const SITE_URL = 'https://chesto.us'
const DEFAULT_DESCRIPTION = 'Photography, recipes, and stories by Peyton Chester.'

export default function PageMeta({ title, description, image }) {
  const { pathname } = useLocation()

  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Photography, Recipes & Stories`
  const desc = description || DEFAULT_DESCRIPTION
  const url = `${SITE_URL}${pathname}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  )
}
