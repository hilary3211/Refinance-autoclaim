import { NextApiRequest, NextApiResponse } from "next";
import {
  ftGetTokenMetadata,
  fetchAllPools,
  estimateSwap,
  instantSwap,
  init_env,
} from "@ref-finance/ref-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  response: NextResponse
) {
     ("ok");

  const { signedAccountId, wallet, amountIn,  } = await request.json();

  // Initialize the environment
  init_env("testnet");
   

  if (!signedAccountId || !wallet) {
    return new Response(JSON.stringify({ message: "No signedAccountId or wallet" }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  }

  try {
     ("ok")
    // 1. Get Token Metadata
    const [tokenIn, tokenOut] = await Promise.all([
      ftGetTokenMetadata("wrap.testnet"),
      ftGetTokenMetadata("rft.tokenfactory.testnet"),
    ]);

    // 2. Fetch Pools
    const { simplePools } = await fetchAllPools();

    // 3. Estimate Swap - find best route
    const swapTodos = await estimateSwap({
      tokenIn,
      tokenOut,
      amountIn,
      simplePools,
      options: { enableSmartRouting: false }, 
    });

    // 4. Perform Swap - create transactions
    const transactions = await instantSwap({
      tokenIn,
      tokenOut,
      amountIn,
      swapTodos,
      slippageTolerance: 0.01,
      AccountId: signedAccountId, // Use connected account ID
    });

    // 5. Sign and execute transactions
    if (transactions && transactions.length > 0) {
      const resTransaction = await wallet.account().signAndSendTransaction({
        receiverId: transactions[0].receiverId,
        actions: transactions[0].functionCalls,
      });
       return new Response(JSON.stringify({ result: resTransaction }), {
         headers: {
           "Content-Type": "application/json",
           "Cache-Control": "no-cache",
         },
       });
    } else {
      return new Response(JSON.stringify({ message: "No swap route found." }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });
    }
    
  } catch (e: any) {
    console.error("Swap error:", e);
    return new Response(JSON.stringify({ message: e.message || "An error occurred during the swap." }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  }
}
