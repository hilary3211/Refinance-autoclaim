"use client";
import Header from "@/components/Header";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useState,useEffect,useContext } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { NearContext } from '@/wallets/near';
const WithdrawPage = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalItems = 20; // Total number of items in the carousel
  const itemsToShow = 6; // Number of items to show at once
  const [share2, setshare2] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [token, settoken] = useState<any[]>([]);
  const [token2, settoken2] = useState<any[]>([]);
  const [fromToken, setFromToken] = useState<any>(0);
  const [tokensymbol, setmainbal] = useState<any>('');
  const [tokenid, setmainbal2] = useState<any>('');
  const [amount, setAmount] = useState(0);
  // Function to go to the next item
  const nextItem = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex + 1) % (totalItems - itemsToShow + 1)
    );
  };


  const previousItem = () => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + totalItems) % (totalItems - itemsToShow + 1)
    );
  };


  useEffect(() => {
    async function fetchTokenData() {
      try {
        // Fetch token details from Ref Finance token list API
        const tokenResponse = await fetch("https://api.ref.finance/list-token");
        if (!tokenResponse.ok) {
          throw new Error("Failed to fetch token list");
        }
        const tokenData = await tokenResponse.json();
    
        // Fetch token price data (if needed)
        const priceResponse = await fetch("https://api.ref.finance/list-token-price");
        if (!priceResponse.ok) {
          throw new Error("Failed to fetch token price list");
        }
        const priceData = await priceResponse.json();
    
        // Create an array of objects containing token name, contract ID, token symbol, and icon.
        // tokenData is assumed to be an object where keys are contract IDs.
        const tokensArray = Object.keys(tokenData).map((contractId) => {
          const token = tokenData[contractId];
          return {
            tokenName: token.name,
            contractId: contractId,
            tokenSymbol: token.symbol,
            icon: token.icon, // token image is stored as icon here.
            // Optionally, add price info from priceData if available:
            price: priceData[contractId] ? priceData[contractId].price : null
          };
        });
    
        return tokensArray;
      } catch (error) {
        console.error("Error fetching token data:", error);
        return [];
      }
    }

    fetchTokenData().then((tokens) => {
     
      settoken(tokens)
    });
  
  
   
    
    
   
     
  }, [share2]);
  const filteredTokens = token?.filter(
    (token) =>
      token.tokenSymbol.toLowerCase().includes(search.toLowerCase()) ||
      token.tokenName.toLowerCase().includes(search.toLowerCase()) ||
      token.contractId.toLowerCase().includes(search.toLowerCase())
  );

  async function getTokenBalance(accountId : any, tokenContractId : any,  tokenSym : any,) {
    try {
      // Call the ft_balance_of view function on the token contract.
      const balance = await wallet.viewMethod(
      {  contractId : tokenContractId,
        method :    "ft_balance_of",
        args: {
        account_id: accountId //`${accountId}.auto-claim-main.near` , // User account
    }
      },
      );
      
      if (tokenSym === "wNEAR"){
       // setFromToken(balance);
        setmainbal(tokenSym)
        setmainbal2(tokenContractId)
        // const gettokenout =  await wallet.getBalance(signedAccountId)
        // settoBal( parseFloat(gettokenout).toFixed(2))
        setFromToken(toHumanReadable(balance,"near" ))
      }else{
      //  setfromBal(toHumanReadable(gettokenin,"token" ))
      setmainbal2(tokenContractId)
      setmainbal(tokenSym)
        setFromToken(toHumanReadable(balance,"token" ))
      }
      // toHumanReadable()
      return balance;
    } catch (error) {
      console.error(`Error fetching balance for ${tokenContractId}:`, error);
      return "0";
    }
  }

  function toHumanReadable(amount : any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
  

    const amountStr = String(amount).padStart(power + 1, "0");
  

    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);
  

    const humanReadable = `${integerPart}.${fractionalPart}`;
  

    const formattedAmount = parseFloat(humanReadable).toFixed(2);
  
    return formattedAmount;
  }


  const handleChange = (e : any) => {
    const value = e.target.value;
    setAmount(value);
   
  };

  const isWithdrawDisabled =
  parseFloat(amount)  > parseFloat(fromToken) ||
  parseFloat(amount) === 0 ||
  parseFloat(fromToken) === 0 
  



  function toSmallestUnit(amount : any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;
  
    const amountStr = String(amount);
  
    const [integerPart, fractionalPart = ""] = amountStr.split(".");
  
    const paddedFractionalPart = fractionalPart.padEnd(power, "0");
  
    const smallestUnit = BigInt(integerPart + paddedFractionalPart);
  
    return smallestUnit.toString();
  }

  


  async function Withdraw (){
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    let tokenAmount

    if (tokensymbol === "wNEAR") {
       tokenAmount = toSmallestUnit(amount, "near")
    }else{
      tokenAmount = toSmallestUnit(amount, "token")
    }
  

    const transactions =[
        {
            receiverId: `${getuserdata.username}.auto-claim-main.near`,
            actions: [
            {
                type: "FunctionCall",
                params: {
                methodName: "withdraw_token", // Missing methodName
                args: {
                  token_id: tokenid,
                  receiver_id:  signedAccountId,
                    gassing : "50",
                    amount: tokenAmount
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


  return (
    <div>
      <div className="h-[15vh]">
        <Header />
      </div>
      {/* <div className="max-w-4xl mx-auto">
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full max-w-4xl"
        >
          <CarouselContent>
            {Array.from({ length: totalItems }).map((_, index) => (
              <CarouselItem
                key={index}
                className={`md:basis-[9rem] lg:basis-[9rem] ${
                  index >= currentIndex && index < currentIndex + itemsToShow
                    ? "block"
                    : "hidden"
                }`} // Show items based on current index
              >
                <div className="p-1">
                  <Card className="cursor-pointer hover:bg-gray-100">
                    <CardContent className="flex aspect-square items-center justify-center p-6">
                      <span className="text-3xl font-semibold">
                        {index + 1}
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div> */}
      <div className="sm:max-w-3xl max-w-sm mx-auto py-[3rem] bg-[#03080ae6]/30 mt-5">
        <div className="max-w-2xl mx-auto flex flex-col justify-center items-center">
          <p className="text-2xl font-bold text-white font-neuton">
            Withdraw your Earnings
          </p>
          <p className="text-white text-sm">
            Pick a token and then select the amount you want to withdraw.
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-4 my-5 items-center w-full max-w-2xl mx-auto">
            <div className="text-white flex-1">
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Token to withdraw" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Token to withdraw</SelectLabel>
                    {/* <SelectItem value="xRef">Stake xRef</SelectItem>
                    <SelectItem value="burrow">
                      Deposit into Burrow Pool
                    </SelectItem>
                    <SelectItem value="burrow">
                      Deposit into Burrow Pool
                    </SelectItem> */}
                      <div className="grid gap-4">
          <Input
            placeholder="Search by name or symbol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-[300px]">
            <div className="grid gap-2">
              {filteredTokens?.map((token) => (
                <Button
                  key={token.symbol}
                  variant="ghost"
                  className="w-full justify-start gap-12"
                  onClick={() => {
                    async function gettokbal() {
                      const getuserdata = await wallet.viewMethod({
                        contractId: "auto-claim-main.near",
                        method: "get_user",
                        args: {
                          wallet_id: signedAccountId,
                        },
                        gas: "300000000000000",
                        deposit: "0",
                      });
                      const accountId = `${getuserdata.username}.auto-claim-main.near`
                      getTokenBalance(accountId, token.contractId, token.tokenSymbol)
                      setOpen(false);
                      settoken2(token.tokenSymbol)
                    }
                  
                    gettokbal()
                  }}
                >
                  <img
                    src={token.icon || "/placeholder.svg"}
                    alt={token.tokenSymbol}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{token.tokenSymbol}</span>
                    <span className="text-xs text-muted-foreground">
                      {token.tokenName}
                    </span>
                  </div>
                  {token.price && (
                    <div className="ml-auto text-right">
                      <span className="text-sm font-medium">
                        ${token.price}
                      </span>
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="max-w-[20rem] w-full text-white bg-[#03080ae6]/70 py-2 text-center">
              <p className="text-sm">{token2} Balance</p>
              <p className="text-2xl font-bold">{fromToken}</p>
            </div>
          </div>
          <div className="flex gap-4 my-5 items-center max-w-2xl mx-auto">
            <Input onChange={handleChange}   value={amount} type="number" placeholder="0" className="w-full max-w-xl py-6 border-2 mx-auto text-white border-white rounded-md" />
          </div>
        </div>
        <div className="max-w-2xl flex mx-auto">
          <Button onClick={() => {
            Withdraw()
          }} disabled={isWithdrawDisabled} className="w-full max-w-xl mx-auto p-6 bg-green-500 text-white font-bold hover:bg-green-600">Withdraw</Button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;
