// Downscale to ≤1600px on the long edge and re-encode as JPEG, stepping quality down toward ~500KB.
// Canvas re-encoding drops EXIF, so admin uploads carry no GPS either.
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있습니다.");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 생성에 실패했습니다.");
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  for (const q of [0.85, 0.75, 0.65, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && (blob.size <= 500 * 1024 || q === 0.55)) {
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  }
  throw new Error("이미지를 처리하지 못했습니다.");
}
