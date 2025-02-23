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
import { NearContext } from '../wallets/near'

export function Stake({poolType1, poolType2, poolTypeID1, poolTypeID2, Poolid}: {poolType1: string, poolType2:string, poolTypeID1: string, poolTypeID2: string, Poolid : string}) {
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
  const [stakepage , setstakepage] = useState(true);
  const [selected, setSelected] = useState("");


  function toHumanReadable(amount : any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
  

    const amountStr = String(amount).padStart(power + 1, "0");
  

    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);
  

    const humanReadable = `${integerPart}.${fractionalPart}`;
  

    const formattedAmount = parseFloat(humanReadable).toFixed(2);
  
    return formattedAmount;
  }





  
  const handleChangeA = (e : any) => {
    const value = e.target.value;
    setAmountA(value);
  };

  const handleChangeB = (e : any) => {
    const value = e.target.value;
    setAmountB(value);
   
  };



  async function Stake (){
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });
  
   


    const preferences = [
        {  seed_id: `v2.ref-finance.near@${Poolid}`,
            token_id: poolType1,
             smart_contract_name: `${getuserdata.username}.auto-claim-main.near`,
             is_active: "true",
             reinvest_to : selected },
      ];
     

    const transactions =[

        
    

        {
            receiverId: `${getuserdata.username}.auto-claim-main.near`,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: "stake_lp_tokens", // Missing methodName
                  args: {
                    pool_id: `:${Poolid}`,
                    lp_token_amount:  amountA,
                    gassing : "50",
                    useracc: `${getuserdata.username}.auto-claim-main.near`
                  },
                  gas: "300000000000000", // Gas for transaction execution
                  deposit: "0",
                },
              },
            ],
          },

          {
            receiverId: "auto-claim-main.near",
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: "update_preferences", // Missing methodName
                  args: {
                    prefs : preferences
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
    

  }



  async function unStake (){
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });
  



    const transactions =[
        {
            receiverId: `${getuserdata.username}.auto-claim-main.near`,
            actions: [
            {
                type: "FunctionCall",
                params: {
                methodName: "unstake_lp", // Missing methodName
                args: {
                    seed_id: `v2.ref-finance.near@${Poolid}`,
                    withdraw_amount:  amountB,
                    gassing : "50",
                    tokenname: poolTypeID1 === "wrap.near" ? poolTypeID2 : poolTypeID1
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
    

  }






  const isSwapDisabled =
  !amountA ||
  loading||
  parseInt(amountA) > parseInt(poolType1) ||
  parseInt(amountA) === 0 ||
  selected === ""


  const isSwapDisabled2 =
  !amountB ||
  loading||
  parseInt(amountB) > parseInt(poolType2) ||
  parseInt(amountB) === 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full text-white p-3">Staking</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className=" flex flex-row w-1/2 gap-4 mb-5"> 
        <Button onClick={() => {setstakepage(true)}} className="w-full text-white p-3">Stake</Button>
        <Button onClick={() => {setstakepage(false)}} className="w-full text-white p-3">Unstake</Button>
        </div>

       {stakepage? 
       <>
        <DialogHeader>
          <DialogTitle>Stake Lp tokens</DialogTitle>
          <DialogDescription>
           Stake your Lp shares to start earning rewards 
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="first" className="text-left">
            Lp tokens
            </Label>
            <div className=" rounded-md flex ">
            <div className="flex-1 flex-col items-center justify-start">
                <p className="font-neuton">Balance: ${poolType1}</p>
                {/* <p className="font-neuton">Sub-account Balance: ${subal1}</p> */}
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
            {/* <div className="text-black flex-1">
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Where would you like to reinvest your claim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="xRef">Stake xRef</SelectItem>
                    <SelectItem value="burrow">
                      Deposit into Burrow Pool
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div> */}
              <div className="text-black flex-1">
      <Select onValueChange={(value) => setSelected(value)} value={selected}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Where would you like to reinvest your claim" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="Stake">Stake xRef</SelectItem>
            <SelectItem value="Burrow">Deposit into Burrow Pool</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
            
          </div>
    
        </div>
        </div>
        <div>
          
        </div>
        <DialogFooter>
          <Button onClick={() => {
           Stake()

          }}  disabled={isSwapDisabled} type="submit" className="w-full">
          {loading
            ? "Staking..."
            : !fromToken
            ? "Enter share"
            : "Stake"}
          </Button>
        </DialogFooter>
        </> : <>
        <DialogHeader>
          <DialogTitle>Unstake Lp tokens</DialogTitle>
          <DialogDescription>
           Unstake your Lp shares from pool
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="first" className="text-left">
             Staked Lp token
            </Label>
            <div className=" rounded-md flex ">
            <div className="flex-1 flex-col items-center justify-start">
                <p className="font-neuton">Balance: ${poolType2}</p>
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
        <div>
          
        </div>
        <DialogFooter>
          <Button onClick={() => {
            unStake()
          }}  disabled={isSwapDisabled2} type="submit" className="w-full">
          {loading
            ? "Unstaking..."
            : !fromToken || !toToken
            ? "Enter amount"
            : "Unstake"}
          </Button>
        </DialogFooter>
        
        </>
        }


      </DialogContent>
    </Dialog>
  );
}
