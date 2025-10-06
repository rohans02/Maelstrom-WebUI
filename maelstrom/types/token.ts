import { Address } from "viem"

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