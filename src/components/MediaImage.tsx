"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

// If an uploaded replacement disappears, keep showing the protected original.
export default function MediaImage({ src, fallbackSrc, alt, onFallback, ...props }: ImageProps & { fallbackSrc: string; onFallback?: () => void }) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  return <Image {...props} alt={alt} src={failedSrc === src ? fallbackSrc : src} onError={() => { setFailedSrc(src); onFallback?.(); }} />;
}
