import { Helmet } from 'react-helmet-async'
import PageMeta from '../components/PageMeta'
import WaterLogTable, { Chip } from '../components/WaterLogTable'
import WaterLogCharts from '../components/WaterLogCharts'
import TankPhotos from '../components/TankPhotos'
import { useWaterLog } from '../hooks/useWaterLog'
import { TANK } from '../lib/waterLog'

// Unlisted page (no nav links, noindex): readings are added in /admin/water-log
export default function WaterLog() {
  const { readings, photos, loading, error } = useWaterLog()

  return (
    <div className="pt-16">
      <PageMeta title="Queso's Water Log" description="Water test results for Queso the betta's planted 10-gallon tank." />
      <Helmet><meta name="robots" content="noindex" /></Helmet>
      <div className="max-w-6xl mx-auto px-4 md:px-10 py-16 md:py-20">
        <p className="section-label mb-3">Water test log</p>
        <h1 className="display-heading text-4xl md:text-6xl mb-4">Queso's Water Log</h1>
        <p className="text-chesto-charcoal/60 max-w-2xl mb-4">
          API liquid test results for Queso's planted 10-gallon. Readings turn amber or red when they drift outside the target range.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-chesto-charcoal/50 mb-12">
          {TANK.map(([k, v]) => <span key={k}><b className="font-medium text-chesto-dark">{k}</b> {v}</span>)}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-chesto-charcoal/50 mb-4">
          <Chip rating="ok">in range</Chip>
          <Chip rating="warn">keep an eye on</Chip>
          <Chip rating="bad">act now</Chip>
          <span>Units: ppm, except pH and KH/GH in dKH/dGH.</span>
        </div>

        {loading ? (
          <p className="text-chesto-charcoal/40 text-sm animate-pulse">Loading readings…</p>
        ) : error ? (
          <p className="text-chesto-charcoal/50 text-sm">The log couldn't load. Reload the page to try again.</p>
        ) : readings.length ? (
          <>
            <WaterLogTable readings={readings} />
            <h2 className="display-heading text-2xl md:text-3xl mt-16 mb-6">Trends</h2>
            <WaterLogCharts readings={readings} />
          </>
        ) : (
          <p className="text-chesto-charcoal/50 text-sm border border-chesto-charcoal/10 bg-white p-8 text-center">No readings yet.</p>
        )}

        <TankPhotos uploaded={photos} />
      </div>
    </div>
  )
}
