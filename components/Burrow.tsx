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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NearContext } from "../wallets/near";
import { usePathname, useSearchParams } from "next/navigation";
interface BurrowProps {
  tokenId: string;
  tokenName: string;
  Data: any;
}

export function Burrow({ tokenId, tokenName, Data }: BurrowProps) {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [fromBal, setfromBal] = useState("");
  const [dec, setdec] = useState("");
  const [amountA, setAmountA] = useState("");
  const [fromToken, setFromToken] = useState<string | null>(null);
  const [subal1, setsubal] = useState<boolean>(false);
  const [subal12, setsuba2] = useState<boolean>(false);
  const [subal3, setsuba3] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [userbalance, setuserbalance] = useState<any>("");
  const [selected, setSelected] = useState("");

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

  function toHumanReadable2(amount: string, tokenType = "token", dec = 8) {
    let humanReadable: string;

    if (amount.includes(".")) {
      const [integerPart, fractionalPart = ""] = amount.split(".");
      const paddedFractional = fractionalPart.padEnd(dec, "0").slice(0, dec);
      humanReadable = `${integerPart}.${paddedFractional}`;
    } else {
      const paddedAmount = amount.padStart(dec + 1, "0");
      const integerPart = paddedAmount.slice(0, -dec) || "0";
      const fractionalPart = paddedAmount.slice(-dec);
      humanReadable = `${integerPart}.${fractionalPart}`;
    }

    return parseFloat(humanReadable);
  }
  const handleChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountA(value);
  };

  function toSmallestUnit(amount: string, tokenType = "token") {
    const power = dec;
    const amountStr = String(amount);
    const [integerPart, fractionalPart = ""] = amountStr.split(".");
    const paddedFractionalPart = fractionalPart.padEnd(parseInt(power), "0");
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
        args: { account_id: signedAccountId },
      });

      const getbal4 = await wallet.viewMethod({
        contractId: tokenId,
        method: "ft_metadata",
        args: {},
      });

      const getbal1 = await wallet.viewMethod({
        contractId: `contract.main.burrow.near`,
        method: "storage_balance_of",
        args: {
          account_id: `${getUserData.subaccount_id}`,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const getbal2 = await wallet.viewMethod({
        contractId: tokenId,
        method: "storage_balance_of",
        args: {
          account_id: `${getUserData.subaccount_id}`,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const getbal3 = await wallet.viewMethod({
        contractId: "wrap.near",
        method: "storage_balance_of",
        args: {
          account_id: `${getUserData.subaccount_id}`,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      setsubal(!getbal1 || getbal1.total === "0");
      setsuba2(!getbal2 || getbal2.total === "0");
      setsuba3(!getbal3 || getbal3.total === "0");

      if (getbal4.decimals === 8) {
        setuserbalance(toHumanReadable2(`${getbal}`, "token", 8));
      } else {
        setuserbalance(toHumanReadable(`${getbal}`, "token"));
      }

      setdec(getbal4.decimals);
    };

    getsubbalance();
  }, []);

  const depositinburrow = async () => {
  
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: { wallet_id: signedAccountId },
      gas: "300000000000000",
      deposit: "0",
    });
    setsubal(!subal1);
    const preference = {
      smart_contract_name: `${getUserData.subaccount_id}`,
      is_active: true,
      invested_in: {
        Burrow: {
          seed_id: `v2.ref-finance.near@79`,
          token_id: tokenId,
        },
      },
      reinvest_to: {
        Burrow: {
          seed_id: `v2.ref-finance.near@79`,
          token_id: tokenId,
        },
      },
    };

    const transactions: any = [
      subal1 && {
        receiverId: "contract.main.burrow.near",
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: `${getUserData.subaccount_id}`,
                registration_only: true,
              },
              gas: "300000000000000",
              deposit: "100000000000000000000000",
            },
          },
        ],
      },
      subal12 && {
        receiverId: tokenId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: `${getUserData.subaccount_id}`,
                registration_only: true,
              },
              gas: "300000000000000",
              deposit: "100000000000000000000000",
            },
          },
        ],
      },
      subal3 && {
        receiverId: "wrap.near",
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: `${getUserData.subaccount_id}`,
                registration_only: true,
              },
              gas: "300000000000000",
              deposit: "100000000000000000000000",
            },
          },
        ],
      },

      {
        receiverId: tokenId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer",
              args: {
                receiver_id: `${getUserData.subaccount_id}`,
                amount:
                  tokenId === "wrap.near"
                    ? toSmallestUnit(amountA, "near")
                    : toSmallestUnit(amountA),
              },
              gas: "85000000000000",
              deposit: "1",
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
              methodName: "deposit_into_burrow_pool",
              args: {
                token_id: tokenId,
                deposit_amount:
                  tokenId === "wrap.near"
                    ? toSmallestUnit(amountA, "near")
                    : toSmallestUnit(amountA),
              },
              gas: "100000000000000",
              deposit: "1",
            },
          },
        ],
      },
      {
        receiverId: "compoundx.near",
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "update_preference",
              args: { preference: preference },
              gas: "300000000000000",
              deposit: "0",
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
    parseFloat(amountA) === 0 ||
    selected === "";

  return (
    <Dialog
      open={subal1}
      onOpenChange={() => {
        setsubal(!subal1);
      }}
    >
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
                        <SelectItem value={tokenId}>
                          Deposit in Near Pool & Compound
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={depositinburrow}
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
