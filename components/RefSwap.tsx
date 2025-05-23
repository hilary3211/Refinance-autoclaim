"use client";
import { useState, useEffect } from "react";
import { useWallet } from "./zustandStore";

const RefSwap = () => {
  const [tokenInId, setTokenInId] = useState("ref.fakes.testnet");
  const [tokenOutId, setTokenOutId] = useState("wrap.testnet");
  const [amountIn, setAmountIn] = useState("1");
  const [swapResult, setSwapResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { signedAccountId, wallet } = useWallet();

  const handleSwap = async () => {
    setError(null);
    if (!signedAccountId || !wallet) {
      setError("Wallet not connected. Please connect your wallet.");
      return;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-5 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-white mb-4">CompoundX Swap</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-4">
        <label className="block text-white">Token In:</label>
        <input
          type="text"
          value={tokenInId}
          onChange={(e) => setTokenInId(e.target.value)}
          className="w-full p-2 rounded-md"
        />
      </div>
      <div className="mb-4">
        <label className="block text-white">Token Out:</label>
        <input
          type="text"
          value={tokenOutId}
          onChange={(e) => setTokenOutId(e.target.value)}
          className="w-full p-2 rounded-md"
        />
      </div>
      <div className="mb-4">
        <label className="block text-white">Amount In:</label>
        <input
          type="text"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          className="w-full p-2 rounded-md"
        />
      </div>

      <button
        onClick={handleSwap}
        disabled={!signedAccountId}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
      >
        Swap
      </button>

      {swapResult && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-white">Swap Result:</h2>
          <pre className="bg-gray-700 text-white p-2 rounded-md">
            {JSON.stringify(swapResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default RefSwap;
