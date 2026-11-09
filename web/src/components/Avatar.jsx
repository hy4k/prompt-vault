export default function Avatar({ url, name, size = 36, className = '' }) {
  const style = { width: size, height: size }

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'avatar'}
        style={style}
        className={`shrink-0 rounded-full object-cover ring-2 ring-gold/40 ${className}`}
      />
    )
  }

  return (
    <div
      style={{ ...style, fontSize: Math.round(size * 0.4) }}
      className={`flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-soft font-display font-semibold uppercase text-obsidian ${className}`}
    >
      {(name || '?').trim()[0]}
    </div>
  )
}
