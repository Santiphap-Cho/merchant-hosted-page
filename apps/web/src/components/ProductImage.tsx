import { useState } from "react";

const PLACEHOLDER = "/placeholder-product.svg";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className = "" }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER);
  const [failed, setFailed] = useState(false);

  return (
    <img
      src={failed ? PLACEHOLDER : imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}
