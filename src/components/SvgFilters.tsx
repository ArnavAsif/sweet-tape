export default function SvgFilters() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter id="peel-back" x="0%" y="0%" width="100%" height="100%">
          <feFlood floodColor="#d7d2c7" result="flood" />
          <feComposite operator="in" in="flood" in2="SourceAlpha" />
        </filter>
        <filter id="peel-back-kraft" x="0%" y="0%" width="100%" height="100%">
          <feFlood floodColor="#dbac80" result="flood" />
          <feComposite operator="in" in="flood" in2="SourceAlpha" />
        </filter>
        <filter id="peel-back-black" x="0%" y="0%" width="100%" height="100%">
          <feFlood floodColor="#2f2f2f" result="flood" />
          <feComposite operator="in" in="flood" in2="SourceAlpha" />
        </filter>
        <filter id="peel-back-masking" x="0%" y="0%" width="100%" height="100%">
          <feFlood floodColor="#d3c393" result="flood" />
          <feComposite operator="in" in="flood" in2="SourceAlpha" />
        </filter>
        <filter id="peel-back-tissue" x="0%" y="0%" width="100%" height="100%">
          <feFlood floodColor="#e3e3e3" result="flood" />
          <feComposite operator="in" in="flood" in2="SourceAlpha" />
        </filter>
        <filter id="peel-back-clear" x="0%" y="0%" width="100%" height="100%">
          <feFlood floodColor="#6a6a6a" result="flood" />
          <feComposite operator="in" in="flood" in2="SourceAlpha" />
        </filter>
        <filter id="peel-back-mark" x="0%" y="0%" width="100%" height="100%">
          <feFlood floodColor="#60a000" result="flood" />
          <feComposite operator="in" in="flood" in2="SourceAlpha" />
        </filter>
      </defs>
    </svg>
  );
}
