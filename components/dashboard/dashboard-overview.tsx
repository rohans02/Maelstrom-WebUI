"use client";

import { Card } from "@/components/ui/card";
import { useAccount } from "wagmi";

interface Stat {
  portfolioValue: string;
  // totalLiquidity: string;
  activePools: string;
  // profit: string;
  loading: boolean;
}

export function DashboardOverview({
  portfolioValue,
  // totalLiquidity,
  activePools,
  // profit,
  loading,
}: Stat) {
  const { chainId, chain } = useAccount();
  const nativeCurrencySymbol = chain?.nativeCurrency?.symbol || "ETH";
  const stats = [
    {
      label: "Portfolio Value",
      value: loading ? "..." : `${Number(portfolioValue).toFixed(8)} ${nativeCurrencySymbol}`,
    },
    // {
    //   label: "Total Liquidity",
    //   value: loading ? "..." : `${Number(totalLiquidity).toFixed(8)} ETH`,
    // },
    {
      label: "Active Pools",
      value: loading ? "..." : activePools.toString(),
    },
    // {
    //   label: "Estimated APR",
    //   value: loading ? "..." : `${profit}%`,
    // },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="relative overflow-hidden border-0 group"
        >
          <div className="absolute inset-0 bg-background-800/40 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.08] to-primary-500/[0.05]" />
          <div className="absolute inset-0 border border-white/[0.05] rounded-lg" />
          <div className="relative z-10 p-6">
            {/* Value with gradient text */}
            <div
              className="text-2xl font-bold font-clash-display mb-1 text-transparent bg-clip-text bg-gradient-to-r 
              from-white to-white/90 group-hover:to-white/100 transition-colors"
            >
              {stat.value}
            </div>

            {/* Label with subtle opacity */}
            <div className="text-sm text-muted-foreground/70 mb-3">
              {stat.label}
            </div>

            {/* Decorative gradient corner */}
            <div
              className={`
              absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-50 transition-opacity
              group-hover:opacity-30 bg-blue-500 `}
            />
          </div>

          {/* Hover gradient overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
            bg-gradient-to-r from-accent/5 via-transparent to-transparent"
          />
        </Card>
      ))}
    </div>
  );
}
