import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateMiddle(value: string, chars = 6) {
  if (value.length <= chars * 2 + 3) {
    return value;
  }
  return `${value.slice(0, chars)}...${value.slice(-chars)}`;
}

export function isHexBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
