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
  const id = params.id as string;
  const [pool, setPool] = useState<Pool | null>(null);

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
      setPool(data[0]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPoolById(id);
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
          <p className=" text-[#4f5f64]">Fee</p>
          <p className="font-semibold">
            {" "}
            {(pool?.total_fee ? pool.total_fee / 100 : 0).toFixed(2)}%
          </p>
        </div>
        <div>
          <p className=" text-[#4f5f64]">Current Price</p>
          <p className="font-semibold">1 USDC = 1 NEAR</p>
        </div>
      </div>
      <div className="flex max-w-3xl pt-6 flex-wrap">
        <div className="max-w-xl w-full mr-3">
          <div className="grid grid-cols-3 gap-2 bg-[#0c171f] p-3 rounded-md">
            <div>
              <p>TVL</p>
              <p>{formatCurrency(pool?.tvl)}</p>
            </div>
            <div>
              <p>Volume</p>
              <p>{formatCurrency(pool?.volume)}</p>
            </div>
            <div>
              <p>Fee </p>
              <p>{(pool?.total_fee ? pool.total_fee / 100 : 0).toFixed(2)}%</p>
            </div>
          </div>
          <div className="py-4">
            <p className="text-[#4f5f64] text-xl font-semibold py-4">
              Pool Composition
            </p>
            <div className="space-y-5 bg-[#0c171f] p-3 rounded-md">
              <div className="grid grid-cols-3 gap-2">
                <p className="text-[#4f5f64]">Pair</p>
                <p className="text-[#4f5f64]">Amount</p>
                <p className="text-[#4f5f64]">Value</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <p>{pool?.token_symbols?.[0]}</p>
                <p>100%</p>
                <p>100%</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <p>{pool?.token_symbols?.[1]}</p>
                <p>0%</p>
                <p>0%</p>
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
                  Removing liquidty stops auto cliam rewards
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
              className="flex items-center w-[250px] bg-white p-4 rounded-md h-[100px] my-3"
            >
              <div className="w-[100px] text-white">
                <p className="font-semibold text-sm">Farm APR</p>
                <p className="text-sm">12.87%</p>
              </div>
              <div className="w-[150px] space-y-2 text-white">
                <p className="font-semibold text-sm text-white">$2.26k/week</p>
                <Button
                  style={{ backgroundColor: "black" }}
                  className="w-full text-white p-3"
                  onClick={() => {
                    router.push(`/finance/farm/${id}`);
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
