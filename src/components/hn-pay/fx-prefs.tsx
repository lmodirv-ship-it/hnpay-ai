import { createContext, useContext } from "react";

export type Lang = "ar" | "fr" | "en";
export type Currency = "MAD" | "EUR" | "USD" | "GBP";

/** Indicative display rates from EUR (prices are shown, not charged, in the selected currency). */
export const RATES: Record<Currency, number> = { EUR: 1, MAD: 10.8, USD: 1.08, GBP: 0.85 };
export const SYMBOL: Record<Currency, string> = { EUR: "€", USD: "$", GBP: "£", MAD: "MAD" };

export function convertFromEur(eur: number, c: Currency) {
  const v = eur * RATES[c];
  return c === "MAD" ? Math.round(v) : Math.round(v * 100) / 100;
}

export function formatPrice(eur: number, c: Currency) {
  const v = convertFromEur(eur, c);
  const n = c === "MAD" ? v.toLocaleString("en-US") : v.toFixed(2);
  return c === "MAD" ? `${n} MAD` : `${SYMBOL[c]}${n}`;
}

type Prefs = { lang: Lang; currency: Currency; setLang: (l: Lang) => void; setCurrency: (c: Currency) => void };
export const FxPrefsContext = createContext<Prefs>({ lang: "ar", currency: "MAD", setLang: () => {}, setCurrency: () => {} });
export const useFxPrefs = () => useContext(FxPrefsContext);
