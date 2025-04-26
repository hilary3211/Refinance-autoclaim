"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { Burrow } from "@/components/Burrow";
import { RemoveLiq } from "@/components/RemoveLiq";
import { Grid } from "react-loader-spinner";
import Header from "@/components/Header";
import { NearContext } from "@/wallets/near";

interface TokenData {
  token_id: string;
  token_name?: string;
  supplied?: {
    balance: string;
  };
  borrowed?: {
    balance: string;
  };
  farms?: Farm[];
}

interface Farm {
  rewards: Record<string, any>;
}

const page = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<TokenData | null>(null);
  const [tokenId, tokenName] = id.split("AND");

  const formatCurrency = (value: any): string => {
    const numericValue = Number(value);

    if (isNaN(numericValue)) {
      return "$0.00";
    }

    if (numericValue >= 1_000_000) {
      return `$${(numericValue / 1_000_000).toFixed(2)}M`;
    } else if (numericValue >= 1_000) {
      return `$${(numericValue / 1_000).toFixed(2)}K`;
    } else {
      return `$${numericValue.toFixed(2)}`;
    }
  };

  async function PoolData(): Promise<TokenData | null> {
    // Retrieve token data from the contract's view method.
    const getPoolData: TokenData[] = await wallet.viewMethod({
      contractId: "contract.main.burrow.near",
      method: "get_assets_paged_detailed",
      args: {},
    });

    // Find the token with a matching token_id.
    const matchingToken = getPoolData.find(
      (token) => token.token_id === tokenId
    );

    if (matchingToken) {
      // If token_name is not present, attach the tokenName from the URL.
      if (!matchingToken.token_name) {
        matchingToken.token_name = tokenName;
      }
      // Update state with the matching token.
      setData(matchingToken);
      setLoading(false);
    }

    return matchingToken || null;
  }

  useEffect(() => {
    PoolData();
  }, []);

  function formatSuppliedAmount(amount: string): string {
    if (!amount) return "0";
    
    const num = BigInt(amount);

    // Define thresholds:
    const millionThreshold = BigInt("1000000000000000000000000"); // 1e24
    const thousandThreshold = BigInt("1000000000000000000000"); // 1e21
    const hundredThreshold = BigInt("1000000000000000000"); // 1e18

    // Helper to format a number using a given divisor and suffix.
    function formatWithDivisor(divisor: bigint, suffix: string): string {
      const wholePart = num / divisor;
      const remainder = num % divisor;
      // Calculate two decimal places.
      const decimals = (remainder * BigInt(100)) / divisor;
      return `${wholePart.toString()}.${decimals
        .toString()
        .padStart(2, "0")}${suffix}`;
    }

    if (num >= millionThreshold) {
      return formatWithDivisor(millionThreshold, "M");
    } else if (num >= thousandThreshold) {
      return formatWithDivisor(thousandThreshold, "K");
    } else if (num >= hundredThreshold) {
      return formatWithDivisor(hundredThreshold, "H");
    } else {
      return num.toString();
    }
  }

  return (
    <>
      {loading ? (
        <div
          style={{ background: "transperent" }}
          className="flex flex-col items-center justify-center  bg-darkBlue text-white"
        >
          <div className="h-[40vh]">
            <Header />
          </div>
          <Grid
            visible={true}
            height="80"
            width="80"
            color="#4fa94d"
            ariaLabel="grid-loading"
            radius="12.5"
            wrapperStyle={{}}
            wrapperClass="grid-wrapper"
          />
        </div>
      ) : (
        <div className="text-white max-w-4xl mx-auto p-7">
          <div className="h-[20vh]">
            <Header />
          </div>
          <Link
            href="/finance
      "
            className="text-xl font-semibold"
          >
            {"< Pools"}
          </Link>
          <div className="flex justify-between max-w-xl py-3 items-center">
            <p className="text-3xl font-semibold">
              {tokenName}
              {/* {pool?.farm && <span>Farms</span>} */}
            </p>
            {/* <div>
          <p className=" text-[#4f5f64]">Fee</p>
          <p className="font-semibold">
            {" "}
            {(pool?.total_fee / 100).toFixed(2)}%
          </p>
        </div>
        <div>
          <p className=" text-[#4f5f64]">Current Price</p>
          <p className="font-semibold">1 USDC = 1 NEAR</p>
        </div> */}
          </div>
          <div className="flex max-w-3xl pt-6 flex-wrap">
            <div className="max-w-xl w-full mr-3 mb-10">
              {data?.token_id && (
                <div className="grid grid-cols-3 gap-2 bg-[#0c171f] p-3 rounded-md">
                  <div>
                    <p>Total Supplied</p>
                    <p>{formatSuppliedAmount(data?.supplied?.balance || "0")}</p>
                  </div>
                  <div>
                    <p>Total Borrowed</p>
                    <p>{formatSuppliedAmount(data?.borrowed?.balance || "0")}</p>
                  </div>
                  <div>
                    <p>Total Liquidity</p>
                    <p>
                      {formatSuppliedAmount(
                        (BigInt(data?.supplied?.balance || "0") -
                          BigInt(data?.borrowed?.balance || "0")).toString()
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Card className="w-[250px]">
                <CardHeader>
                  <CardTitle>Deposit Into Burrow pool</CardTitle>
                  <CardDescription>
                    CLick the button below to add token into burrow pool and
                    earn rewards
                  </CardDescription>
                </CardHeader>

                <CardFooter className="flex justify-between">
                  <Burrow tokenId={tokenId} tokenName={tokenName} Data={data} />
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default page;



// "use client";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { useState, useEffect, useContext } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Burrow } from "@/components/Burrow";
// import { RemoveLiq } from "@/components/RemoveLiq";
// import { Grid } from "react-loader-spinner";
// import Header from "@/components/Header";
// import { NearContext } from "@/wallets/near";
// const page = () => {
//   const { signedAccountId, wallet } = useContext(NearContext);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();
//   const params = useParams();
//   const id = params.id as string;


//   const [data, setdata] = useState<any>([]);
//   const [tokenId, tokenName] = id.split("AND");

//   const formatCurrency = (value: any): string => {
//     const numericValue = Number(value);

//     if (isNaN(numericValue)) {
//       return "$0.00";
//     }

//     if (numericValue >= 1_000_000) {
//       return `$${(numericValue / 1_000_000).toFixed(2)}M`;
//     } else if (numericValue >= 1_000) {
//       return `$${(numericValue / 1_000).toFixed(2)}K`;
//     } else {
//       return `$${numericValue.toFixed(2)}`;
//     }
//   };


//   interface Pool {
//     pool_kind: string;
//     token_account_ids: string[];
//     amounts: string[];
//     total_fee: number;
//     shares_total_supply: string;
//     amp: number;
//     farming: boolean;
//     token_symbols: string[];
//     update_time: number;
//     id: string;
//     tvl: string;
//     token0_ref_price: string;
//   }

//   interface Farm {
//     rewards: Record<string, any>;
//   }

//   interface Token {
//     token_id: string;
//     token_name?: string;
//     farms?: Farm[];
//   }

//   async function PoolData(): Promise<Token | null> {
//     // Retrieve token data from the contract's view method.
//     const getPoolData: Token[] = await wallet.viewMethod({
//       contractId: "contract.main.burrow.near",
//       method: "get_assets_paged_detailed",
//       args: {},
//     });

//     // Find the token with a matching token_id.
//     const matchingToken = getPoolData.find(
//       (token) => token.token_id === tokenId
//     );

//     if (matchingToken) {
//       // If token_name is not present, attach the tokenName from the URL.
//       if (!matchingToken.token_name) {
//         matchingToken.token_name = tokenName;
//       }
//       // Update state with the matching token.
//       setdata(matchingToken);
//       setLoading(false);
//     }

//     return matchingToken || null;
//   }

//   useEffect(() => {
//     PoolData();
//   }, []);

//   function formatSuppliedAmount(amount: string): string {
//     const num = BigInt(amount);

//     // Define thresholds:
//     const millionThreshold = BigInt("1000000000000000000000000"); // 1e24
//     const thousandThreshold = BigInt("1000000000000000000000"); // 1e21
//     const hundredThreshold = BigInt("1000000000000000000"); // 1e18

//     // Helper to format a number using a given divisor and suffix.
//     function formatWithDivisor(divisor: bigint, suffix: string): string {
//       const wholePart = num / divisor;
//       const remainder = num % divisor;
//       // Calculate two decimal places.
//       const decimals = (remainder * BigInt(100)) / divisor;
//       return `${wholePart.toString()}.${decimals
//         .toString()
//         .padStart(2, "0")}${suffix}`;
//     }

//     if (num >= millionThreshold) {
//       return formatWithDivisor(millionThreshold, "M");
//     } else if (num >= thousandThreshold) {
//       return formatWithDivisor(thousandThreshold, "K");
//     } else if (num >= hundredThreshold) {
//       return formatWithDivisor(hundredThreshold, "H");
//     } else {
//       return num.toString();
//     }
//   }

//   return (
//     <>
//       {loading ? (
//         <div
//           style={{ background: "transperent" }}
//           className="flex flex-col items-center justify-center  bg-darkBlue text-white"
//         >
//           <div className="h-[40vh]">
//             <Header />
//           </div>
//           <Grid
//             visible={true}
//             height="80"
//             width="80"
//             color="#4fa94d"
//             ariaLabel="grid-loading"
//             radius="12.5"
//             wrapperStyle={{}}
//             wrapperClass="grid-wrapper"
//           />
//         </div>
//       ) : (
//         <div className="text-white max-w-4xl mx-auto p-7">
//           <div className="h-[20vh]">
//             <Header />
//           </div>
//           <Link
//             href="/finance
//       "
//             className="text-xl font-semibold"
//           >
//             {"< Pools"}
//           </Link>
//           <div className="flex justify-between max-w-xl py-3 items-center">
//             <p className="text-3xl font-semibold">
//               {tokenName}
//               {/* {pool?.farm && <span>Farms</span>} */}
//             </p>
//             {/* <div>
//           <p className=" text-[#4f5f64]">Fee</p>
//           <p className="font-semibold">
//             {" "}
//             {(pool?.total_fee / 100).toFixed(2)}%
//           </p>
//         </div>
//         <div>
//           <p className=" text-[#4f5f64]">Current Price</p>
//           <p className="font-semibold">1 USDC = 1 NEAR</p>
//         </div> */}
//           </div>
//           <div className="flex max-w-3xl pt-6 flex-wrap">
//             <div className="max-w-xl w-full mr-3 mb-10">
//               {data.token_id && (
//                 <div className="grid grid-cols-3 gap-2 bg-[#0c171f] p-3 rounded-md">
//                   <div>
//                     <p>Total Supplied</p>
//                     <p>{formatSuppliedAmount(data?.supplied?.balance)}</p>
//                   </div>
//                   <div>
//                     <p>Total Borrowed</p>
//                     <p>{formatSuppliedAmount(data?.borrowed?.balance)}</p>
//                   </div>
//                   <div>
//                     <p>Total Liquidity</p>
//                     <p>
//                       {formatSuppliedAmount(
//                         parseInt(data?.supplied?.balance) -
//                           parseInt(data?.borrowed?.balance)
//                       )}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>
//             <div>
//               <Card className="w-[250px]">
//                 <CardHeader>
//                   <CardTitle>Deposit Into Burrow pool</CardTitle>
//                   <CardDescription>
//                     CLick the button below to add token into burrow pool and
//                     earn rewards
//                   </CardDescription>
//                 </CardHeader>

//                 <CardFooter className="flex justify-between">
//                   <Burrow tokenId={tokenId} tokenName={tokenName} Data={data} />
//                 </CardFooter>
//               </Card>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default page;
