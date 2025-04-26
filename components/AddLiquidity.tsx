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

interface TokenData {
  tokenName: string;
  contractId: string;
  tokenSymbol: string;
  icon: string;
  price: number | null;
}

interface UserData {
  username: string;
}

export function AddLiquidity({
  poolType1,
  poolType2,
  poolTypeID1,
  poolTypeID2,
  Poolid,
}: {
  poolType1: string;
  poolType2: string;
  poolTypeID1: string;
  poolTypeID2: string;
  Poolid: string;
}) {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [fromBal, setFromBal] = useState<string>("");
  const [toBal, setToBal] = useState<string>("");
  const [amountA, setAmountA] = useState<string>("");
  const [amountB, setAmountB] = useState<string>("");
  const [lastChanged, setLastChanged] = useState<"A" | "B">("A");
  const [fromToken, setFromToken] = useState<TokenData | null>(null);
  const [toToken, setToToken] = useState<TokenData | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [subal1, setSubal1] = useState<string>("");
  const [subal2, setSubal2] = useState<string>("");

  function toHumanReadable(
    amount: string,
    tokenType: "token" | "near" = "token"
  ): string {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
    const amountStr = String(amount).padStart(power + 1, "0");
    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);
    const humanReadable = `${integerPart}.${fractionalPart}`;
    return parseFloat(humanReadable).toFixed(2);
  }

  async function fetchTokenDataByContract(
    poolType1: string,
    poolType2: string
  ): Promise<{
    poolToken1: TokenData | null;
    poolToken2: TokenData | null;
  }> {
    try {
      const [tokenResponse, priceResponse] = await Promise.all([
        fetch("https://api.ref.finance/list-token"),
        fetch("https://api.ref.finance/list-token-price"),
      ]);

      if (!tokenResponse.ok || !priceResponse.ok) {
        throw new Error("Failed to fetch token data");
      }

      const [tokenData, priceData] = await Promise.all([
        tokenResponse.json(),
        priceResponse.json(),
      ]);

      const tokensArray = Object.keys(tokenData).map((contractId) => ({
        tokenName: tokenData[contractId].name,
        contractId,
        tokenSymbol: tokenData[contractId].symbol,
        icon: tokenData[contractId].icon,
        price: priceData[contractId] ? priceData[contractId].price : null,
      }));

      setLoaded(true);

      const filteredTokens = tokensArray.filter((t) => t.contractId);
      const poolToken1 =
        filteredTokens.find((t) =>
          t.contractId.toLowerCase().includes(poolType1.toLowerCase().trim())
        ) || null;
      const poolToken2 =
        filteredTokens.find((t) =>
          t.contractId.toLowerCase().includes(poolType2.toLowerCase().trim())
        ) || null;

      return { poolToken1, poolToken2 };
    } catch (error) {
      console.error("Error fetching token data:", error);
      return { poolToken1: null, poolToken2: null };
    }
  }

  useEffect(() => {
    async function getTokenBalances() {
      try {
        const getUserData = await wallet.viewMethod<UserData>({
          contractId: "auto-claim-main2.near",
          method: "get_user",
          args: { wallet_id: signedAccountId },
          gas: "300000000000000",
          deposit: "0",
        });

        const [gettokenin, gettokenin2] = await Promise.all([
          wallet.viewMethod<string>({
            contractId: poolTypeID1,
            method: "ft_balance_of",
            args: { account_id: signedAccountId },
          }),
          wallet.viewMethod<string>({
            contractId: poolTypeID1,
            method: "ft_balance_of",
            args: { account_id: `${getUserData.subaccount_id}` },
          }),
        ]);

        if (poolType1 === "wNEAR") {
          const gettokenout = await wallet.getBalance(signedAccountId);
          setToBal(parseFloat(gettokenout).toFixed(2));
          setSubal1(toHumanReadable(gettokenin2, "near"));
        } else {
          setFromBal(toHumanReadable(gettokenin, "token"));
          setSubal1(toHumanReadable(gettokenin2, "token"));
        }

        const [gettokenout, gettokenout2] = await Promise.all([
          wallet.viewMethod<string>({
            contractId: poolTypeID2,
            method: "ft_balance_of",
            args: { account_id: signedAccountId },
          }),
          wallet.viewMethod<string>({
            contractId: poolTypeID2,
            method: "ft_balance_of",
            args: { account_id: `${getUserData.subaccount_id}` },
          }),
        ]);

        if (poolType2 === "wNEAR") {
          const gettokenout = await wallet.getBalance(signedAccountId);
          setToBal(parseFloat(gettokenout).toFixed(2));
          setSubal2(toHumanReadable(gettokenout2, "near"));
        } else {
          setToBal(toHumanReadable(gettokenout, "token"));
          setSubal2(toHumanReadable(gettokenout2, "token"));
        }
      } catch (error) {
        console.error("Error fetching token balances:", error);
      }
    }

    getTokenBalances();
    fetchTokenDataByContract(poolTypeID1, poolTypeID2).then((result) => {
      setFromToken(result.poolToken1);
      setToToken(result.poolToken2);
    });
  }, [
    loaded,
    poolType1,
    poolType2,
    poolTypeID1,
    poolTypeID2,
    signedAccountId,
    wallet,
  ]);

  const handleChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountA(value);
    setLastChanged("A");
    if (!value || isNaN(Number(value))) {
      setAmountB("");
      return;
    }

    if (fromToken?.price && toToken?.price) {
      const calculated = (Number(value) * fromToken.price) / toToken.price;
      setAmountB(calculated.toFixed(6));
    }
  };

  const handleChangeB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountB(value);
    setLastChanged("B");
    if (!value || isNaN(Number(value))) {
      setAmountA("");
      return;
    }

    if (fromToken?.price && toToken?.price) {
      const calculated = (Number(value) * toToken.price) / fromToken.price;
      setAmountA(calculated.toFixed(6));
    }
  };

  function toSmallestUnit(
    amount: string,
    tokenType: "token" | "near" = "token"
  ): string {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
    const amountStr = String(amount);
    const [integerPart, fractionalPart = ""] = amountStr.split(".");
    const paddedFractionalPart = fractionalPart.padEnd(power, "0");
    return BigInt(integerPart + paddedFractionalPart).toString();
  }

  async function Addliq(
    poolid: string,
    tokeninNear: string,
    tokenamount: string,
    tokenname: string
  ): Promise<void> {
    try {
      setLoading(true);
      const getUserData = await wallet.viewMethod<UserData>({
        contractId: "auto-claim-main2.near",
        method: "get_user",
        args: { wallet_id: signedAccountId },
        gas: "300000000000000",
        deposit: "0",
      });

      const transactions = [
        {
          receiverId: `v2.ref-finance.near`,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "storage_deposit",
                args: {
                  account_id: `${getUserData.subaccount_id}`,
                  registration_only: false,
                },
                gas: "300000000000000",
                deposit: "2500000000000000000000",
              },
            },
          ],
        },
        {
          receiverId: `${getUserData.subaccount_id}`,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "add_liq",
                args: {
                  tokenamount: tokenamount,
                  wrappednearamount: tokeninNear,
                  poolid: poolid,
                  tokenname: tokenname,
                  userid: `${getUserData.subaccount_id}`,
                  neargas: 35,
                  adddepo: "950000000000000000000",
                },
                gas: "300000000000000",
                deposit: tokeninNear,
              },
            },
          ],
        },
      ];

      await wallet.signAndSendTransactions({ transactions });
    } catch (error) {
      console.error("Error adding liquidity:", error);
    } finally {
      setLoading(false);
    }
  }

  function applySlippage(
    valueStr: string,
    slippagePercent: number = 0.5
  ): string {
    const scale = BigInt(1000);
    const multiplier = BigInt(1000 - Math.round(slippagePercent * 10));
    const valueBigInt = BigInt(valueStr);
    const reduced = (valueBigInt * multiplier) / scale;
    return reduced.toString();
  }

  const isSwapDisabled =
    !fromToken ||
    !toToken ||
    !amountA ||
    !amountB ||
    fromToken === toToken ||
    loading ||
    parseFloat(amountA) > parseFloat(subal1);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-white p-3">Add Liquidity</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Liquidity</DialogTitle>
          <DialogDescription>
            Add liquidity to the pool to start trading.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="first" className="text-left">
              {poolType1}
            </Label>
            <div className="rounded-md flex">
              <div className="flex-1 flex-col items-center justify-start">
                <p className="font-neuton">User Balance: ${fromBal}</p>
                <p className="font-neuton">Sub-account Balance: ${subal1}</p>
              </div>
              <Input
                id="first"
                type="number"
                value={amountA}
                onChange={handleChangeA}
                className="hover:border-2 hover:border-black-500 w-[full] p-2 outline-none border-black focus:ring-0 col-span-9"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2 mt-5">
            <Label htmlFor="second" className="text-left">
              {poolType2}
            </Label>
            <div className="rounded-md flex">
              <div className="flex-1 flex-col items-center justify-start">
                <p className="font-neuton">User Balance: ${toBal}</p>
                <p className="font-neuton">Sub-account Balance: ${subal2}</p>
              </div>
              <Input
                id="second"
                type="number"
                value={amountB}
                onChange={handleChangeB}
                className="hover:border-2 hover:border-black-500 w-[full] p-2 outline-none border-black focus:ring-0 col-span-9"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={async () => {
              if (poolType1 === "wNEAR") {
                const tokeninNear = toSmallestUnit(amountA, "near");
                const tokenamount = toSmallestUnit(amountB, "token");
                const tokeninNearAfterSlippage = applySlippage(
                  tokeninNear,
                  0.5
                );
                const tokenamountAfterSlippage = applySlippage(
                  tokenamount,
                  0.5
                );
                await Addliq(
                  Poolid,
                  tokeninNearAfterSlippage,
                  tokenamountAfterSlippage,
                  poolTypeID2
                );
              } else {
                const tokeninNear = toSmallestUnit(amountB, "near");
                const tokenamount = toSmallestUnit(amountA, "token");
                const tokeninNearAfterSlippage = applySlippage(
                  tokeninNear,
                  0.5
                );
                const tokenamountAfterSlippage = applySlippage(
                  tokenamount,
                  0.5
                );
                await Addliq(
                  Poolid,
                  tokeninNearAfterSlippage,
                  tokenamountAfterSlippage,
                  poolTypeID1
                );
              }
            }}
            disabled={isSwapDisabled}
            type="submit"
            className="w-full"
          >
            {loading
              ? "Adding..."
              : !fromToken || !toToken
              ? "Select tokens"
              : "Add Liquidity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
