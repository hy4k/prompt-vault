import { CATEGORY_STYLES } from '../lib/constants'

/**
 * Horizontally scrollable chip row. Defaults to prompt categories;
 * pass `items` + `allLabel` to repurpose (e.g. audiences).
 */
export default function CategoryFilter({ value, onChange, items, allLabel = 'All' }) {
  const options = items ?? ['All', ...Object.keys(CATEGORY_STYLES)]

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`chip whitespace-nowrap ${
              active
                ? 'border-gold/60 bg-gold/15 font-semibold text-gold shadow-gold'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
