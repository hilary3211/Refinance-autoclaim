"use client";

import { useEffect, useState } from "react";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import "@/app/globals.css";
import { NearContext } from "../wallets/near";
// import { Navigation } from '@/components/navigation';
import { NetworkId, HelloNearContract } from "@/config";

import { Wallet } from "@/wallets/near";
// import { useWalletSelector } from './WalletSelectorContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Create Next App",
//   description: "Generated by create next app",
// };
const wallet = new Wallet({
  networkId: NetworkId,
  createAccessKeyFor: HelloNearContract,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [signedAccountId, setSignedAccountId] = useState("");

  useEffect(() => {
    wallet.startUp(setSignedAccountId);
  }, []);

  return (
    <html lang="en">
      <NearContext.Provider value={{ wallet, signedAccountId }}>
        <body className="bg-[#030f16]">{children}</body>
      </NearContext.Provider>
    </html>
  );
}
