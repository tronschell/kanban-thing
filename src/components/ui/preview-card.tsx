"use client";

import { useRef, useState } from "react";

interface PreviewCardProps {
  children: React.ReactNode;
}

export function PreviewCard({ children }: PreviewCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 4; // Reduced from 10 to 5 degrees for subtler effect
  const PADDING = 150; // Virtual padding around the element for smoother edge behavior

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    
    // Add virtual padding to the detection area
    const width = rect.width + (PADDING * 2);
    const height = rect.height + (PADDING * 2);
    
    // Adjust mouse position relative to padded area
    const mouseX = e.clientX - (rect.left - PADDING);
    const mouseY = e.clientY - (rect.top - PADDING);

    // Ensure mouse position is within bounds
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
      return;
    }

    const horizontal = (mouseX - width / 2) / (width / 2);
    const vertical = (mouseY - height / 2) / (height / 2);
    
    // Calculate rotation values with easing
    const rotateX = vertical * -THRESHOLD;
    const rotateY = horizontal * THRESHOLD;

    setMousePos({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative perspective-[1000px] transition-all duration-200 ease-out"
      style={{
        transform: `perspective(1000px) rotateX(${mousePos.x}deg) rotateY(${mousePos.y}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
} 