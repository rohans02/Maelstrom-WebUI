"use client";

import { Deposit, Withdraw } from "@/types/trades";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

interface RecentActivityProps {
  events: (Deposit | Withdraw)[];
}

interface Activity {
  type: string;
  token: string;
  amount: string;
  timestamp: number;
}

export function RecentActivity({ events }: RecentActivityProps) {
  const { chainId, chain } = useAccount();
  const nativeCurrencySymbol = chain?.nativeCurrency?.symbol || "ETH";
  const [transactions, setTransactions] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    // Sort events by timestamp in descending order
    const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
    const updatedEvents: Activity[] = sortedEvents.map((event) => {
      if ("lpTokensMinted" in event) {
        return {
          type: "Deposit",
          token: event.token.symbol,
          amount: `${formatEther(BigInt(event.ethAmount))} ${nativeCurrencySymbol} + ${formatEther(
            BigInt(event.tokenAmount)
          )} ${event.token.symbol}`,
          timestamp: event.timestamp,
        };
      } else {
        return {
          type: "Withdraw",
          token: event.token.symbol,
          amount: `${formatEther(BigInt(event.ethAmount))} ${nativeCurrencySymbol} + ${formatEther(
            BigInt(event.tokenAmount)
          )} ${event.token.symbol}`,
          timestamp: event.timestamp,
        };
      }
    });
    setTransactions(updatedEvents);
    setIsLoading(false);
  }, [events]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/90">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="relative rounded-lg p-4 border border-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-16 bg-white/5 rounded-full animate-pulse" />
                    <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>
            </div>
          ))
        ) : transactions.length > 0 ? (
          transactions.map((activity, index) => (
            <div
              key={index}
              className="relative group rounded-lg p-4 transition-all duration-200
              hover:bg-white/[0.02] border border-transparent hover:border-white/[0.05]"
            >
              <div className="flex items-start gap-4">
                {/* Activity Icon */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-foreground">
                      {activity.type}
                    </p>
                    <span className="text-xs text-muted-foreground/60">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground/70 bg-muted-foreground/10 px-2 py-1 rounded-full">
                      {activity.token}
                    </span>
                    <span className="text-sm font-medium">
                      {activity.amount}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300
              bg-gradient-to-r from-accent/5 via-transparent to-transparent rounded-lg"
              />
            </div>
          ))
        ) : (
          <div className="relative rounded-lg p-4 border border-white/[0.05] text-center text-muted-foreground/60">
            No recent activity found
          </div>
        )}
      </div>
    </div>
  );
}
