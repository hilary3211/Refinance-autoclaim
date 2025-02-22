"use client";
import { ArrowDown, Settings } from "lucide-react";
import { Bold, Italic, Underline } from "lucide-react";

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
import { useState,useEffect,useContext } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWallet } from "./zustandStore";
import { NearContext } from '../wallets/near'
import { utils } from "near-api-js";
import { ConsoleLogger } from "@near-js/utils";
import { util } from "zod";
import { Grid } from 'react-loader-spinner'

export function SwapCard() {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  // const [fromAmount, setFromAmount] = useState("");
  // const [toAmount, setToAmount] = useState("");
  const [loading, setLoading] = useState(false);
  // const { wallet, signedAccountId } = useWallet();
  const [token, settoken] = useState<any[]>([]);
  const [loading2, setLoading2] = useState(false);



  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [fromBal, setfromBal] = useState("");
  const [toBal, settoBal] = useState("");
  const [lastChanged, setLastChanged] = useState("A");



function getMinAmountOut(jsonStr : any) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.actions && Array.isArray(data.actions)) {
      for (const action of data.actions) {
        if (action.min_amount_out) {
          return action.min_amount_out;
        }
      }
    }
    return null; // Return null if not found
  } catch (error) {
    console.error("Invalid JSON string", error);
    return null;
  }
}

function getMinAmountOut2(jsonStr : any) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.actions && Array.isArray(data.actions)) {
      for (const action of data.actions) {
        if (action.amount_in) {
          return action.amount_in;
        }
      }
    }
    return null; // Return null if not found
  } catch (error) {
    console.error("Invalid JSON string", error);
    return null;
  }
}






  const handleSwap = async (datagotten : any) => {
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });
    try {
      setLoading(true);
      if (datagotten.length > 1){
        const minAmountOut = getMinAmountOut(datagotten[1].functionCalls[0].args.msg);
        const amountIn = getMinAmountOut2(datagotten[1].functionCalls[0].args.msg);
        const transactions = [
          

          {
            receiverId: datagotten[0].receiverId,
            actions: [
              ...(datagotten[0].receiverId === "wrap.near"
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
                  methodName: datagotten[0].functionCalls[0].methodName,
                  args: datagotten[0].functionCalls[0].args,
                  gas: "85000000000000",
                  deposit: "125000000000000000000000",
                },
              },
            ],
          },
        
          {
            receiverId: datagotten[1].receiverId,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: datagotten[1].functionCalls[0].methodName,
                  args: datagotten[1].functionCalls[0].args,
                  gas: "85000000000000",
                  deposit: "1",
                },
              },
            ],
          },
          {
            receiverId: toToken.contractId, // Token contract for fake tokens
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: "storage_deposit",
                  args: {
                    account_id: `${getuserdata.username}.auto-claim-main.near`,
                    registration_only: true,
                  },
                  gas: "85000000000000",
                  deposit: "125000000000000000000000",
                },
              },
              {
                type: "FunctionCall",
                params: {
                  methodName: "ft_transfer",
                  args: {
                    receiver_id: `${getuserdata.username}.auto-claim-main.near`,
                    amount: minAmountOut,
                  },
                  gas: "85000000000000",
                  deposit: "1",
                },
              },
            ],
          },
          {
            receiverId: fromToken.contractId, // wNEAR contract
            actions: [
              ...(fromToken.contractId === "wrap.near"
                ? [
                    {
                      type: "FunctionCall",
                      params: {
                        methodName: "near_deposit",
                        args: {},
                        gas: "85000000000000",
                        deposit: amountIn
                      },
                    },
                  ]
                : []),
              {
                type: "FunctionCall",
                params: {
                  methodName: "storage_deposit",
                  args: {
                    account_id: `${getuserdata.username}.auto-claim-main.near`,
                    registration_only: true,
                  },
                  gas: "85000000000000",
                  deposit: "12500000000000000000000",
                },
              },
              {
                type: "FunctionCall",
                params: {
                  methodName: "ft_transfer",
                  args: {
                    receiver_id: `${getuserdata.username}.auto-claim-main.near`,
                    amount: amountIn,
                  },
                  gas: "85000000000000",
                  deposit: "1",
                },
              },
            ],
          },
        ];
      
        const products2 = await wallet.signAndSendTransactions({
          transactions,
        });
        console.log(products2);
      
      }else {
        const minAmountOut = getMinAmountOut(datagotten[0].functionCalls[0].args.msg);
        const amountIn = getMinAmountOut2(datagotten[0].functionCalls[0].args.msg);
        const transactions = [
        
          {
              receiverId: datagotten[0].receiverId,
              actions: [
                ...(datagotten[0].receiverId === "wrap.near"
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
                      methodName: datagotten[0].functionCalls[0].methodName,
                      args: datagotten[0].functionCalls[0].args,
                      gas: "85000000000000",
                      deposit : "1",
                  } 
                  }
              ]
          },

          {
            receiverId: toToken.contractId,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: "storage_deposit",
                  args: {
                    account_id: `${getuserdata.username}.auto-claim-main.near`, // Receiver must be registered to hold wNEAR
                    registration_only: true
                  },
                  gas: "85000000000000",
                  deposit : "125000000000000000000000",
                }
              },

              {
                type: "FunctionCall",
                params: {
                  methodName: "ft_transfer",
                  args: {
                    receiver_id: `${getuserdata.username}.auto-claim-main.near`, // Receiver account
                    amount: minAmountOut// 1 fake token
                  },
                  gas: "85000000000000", // 30 TGas
                  deposit: "1" // 1 yoctoNEAR required
                }
              }
            ]
          },

       
          {
            receiverId: fromToken.contractId, // wNEAR contract
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
                    account_id: `${getuserdata.username}.auto-claim-main.near`, 
                    registration_only: true
                  },
                  gas: "85000000000000",
                  deposit: "12500000000000000000000", // Adjust based on storage cost
                },
              },
              {
                type: "FunctionCall",
                params: {
                  methodName: "ft_transfer",
                  args: {
                    receiver_id: `${getuserdata.username}.auto-claim-main.near`, // Correct key
                    amount: amountIn // Ensure this amount is covered by deposit
                  },
                  gas: "85000000000000", // 30 TGas
                  deposit: "1" // 1 yoctoNEAR required for transfer
                }
              }
            ]
          },
  
  
          
          
      
        ]
        const products2 = await wallet.signAndSendTransactions({
          transactions
        });
        
        console.log(products2);
      }
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setLoading(false);
    }
  };


  const swapToken = async () => {
    setLoading(true);

    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });
    // console.log(getuserdata)
    try {
      const response = await fetch("https://us-central1-almond-1b205.cloudfunctions.net/autoclaim/swapdata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenin : fromToken.contractId , tokenout : toToken.contractId, amount : amountA, accid : signedAccountId }),
      });


      
      if (response.ok && response.body) {
       

        const result : any = await response.json()
        const datagotten = result.data
       console.log(datagotten);
       
        if (getuserdata !== null){
          await handleSwap(datagotten)
         
              
        
      
      
            
        }


      } else {
        console.error("Failed to start streaming");
      }
    } catch (error) {}finally {
      setLoading(false);
    }
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
    parseFloat(amountA)  > parseFloat(fromBal) ||
    parseFloat(amountB)  > parseFloat(toBal) 

   
  
    const handleChangeA = (e : any) => {
      const value = e.target.value;
      setAmountA(value);
      setLastChanged("A");
      if (!value || isNaN(Number(value))) {
        setAmountB("");
        return;
      }
      // Conversion: amountB = (amountA * tokenA.priceUSD) / tokenB.priceUSD
      const calculated = (Number(value) * fromToken.price) / toToken.price;
      setAmountB(calculated.toFixed(6)); // adjust precision as needed
    };
  
    const handleChangeB = (e : any) => {
      const value = e.target.value;
      setAmountB(value);
      setLastChanged("B");
      if (!value || isNaN(Number(value))) {
        setAmountA("");
        return;
      }
      // Conversion: amountA = (amountB * tokenB.priceUSD) / tokenA.priceUSD
      const calculated = (Number(value) * toToken.price) / fromToken.price;
      setAmountA(calculated.toFixed(6));
    };



