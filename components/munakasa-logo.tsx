export const MunakasaLogo = ({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) => (
  <svg
    className={
      className ?? (size !== undefined ? "block shrink-0" : "h-8 w-8 text-secondary")
    }
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <g transform="translate(0 -2)">
      <path d="M 4 21 L 4 7 L 12 15 L 20 7" />
      <polyline points="14 7 20 7 20 13" />
    </g>
  </svg>
);
