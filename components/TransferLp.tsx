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

export function TransferLp({
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
  const [fromBal, setfromBal] = useState("");
  const [toBal, settoBal] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [lastChanged, setLastChanged] = useState("A");
  const [fromToken, setFromToken] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [isreg, setisreg] = useState(null);

  const [share1, setshare1] = useState<any>(null);

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

  let count = 0;
  async function checkshares() {
    count++;
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    const myshares = await wallet.viewMethod({
      contractId: "v2.ref-finance.near",
      method: "get_pool_shares",
      args: {
        pool_id: parseInt(Poolid), // Pool ID
        account_id: signedAccountId,
      },
    });

    const mysharesInt = parseInt(myshares) || 0;

    setshare1(myshares);
  }

  if (count < 2) {
    checkshares().catch((err) => {});
  }

  async function Tranfertoken() {
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    const status = await wallet.viewMethod({
      contractId: "v2.ref-finance.near",
      method: "mft_has_registered",
      args: {
        token_id: `:${Poolid}`, // Pool ID
        account_id: `${getuserdata.username}.auto-claim-main.near`,
      },
    });

    // console.log(status)

    // setisreg(status)

    if (status) {
      const transactions = [
        {
          receiverId: "v2.ref-finance.near",
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "mft_transfer",
                args: {
                  receiver_id: `${getuserdata.username}.auto-claim-main.near`,
                  token_id: `:${Poolid}`,
                  amount: amountA,
                  memo: null,
                },
                gas: "85000000000000",
                deposit: "1",
              },
            },
          ],
        },
      ];

      const transfer = await wallet.signAndSendTransactions({
        transactions,
      });
    } else {
      const transactions = [
        {
          receiverId: "v2.ref-finance.near",
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "mft_register",
                args: {
                  token_id: `:${Poolid}`,
                  account_id: `${getuserdata.username}.auto-claim-main.near`,
                },
                gas: "85000000000000",
                deposit: "20000000000000000000000",
              },
            },
            {
              type: "FunctionCall",
              params: {
                methodName: "mft_transfer",
                args: {
                  receiver_id: `${getuserdata.username}.auto-claim-main.near`,
                  token_id: `:${Poolid}`,
                  amount: amountA,
                  memo: null,
                },
                gas: "85000000000000",
                deposit: "1",
              },
            },
          ],
        },
      ];

      const transfer = await wallet.signAndSendTransactions({
        transactions,
      });
    }
  }

  const isSwapDisabled =
    !amountA ||
    loading ||
    parseInt(amountA) > parseInt(poolType1) ||
    parseInt(amountA) === 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-white p-3">Transfer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <>
          <DialogHeader>
            <DialogTitle>Transfer Lp tokens</DialogTitle>
            <DialogDescription>
              Transfer your Lp shares to to your subaccount
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1 py-4">
            <div className="flex flex-col space-y-2">
              <div className="flex flex-row justify-between">
                <Label htmlFor="first" className="text-left">
                  Lp tokens
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
                    setAmountA(share1);
                  }}
                >
                  Max
                </button>
              </div>

              <div className=" rounded-md flex ">
                <div className="flex-1 flex-col items-center justify-start">
                  <p className="font-neuton">Balance: ${share1}</p>
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
                Tranfertoken();
              }}
              disabled={isSwapDisabled}
              type="submit"
              className="w-full"
            >
              {loading
                ? "Transfering..."
                : !fromToken
                ? "Transfer"
                : "Transfer"}
            </Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  );
}
