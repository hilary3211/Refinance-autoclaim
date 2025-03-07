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

export function Burrow({
  tokenId,
  tokenName,
  Data,
}: {
  tokenId: string;
  tokenName: string;
  Data: any;
}) {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [fromBal, setfromBal] = useState("");
  const [toBal, settoBal] = useState("");
  const [amountA, setAmountA] = useState("");
  const [fromToken, setFromToken] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [userbalance, setuserbalance] = useState("");

  const [selected, setSelected] = useState("");

  function toHumanReadable(amount: any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;

    const amountStr = String(amount).padStart(power + 1, "0");

    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);

    const humanReadable = `${integerPart}.${fractionalPart}`;

    const formattedAmount = parseFloat(humanReadable).toFixed(2);

    return formattedAmount;
  }

  const handleChangeA = (e: any) => {
    const value = e.target.value;
    setAmountA(value);
  };

  function toSmallestUnit(amount: any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;

    const amountStr = String(amount);

    const [integerPart, fractionalPart = ""] = amountStr.split(".");

    const paddedFractionalPart = fractionalPart.padEnd(power, "0");

    const smallestUnit = BigInt(integerPart + paddedFractionalPart);

    return smallestUnit.toString();
  }

  useEffect(() => {
    const getsubbalance = async () => {
      const getuserdata = await wallet.viewMethod({
        contractId: "auto-claim-main2.near",
        method: "get_user",
        args: {
          wallet_id: signedAccountId,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const getbal = await wallet.viewMethod({
        contractId: tokenId,
        method: "ft_balance_of",
        args: { account_id: `${getuserdata.username}.auto-claim-main2.near` },
      });

      setuserbalance(toHumanReadable(getbal, "token"));
    };

    getsubbalance();
  }, []);

  const depositinburrow = async () => {
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main2.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    const preferences = [
      {
        seed_id: `nill`,
        token_id: tokenId,
        smart_contract_name: `${getuserdata.username}.auto-claim-main2.near`,
        is_active: "true",
        reinvest_to: selected,
      },
    ];

    const transactions = [
      {
        receiverId: `${getuserdata.username}.auto-claim-main2.near`,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "deposit_into_burrow_pool",
              args: {
                tokenid: tokenId,
                deposit_amount:
                  tokenId === "wrap.near"
                    ? toSmallestUnit(amountA, "near")
                    : toSmallestUnit(amountA),
                neargas: 50,
              },
              gas: "85000000000000", // 85 Tgas
              deposit: "0", // Minimal deposit
            },
          },
        ],
      },
      {
        receiverId: "auto-claim-main2.near",
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "update_preferences",
              args: {
                prefs: preferences,
              },
              gas: "300000000000000",
              deposit: "0",
            },
          },
        ],
      },
    ];
    const transfer = await wallet.signAndSendTransactions({
      transactions,
    });
  };

  const isSwapDisabled =
    !amountA ||
    loading ||
    parseFloat(amountA) > parseFloat(userbalance) ||
    parseFloat(amountA) === 0 ||
    selected === "";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-white p-3">Deposit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <>
          <DialogHeader>
            <DialogTitle>Deposit into Burrow pool</DialogTitle>
            <DialogDescription>
              Deposit to burrow pool to earn rewards
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="first" className="text-left">
                {tokenName}
              </Label>
              <div className=" rounded-md flex ">
                <div className="flex-1 flex-col items-center justify-start">
                  <p className="font-neuton">Balance: ${userbalance}</p>
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
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-4 my-5 items-center w-full max-w-2xl mx-auto">
                <div className="text-black flex-1">
                  <Select
                    onValueChange={(value) => setSelected(value)}
                    value={selected}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Where would you like to reinvest your claim" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Stake">Stake xRef</SelectItem>
                        <SelectItem value={tokenId}>
                          Deposit in {tokenName} Pool & Compound
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <div></div>
          <DialogFooter>
            <Button
              onClick={() => {
                depositinburrow();
              }}
              disabled={isSwapDisabled}
              type="submit"
              className="w-full"
            >
              {loading
                ? "Depositing..."
                : !fromToken
                ? "Enter Deposit"
                : "Deposit"}
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  );
}
