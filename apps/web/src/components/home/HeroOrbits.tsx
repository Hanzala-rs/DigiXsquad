/**
 * Decorative background behind "DIGITAL · portrait · SQUAD": rings of dots and dashes that slowly
 * rotate in alternating directions. Pure SVG + CSS (`.ds-orbit` in globals.css), no JS.
 */
type Ring = {
  r: number;
  secs: number;
  color: string;
  width: number;
  dash?: string;
  butt?: boolean;
  dots?: [deg: number, size: number][];
};

const rings: Ring[] = [
  { r: 480, secs: 140, color: '255 154 31 / 0.4', width: 3, dash: '0.1 16' },
  { r: 445, secs: -200, color: '255 106 0 / 0.22', width: 10, dash: '1.5 22', butt: true },
  {
    r: 390,
    secs: 90,
    color: '255 106 0 / 0.3',
    width: 1.5,
    dash: '90 40 8 40',
    dots: [
      [-30, 5],
      [150, 4],
    ],
  },
  {
    r: 320,
    secs: -60,
    color: '255 106 0 / 0.14',
    width: 1,
    dots: [
      [20, 3.5],
      [140, 3],
      [260, 4],
    ],
  },
  { r: 250, secs: -90, color: '255 154 31 / 0.28', width: 5, dash: '0.1 30' },
];

export function HeroOrbits() {
  return (
    <div className="ds-orbits" aria-hidden="true">
      <svg viewBox="-500 -500 1000 1000" fill="none" strokeLinecap="round">
        {rings.map(({ r, secs, color, width, dash, butt, dots = [] }) => (
          // negative `secs` = counter-clockwise
          <g
            key={r}
            className="ds-orbit"
            style={{
              animationDuration: `${Math.abs(secs)}s`,
              animationDirection: secs < 0 ? 'reverse' : undefined,
            }}
          >
            <circle
              r={r}
              stroke={`rgb(${color})`}
              strokeWidth={width}
              strokeDasharray={dash}
              strokeLinecap={butt ? 'butt' : undefined}
            />
            {dots.map(([deg, size]) => {
              const a = (deg * Math.PI) / 180;
              const [x, y] = [r * Math.cos(a), r * Math.sin(a)];
              return (
                <g key={deg}>
                  <circle cx={x} cy={y} r={size * 3} fill="rgb(255 106 0 / 0.12)" />
                  <circle cx={x} cy={y} r={size} fill="rgb(255 154 31 / 0.85)" />
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
