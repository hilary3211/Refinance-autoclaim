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
import { usePathname, useSearchParams } from "next/navigation";
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

// Define props interface
interface StakeProps {
  poolType1: string;
  poolType2: string;
  poolTypeID1: string;
  poolTypeID2: string;
  Poolid: string;
}

export function Stake({
  poolType1,
  poolType2,
  poolTypeID1,
  poolTypeID2,
  Poolid,
}: StakeProps) {
  const { signedAccountId, wallet } = useContext<NearContextType>(NearContext);
  const [fromBal, setfromBal] = useState<string>("");
  const [toBal, settoBal] = useState<string>("");
  const [amountA, setAmountA] = useState<string>("");
  const [amountB, setAmountB] = useState<string>("");
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [modasl, setmodasl] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [subal1, setsubal] = useState<boolean>(false);
  const [subal2, setsubal2] = useState<boolean>(false);
  const [subal3, setsubal3] = useState<boolean>(false);
  const [stakepage, setstakepage] = useState<boolean>(true);
  const [selected, setSelected] = useState<string>("");

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resetAllModals = () => {
    setmodasl(false)
  };

  useEffect(() => {
    resetAllModals();
  }, [pathname, searchParams]);


  useEffect(() => {
    const getsubbalance = async () => {
      const getUserData = await wallet.viewMethod({
        contractId: "compoundx.near",
        method: "get_user",
        args: { wallet_id: signedAccountId },
        gas: "300000000000000",
        deposit: "0",
      });


      const getbal1 = await wallet.viewMethod({
        contractId: `v2.ref-finance.near`,
        method: "storage_balance_of",
        args: {
          account_id:  `${getUserData.subaccount_id}`,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const getbal2 = await wallet.viewMethod({
        contractId: `boostfarm.ref-labs.near`,
        method: "storage_balance_of",
        args: {
          account_id:  `${getUserData.subaccount_id}`,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const getbal3 = await wallet.viewMethod({
        contractId: `contract.main.burrow.near`,
        method: "storage_balance_of",
        args: {
          account_id : `${getUserData.subaccount_id}`,
        },
        gas: "300000000000000",
        deposit: "0",
      });



      // console.log(getbal1, getbal2, getbal3)

      setsubal(!getbal1 || getbal1.total === "0");
      setsubal2(!getbal2 || getbal2.total === "0");
      setsubal3(!getbal3 || getbal3.total === "0");
    };

    getsubbalance();
  }, []);

  function toHumanReadable(
    amount: string | number,
    tokenType: string = "token"
  ): string {
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

  const handleChangeB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountB(value);
  };

  async function Stake(): Promise<void> {
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    const preference = {
      smart_contract_name: `${getUserData.subaccount_id}`,
      is_active: true,
      invested_in: {
        Burrow: {
          seed_id: `v2.ref-finance.near@${Poolid}`,
          token_id: poolTypeID1,
        },
      },
      reinvest_to: {
        Burrow: {
          seed_id: `v2.ref-finance.near@${Poolid}`,
          token_id: poolTypeID1,
        },
      },
    };

    const transactions: any = [
      subal1 && {
        receiverId: "v2.ref-finance.near",
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
              deposit: "2500000000000000000000",
            },
          },
        ],
      },

      subal2 && {
        receiverId: "boostfarm.ref-labs.near",
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

      {
        receiverId: `${getUserData.subaccount_id}`,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "stake_lp_tokens",
              args: {
                pool_id: `:${Poolid}`,
                lp_token_amount: amountA,
              },
              gas: "300000000000000",
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

    const products2 = await wallet.signAndSendTransactions({
      transactions,
    });
  }

  async function unStake(): Promise<void> {
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    const transactions = [
      {
        receiverId: `${getUserData.subaccount_id}`,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "unstake_lp",
              args: {
                seed_id: `v2.ref-finance.near@${Poolid}`,
                withdraw_amount: amountB,
                token_id:
                  poolTypeID1 === "wrap.near" ? poolTypeID2 : poolTypeID1,
              },
              gas: "300000000000000",
              deposit: "0",
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
              methodName: "delete_preference",
              args: {},
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

  const isSwapDisabled: boolean =
    !amountA ||
    loading ||
    parseInt(amountA) > parseInt(poolType1) ||
    parseInt(amountA) === 0 ||
    selected === "";

  const isSwapDisabled2: boolean =
    !amountB ||
    loading ||
    parseInt(amountB) > parseInt(poolType2) ||
    parseInt(amountB) === 0;

  return (
    <Dialog open={modasl} onOpenChange={() => {setmodasl(!modasl)}}>
      <DialogTrigger asChild>
        <Button className="w-full text-white p-3">Staking</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className=" flex flex-row w-1/2 gap-4 mb-5">
          <Button
            onClick={() => {
              setstakepage(true);
            }}
            className="w-full text-white p-3"
          >
            Stake
          </Button>
          <Button
            onClick={() => {
              setstakepage(false);
            }}
            className="w-full text-white p-3"
          >
            Unstake
          </Button>
        </div>

        {stakepage ? (
          <>
            <DialogHeader>
              <DialogTitle>Stake Lp tokens</DialogTitle>
              <DialogDescription>
                Stake your Lp shares to start earning rewards
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
                      setAmountA(poolType1);
                    }}
                  >
                    Max
                  </button>
                </div>
                <div className=" rounded-md flex ">
                  <div className="flex-1 flex-col items-center justify-start">
                    {/* <p className="font-neuton">Balance: {poolType1}</p> */}
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
                      onValueChange={(value: string) => setSelected(value)}
                      value={selected}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Where would you like to reinvest your claim" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {/* <SelectItem value="Stake">Stake xRef</SelectItem> */}
                          <SelectItem value="Burrow">
                            Deposit into Burrow Pool
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
                  Stake();
                }}
               // disabled={isSwapDisabled}
                type="submit"
                className="w-full"
              >
                {loading ? "Staking..." : !fromToken ? "Enter share" : "Stake"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Unstake Lp tokens</DialogTitle>
              <DialogDescription>
                Unstake your Lp shares from pool
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1 py-4">
              <div className="flex flex-col space-y-2">
                <div className="flex flex-row justify-between">
                  <Label htmlFor="first" className="text-left">
                    Staked Lp token
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
                      setAmountB(poolType2);
                    }}
                  >
                    Max
                  </button>
                </div>
                <div className=" rounded-md flex ">
                  <div className="flex-1 flex-col items-center justify-start">
                    {/* <p className="font-neuton">
                      Balance: {toHumanReadable(poolType2)}
                    </p> */}
                  </div>
                  <Input
                    id="first"
                    type="number"
                    value={amountB}
                    onChange={handleChangeB}
                    className="hover:border-2 hover:border-black-500 w-[full] p-2 outline-none border-black focus:ring-0     col-span-9"
                  />
                </div>
              </div>
            </div>
            <div></div>
            <DialogFooter>
              <Button
                onClick={() => {
                  unStake();
                }}
                disabled={isSwapDisabled2}
                type="submit"
                className="w-full"
              >
                {loading
                  ? "Unstaking..."
                  : !fromToken || !toToken
                  ? "Enter amount"
                  : "Unstake"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
