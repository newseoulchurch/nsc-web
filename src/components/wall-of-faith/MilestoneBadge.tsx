export default function MilestoneBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#d9c9b0] bg-[#fffaf4] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#8b7355] max-w-full break-words">
      <span aria-hidden>✦</span>
      {text}
    </span>
  );
}
