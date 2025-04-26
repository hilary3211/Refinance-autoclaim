"use client";
import {
  DCLSwap,
  ftGetTokenMetadata,
  getDCLPoolId,
} from "@ref-finance/ref-sdk";

import { useWallet } from "./zustandStore";

const SwapPage = () => {
  const { signedAccountId, wallet } = useWallet();

  const handleSwap = async () => {
    try {
      const tokenA = "ref.fakes.testnet";
      const tokenB = "wrap.testnet";
      const amountIn = "1";
      const fee = 2000;
      const pool_ids = [getDCLPoolId(tokenA, tokenB, fee)];
      const tokenAMeta = await ftGetTokenMetadata(tokenA);
      const tokenBMeta = await ftGetTokenMetadata(tokenA);

      const res = await DCLSwap({
        AccountId: signedAccountId,
        swapInfo: {
          amountA: "1",
          tokenA: tokenAMeta,
          tokenB: tokenBMeta,
        },
        Swap: {
          min_output_amount: "0",
          pool_ids,
        },
      });

      console.log(res);
    } catch (e: any) {
      console.error("Swap error:", e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-5 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-white mb-4">
        CompoundX Testnet Swap
      </h1>

      <div className="mb-4">
        <label className="block text-white">Token In:</label>
      </div>
      <div className="mb-4">
        <label className="block text-white">Token Out:</label>
      </div>
      <div className="mb-4">
        <label className="block text-white">Amount In:</label>
      </div>

      <button
        onClick={handleSwap}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
      >
        Swap
      </button>
    </div>
  );
};

export default SwapPage;
