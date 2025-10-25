"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CircularText from "@/components/CircularText";
import { ArrowRight } from "lucide-react";
import { WaveRippleCanvas } from "../ui/wave-ripple-canvas";

export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [textPositions, setTextPositions] = useState<
    Array<{
      text: string;
      size: number;
      x: number;
      y: number;
      font?: string;
      weight?: string;
    }>
  >([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });
    };

    const calculateTextPositions = () => {
      const centerY = window.innerHeight / 2;
      setTextPositions([
        {
          text: "Auction-Based",
          size: 100,
          x: window.innerWidth / 2,
          y: centerY - 55, // Adjusted position
          weight: "700",
        },
        {
          text: "Liquidity Pools",
          size: 100,
          x: window.innerWidth / 2,
          y: centerY + 45, // Adjusted position
          weight: "700",
        },
        {
          text: "Automated Market Making",
          size: 28,
          x: window.innerWidth / 2,
          y: centerY + 120, // Adjusted position
          font: "Plus Jakarta Sans, sans-serif",
          weight: "500",
        },
        {
          text: "with Proper Price Discovery",
          size: 28,
          x: window.innerWidth / 2,
          y: centerY + 160, // Adjusted position
          font: "Plus Jakarta Sans, sans-serif",
          weight: "500",
        },
      ]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", calculateTextPositions);
    calculateTextPositions();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", calculateTextPositions);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#001233]">
      {/* Wave Ripple Effect */}
      <div className="absolute inset-0 z-10">
        <WaveRippleCanvas
          mousePosition={mousePosition}
          texts={textPositions}
          className="opacity-90"
        />
      </div>

      {/* Gradient Overlay - adjusted for dark blue background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#001233] via-[#001845]/10 to-[#001233]/70 pointer-events-none z-20" />

      {/* Visible Content */}
      <div className="relative container mx-auto px-4 text-center z-30">
        <div className="max-w-4xl mx-auto">
          {/* Animated Circular Text - Positioned to encompass all content */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <CircularText
              text="MAELSTROM*MAELSTROM*"
              onHover="speedUp"
              spinDuration={60}
              className="hero-circular-text"
            />
          </div>

          {/* Hidden but accessible text */}
          <div className="sr-only">
            <h1>MAELSTROM EXCHANGE</h1>
            <p>Next Generation DeFi Protocol</p>
          </div>

          {/* Spacer for canvas text */}
          <div className="h-[300px]"></div>

          {/* CTA Buttons - Positioned below canvas text */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-32">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent-cyan-2 text-accent-foreground glow-primary"
            >
              <Link href="/swap">
                Swap
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Trust Indicators - Below CTA buttons */}
          {/* <div className="pt-8 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Audited Smart Contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>$50M+ TVL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Zero Slippage Trading</span>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
}
