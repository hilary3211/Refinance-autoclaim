// server file
import {
  ftGetTokenMetadata,
  fetchAllPools,
  estimateSwap,
  instantSwap,
  init_env,
} from "@ref-finance/ref-sdk";
import { Near } from "near-api-js"; // Correct import

export const SwapTool = async (signedAccountId: string, wallet: any) => {
  //   const [tokenInId, setTokenInId] = useState("ref.fakes.testnet"); // Example: REF
  //   const [tokenOutId, setTokenOutId] = useState("wrap.testnet"); // Example: wNEAR
  // //   const [amountIn, setAmountIn] = useState("1");
  //   const [swapResult, setSwapResult] = useState<any>(null);
  const amountIn = "1";
  //   const [error, setError] = useState<string | null>(null); // Get wallet from context
  //const [walletConnection, setWalletConnection] = useState<any>(null);  // near-api-js object

  init_env("testnet");

  if (!signedAccountId || !wallet) {
    console.log("Wallet not connected. Please connect your wallet.");
    return;
  }

  try {
    const [tokenIn, tokenOut] = await Promise.all([
      ftGetTokenMetadata("ref.fakes.testnet"),
      ftGetTokenMetadata("wrap.testnet"),
    ]);

    const { simplePools } = await fetchAllPools();

    const swapTodos = await estimateSwap({
      tokenIn,
      tokenOut,
      amountIn: "1", // Example amount
      simplePools,
      options: { enableSmartRouting: false },
    });

    const transactions = await instantSwap({
      tokenIn,
      tokenOut,
      amountIn: "1", // Example amount
      swapTodos,
      slippageTolerance: 0.01,
      AccountId: signedAccountId,
    });

    if (transactions && transactions.length > 0) {
      const res = await wallet.account().signAndSendTransaction({
        receiverId: transactions[0].receiverId,
        actions: transactions[0].functionCalls,
      });
      console.log("Result", res);
    } else {
      console.log("No swap route found.");
    }
  } catch (e: any) {
    console.error("Swap error:", e);
  }
};