//   function yoctoToNear(yoctoValue) {
//     // Convert yoctoValue to BigInt
//     const yoctoBigInt = BigInt(yoctoValue);
//     // 1 NEAR = 10^24 yoctoNEAR
//     const nearValue = Number(yoctoBigInt / BigInt(1e24));
//     return nearValue;
// }

  

useEffect(() => {
  async function gettoksbal () {
    let gettokenin
    let gettokenout
    if ( fromToken?.contractId === "wrap.near"){
      gettokenin =  await wallet.getBalance(signedAccountId)
    }else{
      gettokenin =   await wallet.viewMethod(
        {  contractId : fromToken?.contractId,
          method :    "ft_balance_of",
          args: {
          account_id: signedAccountId , // User account
      }
        },
        );
    }
   

      

      setfromBal(gettokenin)
  

      if ( toToken?.contractId === "wrap.near"){
        gettokenout =  await wallet.getBalance(signedAccountId)
      }else{
         gettokenout =  await wallet.viewMethod(
          {  contractId : toToken?.contractId,
            method :    "ft_balance_of",
            args: {
            account_id:signedAccountId, // User account
        }
          },
          );
      }
   

      settoBal(gettokenout)
  }

  gettoksbal()

})
  
  
  return (
    <Card className="w-full sm:max-w-md max-w-sm mx-auto mt-5">
      {/* <Button onClick={swapToken} className="w-full">SWAP</Button> */}
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-bold">Swap</h2>
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
             Price: ${fromToken.price} {fromToken.tokenSymbol}
           </div>
           <div className="text-sm text-muted-foreground">
              Balance: ${fromBal} {fromToken.tokenSymbol}
            </div>
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
            <TokenSelectButton selectedToken={toToken} onSelect={setToToken} tokens={token} />
          </div>
          {toToken && (
            <>
              <div className="text-sm text-muted-foreground">
              Price: ${toToken.price} {toToken.tokenSymbol}
            </div>
            <div className="text-sm text-muted-foreground">
              Balance: ${toBal} {toToken.tokenSymbol}
            </div>
            </>

            
          )}
        </div>
        {fromToken && toToken && (
          <div className="text-sm text-muted-foreground">
            {/* In a real app, show actual exchange rate */}1 {fromToken.symbol}{" "}
            = 1 {toToken.symbol}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          disabled={isSwapDisabled}
          onClick={swapToken}
        >
          {loading
            ? "Swapping..."
            : !fromToken || !toToken
            ? "Select tokens"
            : "Swap"}
        </Button>
      </CardFooter>
    </Card>
  );
}









