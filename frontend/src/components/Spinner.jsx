const Spinner = ({ size = 32, color = "#2563eb" }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 50 50"
    style={{ display: "inline-block" }}
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      strokeDasharray="31.415, 31.415"
      transform="rotate(0 25 25)"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 25 25"
        to="360 25 25"
        dur="1s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

export default Spinner; 