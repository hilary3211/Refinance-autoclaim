"use client";

import { useState, useEffect, useContext } from "react";
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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NearContext } from "../wallets/near";

interface BurrowProps {
  tokenId: string;
  tokenName: string;
  Data: any;
}

export function Withdrawburrow({ tokenId, tokenName, Data }: BurrowProps) {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [fromBal, setfromBal] = useState("");
  const [toBal, settoBal] = useState("");
  const [amountA, setAmountA] = useState("");
  const [fromToken, setFromToken] = useState<string | null>(null);
  const [subal1, setsubal] = useState<boolean>(false);
  const [subal12, setsuba2] = useState<boolean>(false);
  const [subal3, setsuba3] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [userbalance, setuserbalance] = useState("");
  const [selected, setSelected] = useState("");

  function toHumanReadable(amount: string, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
    const amountStr = String(amount).padStart(power + 1, "0");
    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);
    const humanReadable = `${integerPart}.${fractionalPart}`;
    const formattedAmount = parseFloat(humanReadable).toFixed(2);
    return formattedAmount;
  }

  const handleChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountA(value);
  };

  function toSmallestUnit(amount: string, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
    const amountStr = String(amount);
    const [integerPart, fractionalPart = ""] = amountStr.split(".");
    const paddedFractionalPart = fractionalPart.padEnd(power, "0");
    const smallestUnit = BigInt(integerPart + paddedFractionalPart);
    return smallestUnit.toString();
  }

  useEffect(() => {
    const getsubbalance = async () => {
      const getUserData = await wallet.viewMethod({
        contractId: "compoundx.near",
        method: "get_user",
        args: { wallet_id: signedAccountId },
        gas: "300000000000000",
        deposit: "0",
      });

      const getbal = await wallet.viewMethod({
        contractId: tokenId,
        method: "ft_balance_of",
        args: { account_id: `${getUserData.subaccount_id}` },
      });

      setuserbalance(toHumanReadable(getbal, "token"));
    };

    getsubbalance();
  }, []);

  const Withdrawburrow = async () => {
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: { wallet_id: signedAccountId },
      gas: "300000000000000",
      deposit: "0",
    });

    const transactions: any = [
      {
        receiverId: `${getUserData.subaccount_id}`,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "withdraw_from_borrow_pool",
              args: {
                token_id: tokenId,
                receiver_id: signedAccountId,
                withdraw_amount:
                  tokenId === "wrap.near"
                    ? toSmallestUnit(amountA, "near")
                    : toSmallestUnit(amountA),
              },
              gas: "300000000000000",
              deposit: "1",
            },
          },
        ],
      },
    ].filter(Boolean);

    const transfer = await wallet.signAndSendTransactions({ transactions });
  };

  const isSwapDisabled =
    !amountA ||
    loading ||
    parseFloat(amountA) > parseFloat(userbalance) ||
    parseFloat(amountA) === 0;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-white p-3">Withdraw</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <>
          <DialogHeader>
            <DialogTitle>Withdraw from Burrow pool</DialogTitle>
            <DialogDescription>
              Withdrawing from Burrow will claim all pool earn rewards
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="first" className="text-left">
                {tokenName}
              </Label>
              <div className="rounded-md flex">
                <div className="flex-1 flex-col items-center justify-start"></div>
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
              onClick={Withdrawburrow}
              disabled={isSwapDisabled}
              type="submit"
              className="w-full"
            >
              {loading
                ? "Withdrawing..."
                : !fromToken
                ? "Enter amount"
                : "Withdraw"}
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  );
}
