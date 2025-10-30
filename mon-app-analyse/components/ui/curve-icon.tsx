interface CurveIconProps {
  color: string
  className?: string
}

export function CurveIcon({ color, className = "" }: CurveIconProps) {
  return (
    <svg
      width="30"
      height="14"
      viewBox="0 0 30 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        {/* Ligne gauche */}
        <rect
          x="0"
          y="6"
          width="9"
          height="2"
          fill={color}
        />
        {/* Cercle central */}
        <circle
          cx="15"
          cy="7"
          r="6"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        {/* Ligne droite */}
        <rect
          x="21"
          y="6"
          width="9"
          height="2"
          fill={color}
        />
      </g>
    </svg>
  )
}
