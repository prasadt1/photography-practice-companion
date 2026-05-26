/**
 * Iris mark — uses the approved raster (eye + mechanical aperture + tick arcs).
 * Vector blade attempts read as flower petals at sidebar size; PNG matches the comp.
 */
export function IrisMark({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/iris-icon.png"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ maxWidth: size, maxHeight: size }}
      aria-hidden
      decoding="async"
    />
  );
}
