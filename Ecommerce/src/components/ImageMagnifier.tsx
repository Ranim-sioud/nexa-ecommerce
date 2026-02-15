import React, { useState, useRef } from "react";

interface ImageMagnifierProps {
  src: string;
  zoom?: number;
  size?: number; // diamètre de la loupe
  className?: string;
}

const ImageMagnifier: React.FC<ImageMagnifierProps> = ({ src, zoom = 2, size = 150, className }) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const { top, left, width, height } = e.currentTarget.getBoundingClientRect();
    const x = e.pageX - left - window.scrollX;
    const y = e.pageY - top - window.scrollY;

    if (x < 0 || y < 0 || x > width || y > height) {
      setShowMagnifier(false);
      return;
    }

    setShowMagnifier(true);
    setMagnifierPosition({ x, y });
  };

  return (
    <div className="relative inline-block">
      <img
        src={src}
        ref={imgRef}
        alt="zoom"
        className={`object-contain rounded-lg ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowMagnifier(false)}
      />

      {showMagnifier && (
        <div
          className="absolute pointer-events-none rounded-full border border-gray-300 shadow-lg"
          style={{
            top: magnifierPosition.y - size / 2,
            left: magnifierPosition.x - size / 2,
            width: size,
            height: size,
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${imgRef.current?.width! * zoom}px ${imgRef.current?.height! * zoom}px`,
            backgroundPositionX: -magnifierPosition.x * zoom + size / 2,
            backgroundPositionY: -magnifierPosition.y * zoom + size / 2,
          }}
        />
      )}
    </div>
  );
};

export default ImageMagnifier;