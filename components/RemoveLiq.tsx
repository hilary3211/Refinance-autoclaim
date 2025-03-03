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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NearContext } from "../wallets/near";
import BigNumber from "bignumber.js";

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
  sharez: any;
  Poolid: string;
}) {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [fromBal, setfromBal] = useState("");
  const [toBal, settoBal] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [lastChanged, setLastChanged] = useState("A");
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [loaded, setloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subal1, setsubal] = useState<any>("");
  const [subal2, setsubal2] = useState<any>("");
  const [stakepage, setstakepage] = useState(true);
  const [selected, setSelected] = useState("");

  const gettoken = async () => {
    const myshares = amountA;
    const products = await wallet.viewMethod({
      contractId: "v2.ref-finance.near",
      method: "get_pool",
      args: {
        pool_id: parseInt(Poolid),
      },
    });

    const userShares = new BigNumber(myshares);
    const totalShares = new BigNumber(products.shares_total_supply);

    const token1PoolAmount = new BigNumber(products.amounts[0]); // token.v2.ref-finance.near amount
    const token2PoolAmount = new BigNumber(products.amounts[1]); // wrap.near amount

    const ratio = userShares.dividedBy(totalShares);

    const userToken1Amount = token1PoolAmount.multipliedBy(ratio);
    const userToken2Amount = token2PoolAmount.multipliedBy(ratio);

    const formattedToken1 = userToken1Amount
      .multipliedBy(new BigNumber(0.97))
      .toFixed(0);
    const formattedToken2 = userToken2Amount
      .multipliedBy(new BigNumber(0.97))
      .toFixed(0);

    if (poolType1 === "wNEAR") {
      setsubal(toHumanReadable(formattedToken1, "near"));
    } else {
      setsubal(toHumanReadable(formattedToken1, "token"));
    }

    if (poolType2 === "wNEAR") {
      setsubal2(toHumanReadable(formattedToken2, "near"));
    } else {
      setsubal2(toHumanReadable(formattedToken2, "token"));
    }
  };

  useEffect(() => {
    gettoken();
  }, [amountA]);

  const handleChangeA = (e: any) => {
    const value = e.target.value;
    setAmountA(value);
  };

  function toHumanReadable(amount: any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;

    const amountStr = String(amount).padStart(power + 1, "0");

    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);

    const humanReadable = `${integerPart}.${fractionalPart}`;

    const formattedAmount = parseFloat(humanReadable);

    return formattedAmount;
  }

  function toSmallestUnits(amount: any, decimals = 18) {
    const amountStr = String(amount);

    const [integerPart, fractionalPart = ""] = amountStr.split(".");

    const paddedFractionalPart = fractionalPart.padEnd(decimals, "0");

    const smallestUnits = BigInt(integerPart + paddedFractionalPart);

    return smallestUnits.toString();
  }

  async function Remove() {
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    if (poolType2 === "wNEAR") {
      const myshares = toSmallestUnits(amountA);
      const tokenamt = toSmallestUnits(subal1);
      const tokenamt2 = toSmallestUnits(subal2);
      const transactions = [
        {
          receiverId: `${getuserdata.username}.auto-claim-main.near`,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "remove_liquidity_and_withdraw_tokens",
                args: {
                  pool_id: parseInt(Poolid),
                  shares: myshares,
                  tokenamount: tokenamt,
                  wrappednearamount: tokenamt2,
                  tokenname: poolTypeID1,
                  tokenname2: poolTypeID2,
                  gassing: "50",
                },
                gas: "300000000000000",
                deposit: "0",
              },
            },
          ],
        },
      ];

      const products2 = await wallet.signAndSendTransactions({
        transactions,
      });
    } else if (poolType1 === "wNEAR") {
      const myshares = toSmallestUnits(amountA);
      const tokenamt = toSmallestUnits(subal1);
      const tokenamt2 = toSmallestUnits(subal2);
      const transactions = [
        {
          receiverId: `${getuserdata.username}.auto-claim-main.near`,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "remove_liquidity_and_withdraw_tokens", // Missing methodName
                args: {
                  pool_id: parseInt(Poolid),
                  shares: myshares,
                  tokenamount: tokenamt2,
                  wrappednearamount: tokenamt,
                  tokenname: poolTypeID2,
                  tokenname2: poolTypeID1,
                  gassing: "50",
                },
                gas: "300000000000000", // Gas for transaction execution
                deposit: "0",
              },
            },
          ],
        },
      ];

      const products2 = await wallet.signAndSendTransactions({
        transactions,
      });
    }
  }

  async function unStake() {
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    const transactions = [
      {
        receiverId: `${getuserdata.username}.auto-claim-main.near`,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "unstake_lp",
              args: {
                seed_id: `v2.ref-finance.near@${Poolid}`,
                withdraw_amount: amountB,
                gassing: "50",
                tokenname: poolType1,
              },
              gas: "300000000000000",
              deposit: "0",
            },
          },
        ],
      },
    ];

    const products2 = await wallet.signAndSendTransactions({
      transactions,
    });
  }

  const isSwapDisabled =
    !amountA ||
    loading ||
    parseInt(amountA) > parseInt(sharez) ||
    parseInt(amountA) === 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-white p-3">Remove Liquidity</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <>
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
                  style={{
                    padding: "2px 4px",
                    fontSize: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "3px",
                    backgroundColor: "#f0f0f0",
                  }}
                  onClick={() => {
                    setAmountA(sharez);
                  }}
                >
                  Max
                </button>
              </div>
              <div className=" rounded-md flex ">
                <div className="flex-1 flex-col items-center justify-start">
                  <p className="font-neuton">
                    {poolType1} / {poolType2}
                  </p>
                  {/* <p className="font-neuton">
                    {" "}
                    {poolType2} : ${subal2}
                  </p> */}
                </div>
                <Input
                  id="first"
                  type="number"
                  value={amountA}
                  onChange={handleChangeA}
                  className="hover:border-2 hover:border-black-500 w-[full] p-2 outline-none border-black focus:ring-0     col-span-9"
                />
              </div>
            </div>
          </div>
          <div></div>
          <DialogFooter>
            <Button
              onClick={() => {
                Remove();
              }}
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
        </>
      </DialogContent>
    </Dialog>
  );
}
