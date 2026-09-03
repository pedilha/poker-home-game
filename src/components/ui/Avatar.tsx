const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
};

export default function Avatar({
  src,
  name,
  size = "sm",
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${sizes[size]} shrink-0 rounded-full border border-border object-cover`}
      />
    );
  }

  return (
    <span
      className={`flex ${sizes[size]} shrink-0 items-center justify-center rounded-full border border-border bg-surface-hover font-semibold text-muted`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
