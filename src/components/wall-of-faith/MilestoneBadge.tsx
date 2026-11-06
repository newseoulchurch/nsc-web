export default function MilestoneBadge({ text }: { text: string }) {
  return (
    <span className="inline-block rounded-full border border-[#d9c9b0] bg-[#fffaf4] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#8b7355] max-w-full [overflow-wrap:anywhere]">
      <span aria-hidden className="mr-1">✦</span>
      {text}
    </span>
  );
}
