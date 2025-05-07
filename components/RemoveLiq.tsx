"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NearContext } from "../wallets/near";
import BigNumber from "bignumber.js";

interface UserData {
  username: string;
}

interface PoolInfo {
  shares_total_supply: string;
  amounts: string[];
}

export function RemoveLiq({
  poolType1,
  poolType2,
  poolTypeID1,
  poolTypeID2,
  sharez,
  Poolid,
}: {
  poolType1: string;
  poolType2: string;
  poolTypeID1: string;
  poolTypeID2: string;
  sharez: string;
  Poolid: string;
}) {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [amountA, setAmountA] = useState<string>("");
  const [amountB, setAmountB] = useState<string>("");
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [subal1, setSubal1] = useState<string>("");
  const [subal2, setSubal2] = useState<string>("");
  const [selected, setSelected] = useState<string>("");

  const getTokenAmounts = async () => {
    if (!amountA) return;

    try {
      const poolInfo = await wallet.viewMethod<PoolInfo>({
        contractId: "v2.ref-finance.near",
        method: "get_pool",
        args: {
          pool_id: parseInt(Poolid),
        },
      });

      const userShares = new BigNumber(amountA);
      const totalShares = new BigNumber(poolInfo.shares_total_supply);
      const token1PoolAmount = new BigNumber(poolInfo.amounts[0]);
      const token2PoolAmount = new BigNumber(poolInfo.amounts[1]);

      const ratio = userShares.dividedBy(totalShares);

      const userToken1Amount = token1PoolAmount.multipliedBy(ratio);
      const userToken2Amount = token2PoolAmount.multipliedBy(ratio);

      const formattedToken1 = userToken1Amount
        .multipliedBy(new BigNumber(0.97))
        .toFixed(0);
      const formattedToken2 = userToken2Amount
        .multipliedBy(new BigNumber(0.97))
        .toFixed(0);

      setSubal1(
        toHumanReadable(
          formattedToken1,
          poolType1 === "wNEAR" ? "near" : "token"
        )
      );
      setSubal2(
        toHumanReadable(
          formattedToken2,
          poolType2 === "wNEAR" ? "near" : "token"
        )
      );
    } catch (error) {
      console.error("Error fetching token amounts:", error);
    }
  };

  useEffect(() => {
    getTokenAmounts();
  }, [amountA]);

  const handleChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountA(e.target.value);
  };

  function toHumanReadable(
    amount: string,
    tokenType: "token" | "near" = "token"
  ): string {
    const power = tokenType === "near" ? 24 : 18;
    const amountStr = String(amount).padStart(power + 1, "0");
    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);
    const humanReadable = `${integerPart}.${fractionalPart}`;
    return parseFloat(humanReadable).toString();
  }

  function toSmallestUnits(amount: string, decimals: number = 18): string {
    const amountStr = String(amount);
    const [integerPart, fractionalPart = ""] = amountStr.split(".");
    const paddedFractionalPart = fractionalPart.padEnd(decimals, "0");
    return BigInt(integerPart + paddedFractionalPart).toString();
  }

  async function removeLiquidity(): Promise<void> {
    try {
      setLoading(true);
      const getUserData = await wallet.viewMethod<UserData>({
        contractId: "compoundx.near",
        method: "get_user",
        args: {
          wallet_id: signedAccountId,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const myshares = toSmallestUnits(amountA);
      const tokenamt = toSmallestUnits(subal1);
      const tokenamt2 = toSmallestUnits(subal2);

      const transactions = [
        {
          receiverId: `${getUserData.subaccount_id}`,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "remove_liquidity_and_withdraw_tokens",
                args:
                  poolType2 === "wNEAR"
                    ? {
                      seed_id: `v2.ref-finance.near@${Poolid}`,
                      withdraw_amount: amountA,
                        token_id: poolTypeID1,
                        owner_acc : signedAccountId,
                        pool_id : `:${Poolid}`
                      }
                    : {
                      seed_id: `v2.ref-finance.near@${Poolid}`,
                      withdraw_amount: amountA,
                        token_id: poolTypeID2,
                        owner_acc : signedAccountId,
                        pool_id : `:${Poolid}`
                      },
                gas: "300000000000000",
                deposit: "0",
              },
            },
          ],
        },
      ];

      await wallet.signAndSendTransactions({ transactions });
    } catch (error) {
      console.error("Error removing liquidity:", error);
    } finally {
      setLoading(false);
    }
  }

  const isSwapDisabled =
    !amountA ||
    loading ||
    parseFloat(amountA) > parseFloat(sharez) ||
    parseFloat(amountA) === 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          style={{ backgroundColor: "black" }}
          className="w-full text-white p-3"
        >
          Remove Liquidity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remove Liquidity</DialogTitle>
          <DialogDescription>
            Enter the Lp shares amount you would like to remove
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1 py-4">
          <div className="flex flex-col space-y-2">
            <div className="flex flex-row justify-between">
              <Label htmlFor="first" className="text-left">
                Lp tokens : {sharez}
              </Label>
              <button
                className="px-1 text-xs border rounded bg-gray-100"
                onClick={() => setAmountA(sharez)}
              >
                Max
              </button>
            </div>
            <div className="rounded-md flex">
              <div className="flex-1 flex-col items-center justify-start">
                <p className="font-neuton">
                  {poolType1} / {poolType2}
                </p>
              </div>
              <Input
                id="first"
                type="number"
                value={amountA}
                onChange={handleChangeA}
                className="hover:border-2 hover:border-black-500 w-full p-2 outline-none border-black focus:ring-0 col-span-9"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={removeLiquidity}
            disabled={isSwapDisabled}
            type="submit"
            className="w-full"
          >
            {loading
              ? "Removing..."
              : !fromToken
              ? "Enter share"
              : "Remove Liquidity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
