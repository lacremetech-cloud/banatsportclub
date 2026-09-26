/**
 * Terrain tracé, en SVG.
 *
 * Il n'existe aucune photo du club : plutôt qu'une image d'agence qui ne
 * montrerait pas nos séances, chaque créneau est illustré par le tracé de son
 * terrain. Les lignes se dessinent à l'apparition, un ballon circule dessus.
 * C'est léger — quelques centaines d'octets, aucune requête —, net à toutes les
 * tailles, et honnête : ça n'invente pas une scène qui n'a pas eu lieu.
 *
 * Les deux variantes partagent le `viewBox` 0 0 100 64 pour réutiliser la même
 * trajectoire de ballon.
 */
export function Terrain({ variant }: { variant: "dojo" | "stade" }) {
  return (
    <svg
      viewBox="0 0 100 64"
      className="h-full w-full"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`bsc-turf-${variant}`} x1="0" y1="0" x2="1" y2="1">
          {variant === "stade" ? (
            <>
              <stop offset="0%" stopColor="#8b1a3a" />
              <stop offset="100%" stopColor="#3d0b1a" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#a8214a" />
              <stop offset="100%" stopColor="#4c0f22" />
            </>
          )}
        </linearGradient>
      </defs>

      <rect width="100" height="64" fill={`url(#bsc-turf-${variant})`} />

      {/* Bandes de tonte / de tatami : la texture du sol, en trois traits. */}
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <rect
          key={index}
          x={index * 16.7}
          y="0"
          width="16.7"
          height="64"
          fill="#ffffff"
          opacity={index % 2 === 0 ? 0.04 : 0}
        />
      ))}

      <g
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="0.7"
        strokeLinecap="round"
      >
        {/* Bordure du terrain. */}
        <rect
          className="bsc-draw"
          style={{ ["--bsc-dash" as string]: "330" }}
          x="6"
          y="6"
          width="88"
          height="52"
          rx={variant === "dojo" ? 2 : 0}
        />

        {variant === "stade" ? (
          <>
            {/* Ligne médiane, rond central et deux surfaces de but. */}
            <path className="bsc-draw" style={{ ["--bsc-dash" as string]: "52" }} d="M50 6V58" />
            <circle
              className="bsc-draw"
              style={{ ["--bsc-dash" as string]: "63", animationDelay: "0.3s" }}
              cx="50"
              cy="32"
              r="10"
            />
            <path
              className="bsc-draw"
              style={{ ["--bsc-dash" as string]: "46", animationDelay: "0.5s" }}
              d="M6 20h12v24H6"
            />
            <path
              className="bsc-draw"
              style={{ ["--bsc-dash" as string]: "46", animationDelay: "0.5s" }}
              d="M94 20H82v24h12"
            />
          </>
        ) : (
          <>
            {/* Aire de combat : un carré intérieur et le cercle central. */}
            <rect
              className="bsc-draw"
              style={{ ["--bsc-dash" as string]: "216", animationDelay: "0.3s" }}
              x="18"
              y="14"
              width="64"
              height="36"
              rx="1"
            />
            <circle
              className="bsc-draw"
              style={{ ["--bsc-dash" as string]: "50", animationDelay: "0.55s" }}
              cx="50"
              cy="32"
              r="8"
            />
            <path
              className="bsc-draw"
              style={{ ["--bsc-dash" as string]: "18", animationDelay: "0.7s" }}
              d="M50 24v16"
            />
          </>
        )}
      </g>

      {/* Le ballon. Le halo suit la même trajectoire, un cran plus large. */}
      <g className="bsc-ball">
        <circle r="3.6" fill="#ffffff" opacity="0.18" />
        <circle r="1.7" fill="#ffffff" />
      </g>
    </svg>
  );
}
