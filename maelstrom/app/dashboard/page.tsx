"use client";

import { Header } from "@/components/header";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PoolsTable } from "@/components/dashboard/pools-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { ContractClient } from "@/lib/contract-client";
import { CONTRACT_ADDRESS } from "@/types/contract";
import { useEffect, useState } from "react";
import { RowPool } from "@/types/pool";
import { toast } from "sonner";
import { set } from "lodash";
import { formatEther, parseEther } from "viem";
import { Deposit, Withdraw } from "@/types/trades";

export default function DashboardPage() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const contractClient = new ContractClient(
    CONTRACT_ADDRESS,
    writeContractAsync,
    publicClient
  );
  const { address } = useAccount();
  const [totalPools, setTotalPools] = useState<number>(0);
  const [totalLiquidity, setTotalLiquidity] = useState<string>("0");
  const [portfolioValue, setPortfolioValue] = useState<string>("0");
  const [totalProfit, setTotalProfit] = useState<string>("0");
  const [events, setEvents] = useState<(Deposit | Withdraw)[]>([]);
  const [pools, setPools] = useState<RowPool[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const POOL_FETCH_LIMIT = 5;

  const fetchPoolCount = async () => {
    if (!address) return;
    try {
      const count = await contractClient.getUserPoolCount(address!);
      setTotalPools(count);
    } catch (error) {
      console.error("Error fetching pool count:", error);
      toast.error("Failed to fetch pool count.");
    }
  };

  const fetchUserPools = async () => {
    if (!address) return;
    try {
      for (let i = 0; i < Math.ceil(totalPools / POOL_FETCH_LIMIT); i++) {
        const userPools = await contractClient.getUserPools(
          address,
          i * POOL_FETCH_LIMIT,
          POOL_FETCH_LIMIT
        );
        setPools((prevPools) => [...prevPools, ...userPools]);
      }
    } catch (error) {
      console.error("Error fetching user pools:", error);
      toast.error("Failed to fetch user pools.");
    }
  };

  const fetchRecentDeposits = async () => {
    if (!address) return;
    try {
      const currentBlock = await publicClient?.getBlock();
      if (!currentBlock) return;
      const deposits = await contractClient.getDepositEventLogs(
        Number(currentBlock.number) - 1000,
        Number(currentBlock.number),
        undefined,
        address
      );
      setEvents(deposits);
    } catch (error) {
      console.error("Error fetching recent deposits:", error);
      toast.error("Failed to fetch recent deposits.");
    }
  };

  const fetchRecentWithdrawals = async () => {
    if (!address) return;
    try {
      const currentBlock = await publicClient?.getBlock();
      if (!currentBlock) return;
      const withdrawals = await contractClient.getWithdrawEventLogs(
        Number(currentBlock.number) - 1000,
        Number(currentBlock.number),
        undefined,
        address
      );
      setEvents((prevEvents) => [...prevEvents, ...withdrawals]);
    } catch (error) {
      console.error("Error fetching recent withdrawals:", error);
      toast.error("Failed to fetch recent withdrawals.");
    }
  };

  const fetchUserLiquidity = async () => {
    if (!address) return;
    try {
      const liquidity = await contractClient.getUserLiquidity(address);
      setTotalLiquidity(liquidity);
    } catch (error) {
      console.error("Error fetching user liquidity:", error);
      toast.error("Failed to fetch user liquidity.");
    }
  };

  const calculatePortfolioValue = () => {
    let total = BigInt(0);
    for (const pool of pools) {
      const proportion =
        BigInt(pool.lpToken!.balance) / BigInt(pool.lpToken!.totalSupply);
      total += proportion * BigInt(pool.totalLiquidity);
    }
    setPortfolioValue(Number(formatEther(total)).toFixed(4));
  };

  const calculateProfit = () => {
    const gain =
      ((Number(portfolioValue) - Number(totalLiquidity)) /
        Number(totalLiquidity)) *
      100;
    setTotalProfit(gain.toFixed(2));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await fetchPoolCount();
        await fetchUserPools();
        await fetchUserLiquidity();
        await fetchRecentDeposits();
        await fetchRecentWithdrawals();
        calculatePortfolioValue();
        calculateProfit();
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to fetch dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  },[]);

  return (
    <div className="min-h-screen relative bg-gradient-pattern overflow-hidden">
      {/* Enhanced background effects */}
      <Header />

      <main className="container relative mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Header with glass effect */}
          <div className="relative rounded-xl p-8 overflow-hidden backdrop-blur-xl border border-white/[0.05]">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.08] to-primary-500/[0.05]" />
            <div className="absolute inset-0 border border-white/[0.05] rounded-xl" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold font-clash-display text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                    Dashboard Overview
                  </h1>
                  <p className="text-muted-foreground/70 mt-2 max-w-[600px] font-plus-jakarta">
                    Monitor your positions, track performance, and manage your
                    DeFi portfolio.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <DashboardOverview
            portfolioValue={portfolioValue}
            totalLiquidity={totalLiquidity}
            profit={totalProfit}
            activePools={totalPools.toString()}
            loading={isLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Portfolio & Pools */}
            <div className="lg:col-span-2 space-y-8">
              <div className="relative rounded-xl overflow-hidden backdrop-blur-xl border border-white/[0.05]">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.08] to-primary-500/[0.05]" />
                <div className="absolute inset-0 border border-white/[0.05] rounded-xl" />
                <div className="relative">
                  <PoolsTable pools={pools} loading={isLoading} />
                </div>
              </div>
            </div>

            {/* Right Column - Activity with glass effect */}
            <div className="relative rounded-xl overflow-hidden backdrop-blur-xl border border-white/[0.05]">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.08] to-primary-500/[0.05]" />
              <div className="absolute inset-0 border border-white/[0.05] rounded-xl" />
              <div className="relative">
                <RecentActivity events={events} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-cyan)/10%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--primary-500)/5%,transparent_50%)]" />
      </div>
    </div>
  );
}
