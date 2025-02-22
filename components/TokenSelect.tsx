"use client";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance?: string;
}

interface TokenSelectButtonProps {
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  tokens : any[]
}


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
        price: priceData[contractId] ? priceData[contractId].price : null
      };
    });

    return tokensArray;
  } catch (error) {
    console.error("Error fetching token data:", error);
    return [];
  }
}


// Example usage:


// Sample token list - in a real app, this would come from an API or contract
const token: Token[] = [
  {
    symbol: "NEAR",
    name: "NEAR Protocol",
    icon: "/placeholder.svg?height=32&width=32",
    balance: "100.00",
  },
  {
    symbol: "wNEAR",
    name: "Wrapped NEAR",
    icon: "/placeholder.svg?height=32&width=32",
    balance: "50.00",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    icon: "/placeholder.svg?height=32&width=32",
    balance: "1000.00",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "/placeholder.svg?height=32&width=32",
    balance: "1000.00",
  },
];

export function TokenSelectButton({
  selectedToken,
  onSelect,
  tokens 
}: TokenSelectButtonProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [token, settoken] = useState<any[]>([]);
  // const [tokens, settokens] = useState<any[]>([]);
  
  


  // useEffect(() => {

  //   fetchTokenData().then((tokens) => {
  //     console.log("Fetched tokens:", tokens);
  //     settoken(tokens)
  //   });
  
  // },[])
    useEffect(() => {

    fetchTokenData().then((tokens) => {
      console.log("Fetched tokens:", tokens);
      settoken(tokens)
    });
  
  },[])

  // fetchTokenData().then((tokens) => {
  //   console.log("Fetched tokens:", tokens);
  //   settoken(tokens)
  // });


  const filteredTokens = token?.filter(
    (token) =>
      token.tokenSymbol.toLowerCase().includes(search.toLowerCase()) ||
      token.tokenName.toLowerCase().includes(search.toLowerCase()) ||
      token.contractId.toLowerCase().includes(search.toLowerCase())
  );

  // fetchTokenData().then((tokens) => {
  //   console.log("Fetched tokens:", tokens);
  // });

  // console.log("Fetched:", tokens);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-3 hover:bg-muted"
        >
          {selectedToken ? (
            <>
              <img
                src={selectedToken.icon || "/placeholder.svg"}
                alt={selectedToken.symbol}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span>{selectedToken.symbol}</span>
            </>
          ) : (
            "Select Token"
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>
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
                    onSelect(token);
                    setOpen(false);
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
      </DialogContent>
    </Dialog>
  );
}



// "use client";
// import Image from "next/image";
// import { ChevronDown } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { useState } from "react";

// interface Token {
//   symbol: string;
//   name: string;
//   icon: string;
//   balance?: string;
// }

// interface TokenSelectButtonProps {
//   selectedToken: Token | null;
//   onSelect: (token: Token) => void;
// }

// // Sample token list - in a real app, this would come from an API or contract
// const tokens: Token[] = [
//   {
//     symbol: "NEAR",
//     name: "NEAR Protocol",
//     icon: "/placeholder.svg?height=32&width=32",
//     balance: "100.00",
//   },
//   {
//     symbol: "wNEAR",
//     name: "Wrapped NEAR",
//     icon: "/placeholder.svg?height=32&width=32",
//     balance: "50.00",
//   },
//   {
//     symbol: "USDT",
//     name: "Tether USD",
//     icon: "/placeholder.svg?height=32&width=32",
//     balance: "1000.00",
//   },
//   {
//     symbol: "USDC",
//     name: "USD Coin",
//     icon: "/placeholder.svg?height=32&width=32",
//     balance: "1000.00",
//   },
// ];

// export function TokenSelectButton({
//   selectedToken,
//   onSelect,
// }: TokenSelectButtonProps) {
//   const [search, setSearch] = useState("");
//   const [open, setOpen] = useState(false);

//   const filteredTokens = tokens.filter(
//     (token) =>
//       token.symbol.toLowerCase().includes(search.toLowerCase()) ||
//       token.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button
//           variant="outline"
//           className="flex items-center gap-2 px-3 hover:bg-muted"
//         >
//           {selectedToken ? (
//             <>
//               <Image
//                 src={selectedToken.icon || "/placeholder.svg"}
//                 alt={selectedToken.symbol}
//                 width={24}
//                 height={24}
//                 className="rounded-full"
//               />
//               <span>{selectedToken.symbol}</span>
//             </>
//           ) : (
//             "Select Token"
//           )}
//           <ChevronDown className="h-4 w-4 opacity-50" />
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Select a token</DialogTitle>
//         </DialogHeader>
//         <div className="grid gap-4">
//           <Input
//             placeholder="Search by name or symbol"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <ScrollArea className="h-[300px]">
//             <div className="grid gap-2">
//               {filteredTokens.map((token) => (
//                 <Button
//                   key={token.symbol}
//                   variant="ghost"
//                   className="w-full justify-start gap-2"
//                   onClick={() => {
//                     onSelect(token);
//                     setOpen(false);
//                   }}
//                 >
//                   <Image
//                     src={token.icon || "/placeholder.svg"}
//                     alt={token.symbol}
//                     width={32}
//                     height={32}
//                     className="rounded-full"
//                   />
//                   <div className="flex flex-col items-start">
//                     <span className="text-sm font-medium">{token.symbol}</span>
//                     <span className="text-xs text-muted-foreground">
//                       {token.name}
//                     </span>
//                   </div>
//                   {token.balance && (
//                     <div className="ml-auto text-right">
//                       <span className="text-sm font-medium">
//                         {token.balance}
//                       </span>
//                     </div>
//                   )}
//                 </Button>
//               ))}
//             </div>
//           </ScrollArea>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
