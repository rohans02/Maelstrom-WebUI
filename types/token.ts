import { Address } from "viem"
import { type Chain } from "viem"

export interface Token{
  address: Address
  symbol: string
  name: string
  decimals: number
}

export interface LiquidityPoolToken extends Token{
  totalSupply: string
  balance: string
}

export const ETH: Token = {
  address: "0x0000000000000000000000000000000000000000",
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
}

// Helper function to get native currency token based on chain
export function getNativeCurrencyToken(chain?: Chain): Token {
  if (!chain) {
    return ETH;
  }
  
  return {
    address: "0x0000000000000000000000000000000000000000",
    symbol: chain.nativeCurrency.symbol,
    name: chain.nativeCurrency.name,
    decimals: chain.nativeCurrency.decimals,
  };
}