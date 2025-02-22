"use client";
import { DCLSwap, ftGetTokenMetadata, getDCLPoolId } from "@ref-finance/ref-sdk";
// pages/swap.tsx (or a component file)
// import { useState } from "react";
import { useWallet } from "./zustandStore";

const SwapPage = () => {
  //   const [tokenInId, setTokenInId] = useState("ref.fakes.testnet"); // Example: REF
  //   const [tokenOutId, setTokenOutId] = useState("wrap.testnet"); // Example: wNEAR
  //   const [amountIn, setAmountIn] = useState("1");
  //   const [swapResult, setSwapResult] = useState<any>(null);
  //   const [error, setError] = useState<string | null>(null);
  const { signedAccountId, wallet } = useWallet();

  const handleSwap = async () => {
    // setError(null); // Clear any previous errors

    // if (!signedAccountId || !wallet) {
    //   setError("Wallet not connected. Please connect your wallet.");
    //   console.log("error")
    //   return;
    // }

    try {
     const tokenA = "ref.fakes.testnet"
     const tokenB = "wrap.testnet"
     const amountIn = "1"
     const fee = 2000
     const pool_ids = [getDCLPoolId(tokenA, tokenB, fee)]
     const tokenAMeta = await ftGetTokenMetadata(tokenA)
     const tokenBMeta = await ftGetTokenMetadata(tokenA);

     const res = await DCLSwap({
      AccountId: signedAccountId,
      swapInfo:{
        amountA: "1",
        tokenA: tokenAMeta,
        tokenB: tokenBMeta,
      },
      Swap: {
        min_output_amount: "0",
        pool_ids
      }
     })

     console.log(res)
    } catch (e: any) {
      console.error("Swap error:", e);
      //   setError(e.message || "An error occurred during the swap.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-5 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-white mb-4">
        Ref Finance Testnet Swap
      </h1>
      {/* {error && <div className="text-red-500 mb-4">{error}</div>} */}

      <div className="mb-4">
        <label className="block text-white">Token In:</label>
        {/* <input
          type="text"
          value={tokenInId}
          onChange={(e) => setTokenInId(e.target.value)}
          className="w-full p-2 rounded-md"
        /> */}
      </div>
      <div className="mb-4">
        <label className="block text-white">Token Out:</label>
        {/* <input
          type="text"
          value={tokenOutId}
          onChange={(e) => setTokenOutId(e.target.value)}
          className="w-full p-2 rounded-md"
        /> */}
      </div>
      <div className="mb-4">
        <label className="block text-white">Amount In:</label>
        {/* <input
          type="text"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          className="w-full p-2 rounded-md"
        /> */}
      </div>

      <button
        onClick={handleSwap}
        // disabled={!signedAccountId}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
      >
        Swap
      </button>

      {/* {swapResult && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-white">Swap Result:</h2>
          <pre className="bg-gray-700 text-white p-2 rounded-md">
            {JSON.stringify(swapResult, null, 2)}
          </pre>
        </div>
      )} */}
    </div>
  );
};

export default SwapPage;
