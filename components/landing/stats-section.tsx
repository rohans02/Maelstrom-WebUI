"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { RippleEffect } from "@/components/ui/ripple-effect"

interface Stat {
  label: string
  value: string
  suffix: string
  increment: number
}

const initialStats: Stat[] = [
  { label: "Total Liquidity", value: "89.2", suffix: "M", increment: 0.1 },
  { label: "24h Volume", value: "12.4", suffix: "M", increment: 0.05 },
  { label: "Active Pools", value: "247", suffix: "", increment: 1 },
  { label: "Total Trades", value: "1.2", suffix: "M", increment: 0.01 },
]

export function StatsSection() {
  const [stats, setStats] = useState(initialStats)

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prevStats) =>
        prevStats.map((stat) => ({
          ...stat,
          value: (Number.parseFloat(stat.value) + stat.increment * Math.random()).toFixed(stat.suffix === "" ? 0 : 1),
        })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
            Powering the Future of <span className="text-accent">DeFi</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Real-time metrics from our growing ecosystem</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="group text-center border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden cursor-pointer">
              <RippleEffect color="rgba(124, 58, 237, 0.06)" />
              <CardContent className="p-3 sm:p-4 md:p-6 relative">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent mb-1 sm:mb-2">
                  {stat.value}
                  {stat.suffix && <span className="text-sm sm:text-base md:text-lg">{stat.suffix}</span>}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                <div className="mt-1 sm:mt-2 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse mr-1 sm:mr-2" />
                  <span className="text-[10px] sm:text-xs text-green-500">Live</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
