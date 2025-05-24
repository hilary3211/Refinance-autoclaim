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
import { usePathname, useSearchParams } from "next/navigation";
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
  const [amountA, setAmountA] = useState("");
  const [fromToken, setFromToken] = useState<string | null>(null);
  const [subal1, setsubal] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [userbalance, setuserbalance] = useState<any>("");
  const [dec, setdec] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resetAllModals = () => {
    setsubal(false);
  };

  useEffect(() => {
    resetAllModals();
  }, [pathname, searchParams]);

  function toHumanReadable(amount: string, tokenType = "token") {
    const power = dec;
    const amountStr = String(amount).padStart(parseInt(power) + 1, "0");
    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);
    const humanReadable = `${integerPart}.${fractionalPart}`;
    const formattedAmount = parseFloat(humanReadable);
    return formattedAmount;
  }

  function toHumanReadable2(
    amount: string,
    tokenType = "token",
    dec = 8
  ): number {
    try {
      if (typeof amount !== "string") {
        throw new Error(`Amount must be a string, got ${typeof amount}`);
      }
      if (typeof dec !== "number" || dec < 0) {
        throw new Error(`dec must be a positive number, got ${dec}`);
      }

      if (amount.trim() === "") {
        return 0;
      }

      const paddedAmount = amount.padStart(dec + 1, "0");
      const integerPart = paddedAmount.slice(0, -dec) || "0";
      const fractionalPart = paddedAmount.slice(-dec);
      const humanReadable = `${integerPart}.${fractionalPart}`;

      const result = parseFloat(humanReadable);
      if (isNaN(result)) {
        throw new Error(`Failed to parse ${humanReadable} to number`);
      }

      return result;
    } catch (error) {
      return 0;
    }
  }

  function getCollateralBalance(data: any, tokenId: string) {
    const collateral = data.collateral.find(
      (item: any) => item.token_id === tokenId
    );
    return collateral ? collateral.balance : 0;
  }

  const handleChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountA(value);
  };

  function toSmallestUnit(amount: string, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : parseInt(dec);

    const amountWithSlippage = parseFloat(amount).toString();
    const amountStr = amountWithSlippage;

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
        contractId: "contract.main.burrow.near",
        method: "get_account",
        args: { account_id: `${getUserData.subaccount_id}` },
      });

      const getbal4 = await wallet.viewMethod({
        contractId: tokenId,
        method: "ft_metadata",
        args: {},
      });

      const getbals = getCollateralBalance(getbal, tokenId);

      if (getbal4.decimals === 8) {
        setuserbalance(toHumanReadable2(`${getbals}`, "token", 8));
      } else {
        setuserbalance(toHumanReadable(`${getbals}`, "token"));
      }
      setdec(getbal4.decimals);
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
    <Dialog
      open={subal1}
      onOpenChange={() => {
        setsubal(!subal1);
      }}
    >
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
              <div className="flex flex-row justify-between">
                <Label htmlFor="first" className="text-left">
                  {tokenName}
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
                    setAmountA(userbalance);
                  }}
                >
                  Max
                </button>
              </div>
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
