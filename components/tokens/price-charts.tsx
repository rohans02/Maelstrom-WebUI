"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  ChartOptions,
  ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Token } from "@/types/token";
import { Pool } from "@/types/pool";
import { BuyTrade, SellTrade } from "@/types/trades";
import { ContractClient } from "@/lib/contract-client";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { RefreshCw, Clock, TrendingUp } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface PriceChartsProps {
  token: Token;
  pool: Pool;
}

interface ChartDataPoint {
  x: number; // timestamp
  y: number | null; // price value
  formattedTime: string;
  isStep?: boolean; // indicates if this is a step point (same timestamp as previous)
}

interface TradeData {
  timestamp: number;
  buyPriceBefore?: number;
  buyPriceAfter?: number;
  sellPriceBefore?: number;
  sellPriceAfter?: number;
  formattedTime: string;
}

const BLOCKS_PER_FETCH = 999; // Load 1000 blocks at a time

export function PriceCharts({ token, pool }: PriceChartsProps) {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextBlockToFetch, setNextBlockToFetch] = useState<number | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const { chainId, chain } = useAccount();
  const nativeCurrencySymbol = chain?.nativeCurrency?.symbol || "ETH";
  const contractClient = useMemo(
    () => new ContractClient(writeContractAsync, publicClient, chainId),
    [chainId, writeContractAsync, publicClient]
  );

  const processTradeData = useCallback(
    (buyTrades: BuyTrade[], sellTrades: SellTrade[]): TradeData[] => {
      // Create a map to merge trades at the same timestamp
      const tradeMap = new Map<number, TradeData>();

      // Process buy trades - now includes both buy and sell prices
      buyTrades.forEach((trade) => {
        const tradeDate = new Date(trade.timestamp);
        const formattedTime = tradeDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const buyPriceBefore = parseFloat(formatEther(BigInt(trade.buyPrice)));
        const buyPriceAfter = parseFloat(formatEther(BigInt(trade.updatedBuyPrice)));
        const sellPrice = parseFloat(formatEther(BigInt(trade.sellPrice)));

        if (tradeMap.has(trade.timestamp)) {
          const existing = tradeMap.get(trade.timestamp)!;
          existing.buyPriceBefore = buyPriceBefore;
          existing.buyPriceAfter = buyPriceAfter;
          // Sell price doesn't change during buy trade
          existing.sellPriceBefore = sellPrice;
          existing.sellPriceAfter = sellPrice;
        } else {
          tradeMap.set(trade.timestamp, {
            timestamp: trade.timestamp,
            buyPriceBefore,
            buyPriceAfter,
            sellPriceBefore: sellPrice,
            sellPriceAfter: sellPrice,
            formattedTime,
          });
        }
      });

      // Process sell trades - now includes both sell and buy prices
      sellTrades.forEach((trade) => {
        const tradeDate = new Date(trade.timestamp);
        const formattedTime = tradeDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const sellPriceBefore = parseFloat(formatEther(BigInt(trade.sellPrice)));
        const sellPriceAfter = parseFloat(formatEther(BigInt(trade.updatedSellPrice)));
        const buyPrice = parseFloat(formatEther(BigInt(trade.buyPrice)));

        if (tradeMap.has(trade.timestamp)) {
          const existing = tradeMap.get(trade.timestamp)!;
          existing.sellPriceBefore = sellPriceBefore;
          existing.sellPriceAfter = sellPriceAfter;
          // Buy price doesn't change during sell trade
          existing.buyPriceBefore = buyPrice;
          existing.buyPriceAfter = buyPrice;
        } else {
          tradeMap.set(trade.timestamp, {
            timestamp: trade.timestamp,
            buyPriceBefore: buyPrice,
            buyPriceAfter: buyPrice,
            sellPriceBefore,
            sellPriceAfter,
            formattedTime,
          });
        }
      });

      // Convert to array and sort by timestamp
      return Array.from(tradeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    },
    []
  );

  const fetchNextBatch = useCallback(async () => {
    if (loading || !hasMoreData) return;

    setLoading(true);
    setError(null);

    try {
      // Get the current block if we don't have it yet
      let toBlock: number;
      if (nextBlockToFetch === null) {
        const latestBlock = await publicClient?.getBlockNumber();
        if (!latestBlock) {
          throw new Error("Unable to get current block number");
        }
        toBlock = Number(latestBlock);
      } else {
        toBlock = nextBlockToFetch;
      }

      const fromBlock = Math.max(0, toBlock - BLOCKS_PER_FETCH);

      // Fetch trades for this block range
      const [buyTrades, sellTrades] = await Promise.all([
        contractClient.getBuyTradeEventLogs(fromBlock, toBlock, token),
        contractClient.getSellTradeEventLogs(fromBlock, toBlock, token),
      ]);

      console.log("Fetched trades from blocks", fromBlock, "to", toBlock);

      // Process trade data
      const newTradeData = processTradeData(buyTrades, sellTrades);

      // Add new data to existing data
      setTradeData((prevData) => {
        const combined = [...prevData, ...newTradeData];
        // Sort by timestamp and remove duplicates
        const uniqueData = Array.from(
          new Map(combined.map((item) => [item.timestamp, item])).values()
        ).sort((a, b) => a.timestamp - b.timestamp);
        return uniqueData;
      });

      // Update next block to fetch
      if (fromBlock > 0) {
        setNextBlockToFetch(fromBlock - 1);
      } else {
        setHasMoreData(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch trade data";
      setError(errorMessage);
      console.error("Error fetching trade data:", err);
    } finally {
      setLoading(false);
    }
  }, [
    publicClient,
    contractClient,
    token,
    processTradeData,
    nextBlockToFetch,
    hasMoreData,
    loading,
  ]);

  // Initial data fetch
  useEffect(() => {
    fetchNextBatch();
  }, []); // Only run on mount

  const currentBuyPrice = parseFloat(formatEther(BigInt(pool.buyPrice)));
  const currentSellPrice = parseFloat(formatEther(BigInt(pool.sellPrice)));

  // Create chart data with step pattern and linear interpolation
  const { buyChartData, sellChartData } = useMemo(() => {
    const now = Date.now();
    const formattedNow = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Add current prices to trade data
    const allData = [...tradeData, {
      timestamp: now,
      buyPriceBefore: currentBuyPrice,
      buyPriceAfter: currentBuyPrice,
      sellPriceBefore: currentSellPrice,
      sellPriceAfter: currentSellPrice,
      formattedTime: formattedNow,
    }];

    const buyPoints: ChartDataPoint[] = [];
    const sellPoints: ChartDataPoint[] = [];

    allData.forEach((trade, index) => {
      // Every trade now has both buy and sell price data
      const hasBuyData = trade.buyPriceBefore !== undefined && trade.buyPriceAfter !== undefined;
      const hasSellData = trade.sellPriceBefore !== undefined && trade.sellPriceAfter !== undefined;

      // Handle buy price
      if (hasBuyData) {
        // Only add step pattern if price changed during this trade
        if (trade.buyPriceBefore !== trade.buyPriceAfter) {
          // Add the "before" price at this timestamp
          buyPoints.push({
            x: trade.timestamp,
            y: trade.buyPriceBefore!,
            formattedTime: trade.formattedTime,
            isStep: true,
          });

          // Add the "after" price at same timestamp (vertical step)
          buyPoints.push({
            x: trade.timestamp,
            y: trade.buyPriceAfter!,
            formattedTime: trade.formattedTime,
            isStep: true,
          });
        } else {
          // If price didn't change, just add a single point
          buyPoints.push({
            x: trade.timestamp,
            y: trade.buyPriceAfter!,
            formattedTime: trade.formattedTime,
            isStep: false,
          });
        }
      }

      // Handle sell price
      if (hasSellData) {
        // Only add step pattern if price changed during this trade
        if (trade.sellPriceBefore !== trade.sellPriceAfter) {
          // Add the "before" price at this timestamp
          sellPoints.push({
            x: trade.timestamp,
            y: trade.sellPriceBefore!,
            formattedTime: trade.formattedTime,
            isStep: true,
          });

          // Add the "after" price at same timestamp (vertical step)
          sellPoints.push({
            x: trade.timestamp,
            y: trade.sellPriceAfter!,
            formattedTime: trade.formattedTime,
            isStep: true,
          });
        } else {
          // If price didn't change, just add a single point
          sellPoints.push({
            x: trade.timestamp,
            y: trade.sellPriceAfter!,
            formattedTime: trade.formattedTime,
            isStep: false,
          });
        }
      }
    });

    return { buyChartData: buyPoints, sellChartData: sellPoints };
  }, [tradeData, currentBuyPrice, currentSellPrice]);

  // Chart.js configuration
  const chartData = {
    datasets: [
      {
        label: 'Buy Price',
        data: buyChartData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0, // No curve, straight lines
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y',
        },
      },
      {
        label: 'Sell Price',
        data: sellChartData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0, // No curve, straight lines
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y',
        },
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          color: 'rgb(148, 163, 184)',
          callback: function(value) {
            return new Date(value as number).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          },
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: 'rgb(148, 163, 184)',
          callback: function(value) {
            return `${Number(value).toFixed(8)}`;
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        border: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 25, 40, 0.95)',
        titleColor: 'rgb(148, 163, 184)',
        bodyColor: 'rgb(255, 255, 255)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: function(context) {
            if (context[0]) {
              const point = context[0].raw as ChartDataPoint;
              return point.formattedTime;
            }
            return '';
          },
          label: function(context) {
            const value = context.parsed.y;
            if (value === null) return '';
            const label = context.dataset.label;
            return `${label}: ${value.toFixed(8)} ${nativeCurrencySymbol}`;
          },
        },
      },
    },
  };

  const totalDataPoints = tradeData.length;

  // Calculate statistics
  const avgBuyPrice = useMemo(() => {
    const buyPrices = tradeData
      .map(t => t.buyPriceAfter)
      .filter((p): p is number => p !== undefined);
    if (buyPrices.length === 0) return currentBuyPrice;
    return buyPrices.reduce((sum, price) => sum + price, 0) / buyPrices.length;
  }, [tradeData, currentBuyPrice]);

  const avgSellPrice = useMemo(() => {
    const sellPrices = tradeData
      .map(t => t.sellPriceAfter)
      .filter((p): p is number => p !== undefined);
    if (sellPrices.length === 0) return currentSellPrice;
    return sellPrices.reduce((sum, price) => sum + price, 0) / sellPrices.length;
  }, [tradeData, currentSellPrice]);

  return (
    <div className="space-y-6">
      {/* Header with Load More Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Price Charts</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {totalDataPoints > 0
              ? `${totalDataPoints} trade events loaded`
              : "No data yet"}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={fetchNextBatch}
            disabled={loading || !hasMoreData}
            className="relative overflow-hidden bg-gradient-to-r from-accent-blue/20 to-primary-500/20 hover:from-accent-blue/30 hover:to-primary-500/30 
              border border-accent-blue/20 hover:border-accent-blue/40 text-accent-blue hover:text-white
              backdrop-blur-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            size="sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/5 to-primary-500/5" />
            <div className="relative flex items-center">
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              {loading
                ? "Loading..."
                : hasMoreData
                ? "Load More Data"
                : "No More Data"}
            </div>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Combined Price Chart */}
      <Card className="relative overflow-hidden">
        {/* Glass morphism effects */}
        <div className="absolute inset-0 bg-background-800/40 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.08] to-primary-500/[0.05]" />
        <div className="absolute inset-0 border border-white/[0.05] rounded-lg" />

        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h4 className="text-sm text-muted-foreground font-medium mb-3">
                Price Chart
              </h4>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Buy Price</p>
                  <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">
                    {currentBuyPrice.toFixed(8)} {nativeCurrencySymbol}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sell Price</p>
                  <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">
                    {currentSellPrice.toFixed(8)} {nativeCurrencySymbol}
                  </p>
                </div>
              </div>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                {totalDataPoints > 0
                  ? `${totalDataPoints} trade events`
                  : "No data"}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Buy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">Sell</span>
              </div>
            </div>
          </div>

          {loading && totalDataPoints === 0 ? (
            <div className="h-[400px] w-full flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-accent-blue" />
                <p className="text-sm text-muted-foreground">
                  Loading price data...
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Summary Stats */}
      {totalDataPoints > 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background-800/40 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.08] to-primary-500/[0.05]" />
          <div className="absolute inset-0 border border-white/[0.05] rounded-lg" />

          <CardContent className="relative p-6">
            <h4 className="text-lg font-semibold mb-4 text-white">
              Price Statistics
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <div className="text-xs text-muted-foreground mb-1">
                  Current Spread
                </div>
                <div className="text-sm font-medium text-white">
                  {(
                    ((currentBuyPrice - currentSellPrice) / ((currentSellPrice + currentBuyPrice)/2)) *
                    100
                  ).toFixed(2)}
                  %
                </div>
              </div>

              <div className="text-center p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <div className="text-xs text-muted-foreground mb-1">
                  Avg Buy Price
                </div>
                <div className="text-sm font-medium text-emerald-400">
                  {avgBuyPrice.toFixed(8)} {nativeCurrencySymbol}
                </div>
              </div>

              <div className="text-center p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <div className="text-xs text-muted-foreground mb-1">
                  Avg Sell Price
                </div>
                <div className="text-sm font-medium text-red-400">
                  {avgSellPrice.toFixed(8)} {nativeCurrencySymbol}
                </div>
              </div>

              <div className="text-center p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <div className="text-xs text-muted-foreground mb-1">
                  Trade Events
                </div>
                <div className="text-sm font-medium text-accent-blue">
                  {totalDataPoints}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.05]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data Points:</span>
                <span className="text-white">{buyChartData.length + sellChartData.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="text-white flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
