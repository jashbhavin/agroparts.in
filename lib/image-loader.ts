'use client';
import type { ImageLoaderProps } from 'next/image';
/** Static, pre-compressed responsive images: no paid image service or runtime backend. */
export default function imageLoader({ src, width }: ImageLoaderProps) {
 return src.endsWith('.webp') ? src.replace(/\.webp$/, `-${width}.webp`) : src;
}
