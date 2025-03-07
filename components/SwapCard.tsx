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
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [fromBal, setfromBal] = useState("");
  const [toBal, settoBal] = useState("");
  const [lastChanged, setLastChanged] = useState("A");

  function getMinAmountOut(jsonStr: any) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          if (action.min_amount_out) {
            return action.min_amount_out;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Invalid JSON string", error);
      return null;
    }
  }

  function getMinAmountOut2(jsonStr: any) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          if (action.amount_in) {
            return action.amount_in;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Invalid JSON string", error);
      return null;
    }
  }

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
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main2.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });
  

    const slippage = 0.005; // 0.5%
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
                    gas: "85000000000000", // 85 Tgas
                    deposit: minAmountOut, // Amount of NEAR to deposit
                  },
                },
              ]
            : []),
          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: `${getuserdata.username}.auto-claim-main2.near`,
                registration_only: true,
              },
              gas: "85000000000000", // 85 Tgas
              deposit: "1250000000000000000000", // 0.00125 NEAR
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
                receiver_id: `${getuserdata.username}.auto-claim-main2.near`,
                amount: minAmountOut,
              },
              gas: "85000000000000", // 85 Tgas
              deposit: "1", // Minimal deposit
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
                    gas: "85000000000000", // 85 Tgas
                    deposit: amountIn, // Amount of NEAR to deposit
                  },
                },
              ]
            : []),

          {
            type: "FunctionCall",
            params: {
              methodName: "storage_deposit",
              args: {
                account_id: `${getuserdata.username}.auto-claim-main2.near`,
                registration_only: true,
              },
              gas: "85000000000000", // 85 Tgas
              deposit: "1250000000000000000000", // 0.00125 NEAR
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
                receiver_id: `${getuserdata.username}.auto-claim-main2.near`,
                amount: amountIn,
              },
              gas: "85000000000000", // 85 Tgas
              deposit: "1", // Minimal deposit
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
      let gettokenin;
      let gettokenout;
      if (fromToken?.contractId === "wrap.near") {
        gettokenin = await wallet.getBalance(signedAccountId);
      } else {
        gettokenin = await wallet.viewMethod({
          contractId: fromToken?.contractId,
          method: "ft_balance_of",
          args: {
            account_id: signedAccountId,
          },
        });
      }

      setfromBal(gettokenin);

      if (toToken?.contractId === "wrap.near") {
        gettokenout = await wallet.getBalance(signedAccountId);
      } else {
        gettokenout = await wallet.viewMethod({
          contractId: toToken?.contractId,
          method: "ft_balance_of",
          args: {
            account_id: signedAccountId,
          },
        });
      }

      settoBal(gettokenout);
    }

    gettoksbal();
  });

  return (
    <Card className="w-full sm:max-w-md max-w-sm mx-auto mt-5">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-bold">Transfer to Subaccount</h2>
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
        <div className="grid gap-2">
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
                Price: ${parseFloat(fromToken.price).toFixed(4)}{" "}
                {fromToken.tokenSymbol}
              </div>

              {fromToken.tokenSymbol === "wNEAR" ? (
                <div className="text-sm text-muted-foreground">
                  Balance: ${parseFloat(fromBal).toFixed(4)} Near
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Balance: $
                  {parseFloat(toHumanReadable(fromBal, "token")).toFixed(4)}{" "}
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
            <ArrowDown className="h-4 w-4" />
            <span className="sr-only">Switch tokens</span>
          </Button>
        </div>
        <div className="grid gap-2">
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
                Price: ${parseFloat(toToken.price).toFixed(4)}{" "}
                {toToken.tokenSymbol}
              </div>

              {toToken.tokenSymbol === "wNEAR" ? (
                <div className="text-sm text-muted-foreground">
                  Balance: ${parseFloat(toBal).toFixed(4)} Near
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Balance: $
                  {parseFloat(toHumanReadable(toBal, "token")).toFixed(4)}{" "}
                  {toToken.tokenSymbol}
                </div>
              )}

              {/* <div className="text-sm text-muted-foreground">
                Price: ${toToken.price} {toToken.tokenSymbol}
              </div>
              <div className="text-sm text-muted-foreground">
                Balance: ${toBal} {toToken.tokenSymbol}
              </div> */}
            </>
          )}
        </div>
        {fromToken && toToken && (
          <div className="text-sm text-muted-foreground">
            1 {fromToken.symbol} = 1 {toToken.symbol}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          disabled={isSwapDisabled}
          onClick={handleTransfer}
        >
          {loading
            ? "Transfering..."
            : !fromToken || !toToken
            ? "Select tokens"
            : "Transfer"}
        </Button>
      </CardFooter>

      <CardFooter>
        <Button
          className="w-full"
          size="lg"
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
