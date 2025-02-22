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
import { useState,useEffect,useContext } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NearContext } from '../wallets/near'


export function AddLiquidity({poolType1, poolType2, poolTypeID1, poolTypeID2, Poolid}: {poolType1: string, poolType2:string, poolTypeID1: string, poolTypeID2: string, Poolid : string}) {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [fromBal, setfromBal] = useState("");
  const [toBal, settoBal] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [lastChanged, setLastChanged] = useState("A");
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [loaded, setloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subal1, setsubal] = useState("");
  const [subal2, setsubal2] = useState("");


  function toHumanReadable(amount : any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
  

    const amountStr = String(amount).padStart(power + 1, "0");
  

    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);
  

    const humanReadable = `${integerPart}.${fractionalPart}`;
  

    const formattedAmount = parseFloat(humanReadable).toFixed(2);
  
    return formattedAmount;
  }

  async function fetchTokenDataByContract(poolType1: any, poolType2: any) {
    try {
 
      const tokenResponse = await fetch("https://api.ref.finance/list-token");
      if (!tokenResponse.ok) {
        throw new Error("Failed to fetch token list");
      }
      const tokenData = await tokenResponse.json();
  

      const priceResponse = await fetch("https://api.ref.finance/list-token-price");
      if (!priceResponse.ok) {
        throw new Error("Failed to fetch token price list");
      }
      const priceData = await priceResponse.json();
  

      const tokensArray = Object.keys(tokenData).map((contractId) => {
        const token = tokenData[contractId];
        return {
          tokenName: token.name,
          contractId,
          tokenSymbol: token.symbol,
          icon: token.icon,
          price: priceData[contractId] ? priceData[contractId].price : null,
        };
      });

      // console.log("Tokens fetched:", tokensArray);
      setloaded(true)
     
      const filteredTokens = tokensArray.filter((t) => t.contractId);
  
      
      const poolToken1 = filteredTokens.find((t) =>
        t.contractId.toLowerCase().includes(poolType1.toLowerCase().trim())
      );
      const poolToken2 = filteredTokens.find((t) =>
        t.contractId.toLowerCase().includes(poolType2.toLowerCase().trim())
      );

  
      return { poolToken1, poolToken2 };
    } catch (error) {
      console.error("Error fetching token data:", error);
      return { poolToken1: null, poolToken2: null };
    }
  }
  
  
  

  useEffect(() => {
    async function gettoksbal () {
      const getuserdata = await wallet.viewMethod({
        contractId: "auto-claim-main.near",
        method: "get_user",
        args: {
          wallet_id: signedAccountId,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const gettokenin =   await wallet.viewMethod(
        {  contractId : poolTypeID1,
          method :    "ft_balance_of",
          args: {
          account_id: signedAccountId , // User account
      }
        },
        );

        const gettokenin2 =   await wallet.viewMethod(
          {  contractId : poolTypeID1,
            method :    "ft_balance_of",
            args: {
              account_id:`${getuserdata.username}.auto-claim-main.near`, 
        }
          },
          );

         
  if (poolType1 === "wNEAR"){
    const gettokenout =  await wallet.getBalance(signedAccountId)
    settoBal( parseFloat(gettokenout).toFixed(2))
    setsubal(toHumanReadable(gettokenin2,"near" ))
  }else{
    setfromBal(toHumanReadable(gettokenin,"token" ))
    setsubal(toHumanReadable(gettokenin2,"token" ))
  }
       
    
      const gettokenout =  await wallet.viewMethod(
        {  contractId : poolTypeID2,
          method :    "ft_balance_of",
          args: {
          account_id:signedAccountId, // User account
      }
        },
        );

        const gettokenout2 =  await wallet.viewMethod(
          {  contractId : poolTypeID2,
            method :    "ft_balance_of",
            args: {
              account_id:`${getuserdata.username}.auto-claim-main.near`, 
        }
          },
          );

        if (poolType2 === "wNEAR"){
          const gettokenout =  await wallet.getBalance(signedAccountId)
    
          settoBal( parseFloat(gettokenout).toFixed(2))
          setsubal2(toHumanReadable(gettokenout2,"near" ))
          
        }else{
          settoBal(toHumanReadable(gettokenout,"token" ))
          setsubal2(toHumanReadable(gettokenout2,"token" ))
        }
  
        //settoBal(gettokenout)
    }
  
    gettoksbal()
    fetchTokenDataByContract(poolTypeID1, poolTypeID2).then((result) => {
      setFromToken(result.poolToken1)
      setToToken(result.poolToken2)
      // console.log(result);
    });
  
  }, [loaded])





  
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
  
    const calculated = (Number(value) * toToken.price) / fromToken.price;
    setAmountA(calculated.toFixed(6));
  };


  function toSmallestUnit(amount : any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
  
    const amountStr = String(amount);
  
    const [integerPart, fractionalPart = ""] = amountStr.split(".");
  
    const paddedFractionalPart = fractionalPart.padEnd(power, "0");
  
    const smallestUnit = BigInt(integerPart + paddedFractionalPart);
  
    return smallestUnit.toString();
  }


  async function Addliq (poolid : any, tokeninNear: any, tokenamount: any, tokenname : any){
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });
  
    const transactions = [
      {
          receiverId: `${getuserdata.username}.auto-claim-main.near`, 
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "add_liq", 
                args: {
               
                tokenamount: tokenamount,
                wrappednearamount:tokeninNear,
                poolid: poolid,
                tokenname: tokenname,
                userid: `${getuserdata.username}.auto-claim-main.near`, 
                gassing : "35"
                },
                gas: "300000000000000", // Gas for transaction execution
                deposit: "0",
              },
            },
          ],
        },
    ]

    const products2 = await wallet.signAndSendTransactions({
      transactions
    });
    
    console.log(products2);
  }


  const isSwapDisabled =
    !fromToken ||
    !toToken ||
    !amountA ||
    !amountB ||
    fromToken === toToken ||
    loading||
    parseInt(amountA) > parseInt(subal1)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-white p-3">Add Liquidity</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Liquidity</DialogTitle>
          <DialogDescription>
            Add liquidity to the pool to start trading.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="first" className="text-left">
              {poolType1}
            </Label>
            <div className=" rounded-md flex ">
            <div className="flex-1 flex-col items-center justify-start">
                <p className="font-neuton">User Balance: ${fromBal}</p>
                <p className="font-neuton">Sub-account Balance: ${subal1}</p>
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
          <div className="flex flex-col space-y-2 mt-5">
            <Label htmlFor="second" className="text-left">
            
              {poolType2}
            </Label>
            <div className=" rounded-md flex ">
            <div className="flex-1 flex-col items-center justify-start">
                <p className="font-neuton">User Balance: ${toBal}</p>
                <p className="font-neuton">Sub-account Balance: ${subal2}</p>
              </div>
              <Input
                id="second"
                type="number"
                value={amountB}
                onChange={handleChangeB}
                className="hover:border-2 hover:border-black-500 w-[full] p-2 outline-none border-black focus:ring-0     col-span-9"
              />
             
            </div>
          </div>
        </div>
        <div>
          
        </div>
        <DialogFooter>
          <Button onClick={() => {
            const tokeninNear = toSmallestUnit(amountB, "near")
            const tokenamount = toSmallestUnit(amountA, "token")
          Addliq(Poolid,tokeninNear, tokenamount, poolTypeID1 )

          }}  disabled={isSwapDisabled} type="submit" className="w-full">
          {loading
            ? "Adding..."
            : !fromToken || !toToken
            ? "Select tokens"
            : "Add Liquidity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
