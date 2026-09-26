/**
 * Le sol de chaque créneau, en SVG.
 *
 * Il n'existe aucune photo du club : plutôt qu'une image d'agence qui ne
 * montrerait pas nos séances, chaque créneau est illustré par le sol sur lequel
 * il a lieu. C'est léger — quelques centaines d'octets, aucune requête —, net à
 * toutes les tailles, et honnête : ça n'invente pas une scène qui n'a pas eu
 * lieu.
 *
 * Les deux sols sont volontairement très différents, parce qu'ils désignent
 * deux créneaux différents : un tapis de tatamis bleus pour le dojo du jeudi,
 * une pelouse tracée pour le stade du dimanche. Rien du vocabulaire du football
 * — ligne médiane, rond central, surfaces de but — n'apparaît côté dojo.
 *
 * Même `viewBox` pour les deux, afin de réutiliser la même trajectoire de
 * ballon.
 */
export function Terrain({ variant }: { variant: "dojo" | "stade" }) {
  return variant === "dojo" ? <Dojo /> : <Stade />;
}

/**
 * Dojo : tatamis bleus de gymnase.
 *
 * La lecture tient à trois choses : la couleur, les joints entre les tapis, et
 * la zone de combat plus claire au centre, bordée de blanc. Les deux petits
 * traits au milieu sont les marques de départ des combattantes — le détail qui
 * fait reconnaître un tatami plutôt qu'un simple carrelage bleu.
 */
function Dojo() {
  // Tapis de 2 × 1 : 10 colonnes sur 8 rangées couvrent la surface.
  const seamsX = Array.from({ length: 9 }, (_, i) => (i + 1) * 10);
  const seamsY = Array.from({ length: 7 }, (_, i) => (i + 1) * 8);

  return (
    <Frame gradient={["#2f6fb8", "#12386a"]} id="dojo">
      {/* Zone de sécurité (le pourtour) puis zone de combat, plus claire. */}
      <rect x="14" y="7" width="72" height="50" fill="#3d86d6" opacity="0.55" />

      {/* Joints entre les tapis : statiques, sinon l'image clignote. */}
      <g stroke="#0d2b52" strokeOpacity="0.45" strokeWidth="0.45">
        {seamsX.map((x) => (
          <path key={`x${x}`} d={`M${x} 0V64`} />
        ))}
        {seamsY.map((y) => (
          <path key={`y${y}`} d={`M0 ${y}H100`} />
        ))}
      </g>

      {/* Reflet du gymnase sur le tapis. */}
      <path d="M0 0L38 0L14 64H0Z" fill="#ffffff" opacity="0.05" />

      <g fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8">
        <rect
          className="bsc-draw"
          style={{ ["--bsc-dash" as string]: "244" }}
          x="14"
          y="7"
          width="72"
          height="50"
        />
        <rect
          className="bsc-draw"
          style={{ ["--bsc-dash" as string]: "176", animationDelay: "0.35s" }}
          x="24"
          y="14"
          width="52"
          height="36"
          strokeOpacity="0.4"
        />
      </g>

      {/* Marques de départ, côte à côte au centre. */}
      <g strokeWidth="1.1" strokeLinecap="round">
        <path
          className="bsc-draw"
          style={{ ["--bsc-dash" as string]: "8", animationDelay: "0.7s" }}
          d="M45 32h-8"
          stroke="#ffffff"
          strokeOpacity="0.85"
        />
        <path
          className="bsc-draw"
          style={{ ["--bsc-dash" as string]: "8", animationDelay: "0.8s" }}
          d="M55 32h8"
          stroke="#e84670"
        />
      </g>
    </Frame>
  );
}

/** Stade : pelouse tracée, pour le créneau du dimanche matin à Grabels. */
function Stade() {
  return (
    <Frame gradient={["#8b1a3a", "#3d0b1a"]} id="stade">
      {/* Bandes de tonte. */}
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
        <rect
          className="bsc-draw"
          style={{ ["--bsc-dash" as string]: "330" }}
          x="6"
          y="6"
          width="88"
          height="52"
        />
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
      </g>
    </Frame>
  );
}

/** Cadre commun : fond dégradé, contenu, puis le mobile qui circule. */
function Frame({
  gradient,
  id,
  children,
}: {
  gradient: [string, string];
  id: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 100 64"
      className="h-full w-full"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`bsc-sol-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>

      <rect width="100" height="64" fill={`url(#bsc-sol-${id})`} />
      {children}

      <g className="bsc-ball">
        <circle r="3.6" fill="#ffffff" opacity="0.18" />
        <circle r="1.7" fill="#ffffff" />
      </g>
    </svg>
  );
}
