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

interface Wallet {
  viewMethod: (args: {
    contractId: string;
    method: string;
    args: Record<string, any>;
    gas?: string;
    deposit?: string;
  }) => Promise<any>;
  signAndSendTransactions: (args: {
    transactions: Array<{
      receiverId: string;
      actions: Array<{
        type: string;
        params: {
          methodName: string;
          args: Record<string, any>;
          gas: string;
          deposit: string;
        };
      }>;
    }>;
  }) => Promise<any>;
}

interface NearContextType {
  signedAccountId: string;
  wallet: Wallet;
}

interface TransferLpProps {
  poolType1: string;
  poolType2: string;
  poolTypeID1: string;
  poolTypeID2: string;
  Poolid: string;
}

export function TransferLp({
  poolType1,
  poolType2,
  poolTypeID1,
  poolTypeID2,
  Poolid,
}: TransferLpProps) {
  const { signedAccountId, wallet } = useContext<NearContextType>(NearContext);
  const [amountA, setAmountA] = useState<any>("");
  const [fromToken, setFromToken] = useState<any>(null);
  const [subal1, setsubal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [share1, setshare1] = useState<string | null>(null);

  const handleChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountA(value);
  };

  let count: number = 0;
  async function checkshares(): Promise<void> {
    count++;
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
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
        pool_id: parseInt(Poolid), 
        account_id: signedAccountId,
      },
    });

    const mysharesInt = parseInt(myshares) || 0;

    setshare1(myshares);
  }

  if (count < 2) {
    checkshares().catch((err) => {});
  }

  async function Tranfertoken(): Promise<void> {

    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });
    setsubal(!subal1);
    const status: boolean = await wallet.viewMethod({
      contractId: "v2.ref-finance.near",
      method: "mft_has_registered",
      args: {
        token_id: `:${Poolid}`,
        account_id: `${getUserData.subaccount_id}`,
      },
    });

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
                  receiver_id: `${getUserData.subaccount_id}`,
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
                  account_id: `${getUserData.subaccount_id}`,
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
                  receiver_id: `${getUserData.subaccount_id}`,
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

  const isSwapDisabled: boolean =
    !amountA ||
    loading ||
    parseInt(amountA) > parseInt(poolType1) ||
    parseInt(amountA) === 0;

  return (
    <Dialog 
    open={subal1}
    onOpenChange={() => {
      setsubal(!subal1);
    }}
    >
      <DialogTrigger asChild>
        <Button
          style={{ backgroundColor: "black" }}
          className="w-full text-white p-3"
        >
          Transfer
        </Button>
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
