import { LiquidityPoolToken, Token } from "./token"

export interface BuyTrade{
  token: Token
  buyPrice: string
  ethAmount: string
  timestamp: number
}

export interface SellTrade{
  token: Token
  sellPrice: string
  ethAmount: string
  timestamp: number
}

export interface SwapTrade{
    tokenIn: Token
    tokenOut: Token
    amountIn: string
    amountOut: string
    sellPrice: string
    buyPrice: string
    timestamp: number
}

export interface Deposit{
    token: Token
    ethAmount: string
    tokenAmount: string
    lpTokensMinted: string
    timestamp: number
}

export interface Withdraw{
    token: Token
    lpTokensBurnt: string
    ethAmount: string
    tokenAmount: string
    timestamp: number
}

export interface SwapRequest{
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  minimumTokenOut: string
}

export interface SellRequest{
  token: Token,
  amountIn: string,
  minimumEthAmount: string
}

export interface BuyRequest{
  token: Token,
  amountIn: string
  minimumAmountToBuy: string
}

export interface DepositRequest{
  token: Token,
  ethAmount: string
  tokenAmount: string
}

export interface WithdrawRequest{
  token: Token,
  lpToken: LiquidityPoolToken,
  lpTokenAmount: string
}

export interface SwapResult{
  success: boolean
  txHash: string
  swapRequest: SwapRequest
  timestamp: number
  error?: string
}

export interface SellResult{
  success: boolean
  txHash: string
  sellRequest: SellRequest
  amountOut: string
  timestamp: number
  error?: string
}

export interface BuyResult{
  success: boolean
  txHash: string
  buyRequest: BuyRequest
  amountOut: string
  timestamp: number
  error?: string
}

export interface DepositResult{
  success: boolean
  txHash: string
  depositRequest: DepositRequest
  timestamp: number
  error?: string
}

export interface WithdrawResult{
  success: boolean
  txHash: string
  withdrawRequest: WithdrawRequest
  timestamp: number
  error?: string
}