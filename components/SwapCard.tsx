"use client";
import { ArrowDown, Settings } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenSelectButton } from "./TokenSelect";
import { useState, useEffect, useContext } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NearContext } from "../wallets/near";
import { useParams, useRouter } from "next/navigation";

export function SwapCard() {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [token, settoken] = useState<any[]>([]);
  const router = useRouter();
  const [amountA, setAmountA] = useState<any>("");
  const [amountB, setAmountB] = useState<any>("");
  const [fromBal, setfromBal] = useState<any>("");
  const [toBal, settoBal] = useState<any>("");
  const [lastChanged, setLastChanged] = useState<any>("A");

  function toHumanReadable(amount: any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;

    const amountStr = String(amount).padStart(power + 1, "0");

    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);

    const humanReadable = `${integerPart}.${fractionalPart}`;

    const formattedAmount = parseFloat(humanReadable).toFixed(2);

    return formattedAmount;
  }

  function toSmallestUnit(amount: any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;

    const amountStr = String(amount);

    const [integerPart, fractionalPart = ""] = amountStr.split(".");

    const paddedFractionalPart = fractionalPart.padEnd(power, "0");

    const smallestUnit = BigInt(integerPart + paddedFractionalPart);

    return smallestUnit.toString();
  }

  const handleTransfer = async () => {
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    const slippage = 0.005;
    const minAmountOut =
      toToken.contractId === "wrap.near"
        ? toSmallestUnit(amountB, "near")
        : toSmallestUnit((parseFloat(amountB) * (1 - slippage)).toString());
    const amountIn =
      fromToken.contractId === "wrap.near"
        ? toSmallestUnit(amountA, "near")
        : toSmallestUnit((parseFloat(amountA) * (1 - slippage)).toString());

    const transactions = [
      {
        receiverId: toToken.contractId,
        actions: [
          ...(toToken.contractId === "wrap.near"
            ? [
                {
                  type: "FunctionCall",
                  params: {
                    methodName: "near_deposit",
                    args: {},
                    gas: "85000000000000",
                    deposit: minAmountOut,
                  },
                },
              ]
            : []),
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: `${getUserData.subaccount_id}`,
                registration_only: true,
              },
              gas: "85000000000000",
              deposit: "1250000000000000000000",
            },
          },
        ],
      },

      {
        receiverId: toToken.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer",
              args: {
                receiver_id: `${getUserData.subaccount_id}`,
                amount: minAmountOut,
              },
              gas: "85000000000000",
              deposit: "1",
            },
          },
        ],
      },

      {
        receiverId: fromToken.contractId,
        actions: [
          ...(fromToken.contractId === "wrap.near"
            ? [
                {
                  type: "FunctionCall",
                  params: {
                    methodName: "near_deposit",
                    args: {},
                    gas: "85000000000000",
                    deposit: amountIn,
                  },
                },
              ]
            : []),

          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: `${getUserData.subaccount_id}`,
                registration_only: true,
              },
              gas: "85000000000000",
              deposit: "1250000000000000000000",
            },
          },
        ],
      },

      {
        receiverId: fromToken.contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer",
              args: {
                receiver_id: `${getUserData.subaccount_id}`,
                amount: amountIn,
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
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmountA(amountB);
    setAmountB(amountA);
  };

  const isSwapDisabled =
    !fromToken ||
    !toToken ||
    !amountA ||
    !amountB ||
    fromToken === toToken ||
    loading ||
    parseFloat(amountA) > parseFloat(fromBal);

  const isSwapDisabled2 = !fromToken || !toToken || fromToken === toToken;

  const handleChangeA = (e: any) => {
    const value = e.target.value;
    setAmountA(value);
    setLastChanged("A");
    if (!value || isNaN(Number(value))) {
      setAmountB("");
      return;
    }

    const calculated = (Number(value) * fromToken.price) / toToken.price;
    setAmountB(calculated.toFixed(6));
  };

  const handleChangeB = (e: any) => {
    const value = e.target.value;
    setAmountB(value);
    setLastChanged("B");
    if (!value || isNaN(Number(value))) {
      setAmountA("");
      return;
    }

    const calculated = (Number(value) * toToken.price) / fromToken.price;
    setAmountA(calculated.toFixed(6));
  };

  useEffect(() => {
    async function gettoksbal() {
      try {
        if (!signedAccountId) {
          throw new Error("No account signed in");
        }

        let gettokenin;
        let gettokenout;

        if (fromToken?.contractId === "wrap.near") {
          gettokenin = await wallet.getBalance(signedAccountId);
        } else {
          gettokenin = await wallet.viewMethod({
            contractId: fromToken?.contractId,
            method: "ft_balance_of",
            args: JSON.stringify({
              account_id: signedAccountId,
            }),
          });
        }
        setfromBal(gettokenin);

        if (toToken?.contractId === "wrap.near") {
          gettokenout = await wallet.getBalance(signedAccountId);
        } else {
          console.log("Fetching balance from:", toToken?.contractId);
          gettokenout = await wallet.viewMethod({
            contractId: toToken?.contractId,
            method: "ft_balance_of",
            args: JSON.stringify({
              account_id: signedAccountId,
            }),
          });
        }
        settoBal(gettokenout);
      } catch (error) {}
    }

    gettoksbal();
  });

  return (
    <Card
      className="w-full sm:max-w-md max-w-sm mx-auto mt-5"
      style={{ backgroundColor: "#0c171f" }}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-2xl text-white font-bold">
          Transfer to Subaccount
        </h2>
        <Popover>
          <PopoverTrigger asChild>
            <Settings className="w-5 h-5 cursor-pointer hover:text-green-900" />
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">
                  Transaction Settings
                </h4>
                <p className="text-sm text-muted-foreground">
                  Set the transaction settings for the swap.
                </p>
              </div>
              <div className="">
                <p className="text-sm font-medium">Slippage tolerance</p>
                <div className="p-2">
                  <ToggleGroup type="single">
                    <ToggleGroupItem value="bold" aria-label="Toggle bold">
                      0.1%
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Toggle italic">
                      0.5%
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="strikethrough"
                      aria-label="Toggle strikethrough"
                    >
                      1%
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 text-white">
          <Label>From</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amountA}
              onChange={handleChangeA}
            />
            <TokenSelectButton
              selectedToken={fromToken}
              onSelect={setFromToken}
              tokens={token}
            />
          </div>
          {fromToken && (
            <>
              <div className="text-sm text-muted-foreground">
                Price: {parseFloat(fromToken.price).toFixed(4)}{" "}
                {fromToken.tokenSymbol}
              </div>

              {fromToken.tokenSymbol === "wNEAR" ? (
                <div className="text-sm text-muted-foreground">
                  Balance: {parseFloat(fromBal).toFixed(4)} Near
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Balance:
                  {parseFloat(toHumanReadable(fromBal, "token")).toFixed(
                    4
                  )}{" "}
                  {fromToken.tokenSymbol}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={switchTokens}
          >
            <ArrowDown className="h-4 w-4 text-white" />
            <span className="sr-only text-white">Switch tokens</span>
          </Button>
        </div>
        <div className="grid gap-2 text-white">
          <Label>To</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amountB}
              onChange={handleChangeB}
            />
            <TokenSelectButton
              selectedToken={toToken}
              onSelect={setToToken}
              tokens={token}
            />
          </div>
          {toToken && (
            <>
              <div className="text-sm text-muted-foreground">
                Price: {parseFloat(toToken.price).toFixed(4)}{" "}
                {toToken.tokenSymbol}
              </div>

              {toToken.tokenSymbol === "wNEAR" ? (
                <div className="text-sm text-muted-foreground">
                  Balance: {parseFloat(toBal).toFixed(4)} Near
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Balance:
                  {parseFloat(toHumanReadable(toBal, "token")).toFixed(4)}{" "}
                  {toToken.tokenSymbol}
                </div>
              )}
            </>
          )}
        </div>
        {fromToken && toToken && (
          <div className="text-sm text-muted-foreground">
            1 {fromToken.symbol} = 1 {toToken.symbol}
          </div>
        )}
      </CardContent>
      {/* <CardFooter>
        <Button
          className="w-full"
          size="lg"
          style={{ backgroundColor: "black" }}
          disabled={isSwapDisabled}
          onClick={handleTransfer}
        >
          {loading
            ? "Transfering..."
            : !fromToken || !toToken
            ? "Select tokens"
            : "Transfer"}
        </Button>
      </CardFooter> */}

      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          style={{ backgroundColor: "black" }}
          disabled={isSwapDisabled2}
          onClick={() => {
            router.push(
              `https://dex.rhea.finance/#${fromToken.contractId}|${toToken.contractId}`
            );
          }}
        >
          Make Swap in Rhea Finance
        </Button>
      </CardFooter>
    </Card>
  );
}
