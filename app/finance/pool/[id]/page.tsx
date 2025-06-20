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
import { AddLiquidity } from "@/components/AddLiquidity";
import { TransferLp } from "@/components/TransferLp";
import { RemoveLiq } from "@/components/RemoveLiq";
import Header from "@/components/Header";
import { NearContext } from "@/wallets/near";

interface Pool {
  token_symbols: string[];
  token_account_ids: string[];
  tvl?: string;
  volume?: string;
  total_fee?: number;
  farm?: boolean;
  [key: string]: any;
  token0_ref_price: any;
}

interface FarmerSeeds {
  [key: string]: {
    free_amount: string;
    [key: string]: any;
  };
}

interface UserData {
  username: string;
  [key: string]: any;
}

const Page = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [showFarm, setShowFarm] = useState<string | null>(null);
  const [mainShare1, setMainShare1] = useState<string>("0");
  const [share1, setShare1] = useState<string>("0");
  const [share2, setShare2] = useState<string>("0");

  const router = useRouter();
  const params = useParams();

  const decodedId = decodeURIComponent(`${params.id}` || "");
  const [id, signed_AccountId] = decodedId.split("&");
  const [pool, setPool] = useState<Pool | null>(null);
  const [pool2, setPool2] = useState<any | null>(null);
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

  const fetchPoolById = async (id: string): Promise<void> => {
    if (!id) return;
    try {
      const res = await fetch(
        `https://api.ref.finance/list-pools-by-ids?ids=${id}`
      );
      const data: Pool[] = await res.json();
      console.log(data)
      setPool(data[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchPoolDetailsById = async (id: string): Promise<void> => {
    if (!id) return;
    try {
      const res = await fetch(
        `https://api.ref.finance/pool/detail?pool_id=${id}`
      );
      const data: any = await res.json();
      console.log(data)
      setPool2(data?.data);
    } catch (error) {
      console.log(error);
    }
  };




  useEffect(() => {
    fetchPoolById(id);
    fetchPoolDetailsById(id)
  }, [id]);

  function findPoolById2(data: FarmerSeeds, poolId: string): string | null {
    const poolKeyFragment = `@${poolId}`;
    for (const key in data) {
      if (key.includes(poolKeyFragment)) {
        return data[key].free_amount;
      }
    }
    return null;
  }

  let count = 0;
  async function checkShares(): Promise<void> {
    count++;
    try {
      const getUserData = await wallet.viewMethod<UserData>({
        contractId: "compoundx.near",
        method: "get_user",
        args: {
          wallet_id: signedAccountId,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const [mainShares, myShares, myShares2] = await Promise.all([
        wallet.viewMethod<string>({
          contractId: "v2.ref-finance.near",
          method: "get_pool_shares",
          args: {
            pool_id: parseInt(id),
            account_id: signedAccountId,
          },
        }),
        wallet.viewMethod<string>({
          contractId: "v2.ref-finance.near",
          method: "get_pool_shares",
          args: {
            pool_id: parseInt(id),
            account_id: `${getUserData.subaccount_id}`,
          },
        }),
        wallet.viewMethod<FarmerSeeds>({
          contractId: "boostfarm.ref-labs.near",
          method: "list_farmer_seeds",
          args: {
            farmer_id: `${getUserData.subaccount_id}`,
          },
        }),
      ]);

      const mySharesInt = parseInt(myShares) || 0;
      const myMainSharesInt = parseInt(mainShares) || 0;

      setShare1(mySharesInt.toString());
      setMainShare1(myMainSharesInt.toString());
      setShowFarm(myShares);

      let totalStakedTokens = "0";
      if (myShares2) {
        const poolData = findPoolById2(myShares2, id);
        totalStakedTokens = poolData ? poolData : "0";
      }

      setShare2(totalStakedTokens);
    } catch (err) {
      console.log("Error checking shares:", err);
    }
  }

  if (count < 2) {
    checkShares().catch((err) => {
      console.log("Checking...");
    });
  }

  return (
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
          {pool?.token_symbols?.[0]}-{pool?.token_symbols?.[1]}{" "}
          {pool?.farm && <span>Farms</span>}
        </p>
        
      
        <div>
          
         
        </div>
        
      </div>
      <p className="text-sm font w-[367]">
      Note : Each investment is tied to a subaccount account. Use a new account for each investment
        </p>
      <div className="flex max-w-3xl pt-6 flex-wrap">
        <div className="max-w-xl w-full mr-3">
          <div className="grid grid-cols-3 gap-2 bg-[#0c171f] p-3 rounded-md">
            <div>
              <p>TVL</p>
              <p>{formatCurrency(pool?.tvl)}</p>
            </div>
            <div>
              <p>Apy</p>
              <p>{parseFloat(pool2?.apy).toFixed(4)}%</p>
            </div>
            <div>
              <p>Fee </p>
              <p>{(pool?.total_fee ? pool.total_fee / 100 : 0).toFixed(2)}%</p>
            </div>
            <div className="w-[130px] text-white">
              <p className="font-semibold text-sm">Farm APY </p>
              <p className="font-semibold text-sm text-white">{parseFloat(pool2?.farm_apy).toFixed(4)}%</p>
            </div>
          </div>
          <div className="py-4">
            <p className="text-[#4f5f64] text-xl font-semibold py-4">
              Pool Composition
            </p>
            <div className="space-y-5 bg-[#0c171f] p-3 rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-[#4f5f64]">Pair</p>
                <p className="text-[#4f5f64]">24H Volume / Fee</p>
               
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p>{pool?.token_symbols?.[0]}</p>
                <p>{  formatCurrency(pool2?.volume_24h) }</p>

              </div>
              <div className="grid grid-cols-2 gap-2">
                <p>{pool?.token_symbols?.[1]}</p>
                <p>{parseFloat(pool2?.fee_volume_24h).toFixed(4)}%</p>
               
              </div>
            </div>
          </div>
        </div>
        <div>
          <Card style={{ backgroundColor: "#0c171f" }} className="w-[250px]">
            <CardHeader>
              <CardTitle style={{ color: "white" }}>Add Liquidity</CardTitle>
              <CardDescription>
                Head over to Rhea finance to Add liquidity by clicking the
                button below.
              </CardDescription>
            </CardHeader>

            <CardFooter className="flex justify-between">
              <Button
                className="w-full text-white p-3"
                style={{ backgroundColor: "black" }}
                onClick={() => {
                  router.push(`https://dex.rhea.finance/pool/${id}`);
                }}
              >
                <p>Add Liquidity</p>
              </Button>
            </CardFooter>
          </Card>

          {parseInt(mainShare1) > 0 && (
            <Card
              style={{ backgroundColor: "#0c171f" }}
              className="w-[250px] mt-8"
            >
              <CardHeader>
                <CardTitle style={{ color: "white" }}>
                  Transfer Lp tokens
                </CardTitle>
                <CardDescription>
                  In other to stake with subaccount, transfer Lp tokens to
                  subaccount
                </CardDescription>
              </CardHeader>

              <CardFooter className="flex justify-between">
                <TransferLp
                  poolType1={pool?.token_symbols?.[0] ?? ""}
                  poolType2={pool?.token_symbols?.[1] ?? ""}
                  poolTypeID1={pool?.token_account_ids?.[0] ?? ""}
                  poolTypeID2={pool?.token_account_ids?.[1] ?? ""}
                  Poolid={id}
                />
              </CardFooter>
            </Card>
          )}

          {parseInt(share1) > 0 && (
            <Card
              style={{ backgroundColor: "#0c171f" }}
              className="w-[250px] mt-8"
            >
              <CardHeader>
                <CardTitle style={{ color: "white" }}>
                  Remove Liquidity
                </CardTitle>
                <CardDescription>
                  Removing liquidty stops auto claim rewards
                </CardDescription>
              </CardHeader>

              <CardFooter className="flex justify-between">
                <RemoveLiq
                  poolType1={pool?.token_symbols?.[0] ?? ""}
                  poolType2={pool?.token_symbols?.[1] ?? ""}
                  poolTypeID1={pool?.token_account_ids?.[0] ?? ""}
                  poolTypeID2={pool?.token_account_ids?.[1] ?? ""}
                  sharez={showFarm ?? ""}
                  Poolid={id}
                />
              </CardFooter>
            </Card>
          )}

          {(parseInt(share1) > 0 || parseInt(share2) > 0) && (
            <div
              style={{ backgroundColor: "#0c171f" }}
              className="flex-col items-center w-[250px] bg-white p-4 rounded-md h-[100px] my-3"
            >
              <div className="w-[200px] items-center text-white">
                <p className="font-semibold text-sm">Stake and Earn! </p>
              </div>
              <div className="w-[150px] items-center mt-4 space-y-2 text-white">
                <Button
                  style={{ backgroundColor: "black" }}
                  className="w-full text-white p-3"
                  onClick={() => {
                    router.push(`/finance/farm/${id}&${signedAccountId}`);
                  }}
                >
                  <p>Farm Now!</p>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
