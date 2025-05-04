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
import { useParams } from "next/navigation";
import { AddLiquidity } from "@/components/AddLiquidity";
import { Stake } from "@/components/Stake";
import { NearContext } from "@/wallets/near";
import Header from "@/components/Header";

interface Pool {
  token_symbols: string[];
  token_account_ids: string[];
  farm?: boolean;
  [key: string]: any;
}

interface FarmerSeeds {
  [key: string]: {
    free_amount: string;
    [key: string]: any;
  };
}

const Page = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const params = useParams();
  const id = params.id as string;
  const [pool, setPool] = useState<Pool | null>(null);
  const [showStake, setShowStake] = useState<boolean | null>(null);
  const [pool2, setPool2] = useState<any>(null); // Couldn't determine type from usage
  const [share1, setShare1] = useState<string>("0");
  const [share2, setShare2] = useState<string>("0");

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

  function findPoolById(data: FarmerSeeds, poolId: string): string | null {
    const poolKeyFragment = `@${poolId}`;
    for (const key in data) {
      if (key.includes(poolKeyFragment)) {
        return data[key].free_amount;
      }
    }
    return null;
  }

  let count = 0;
  useEffect(() => {
    fetchPoolById(id);
  }, [pool2]);

  async function checkShares(): Promise<void> {
    count++;
    try {
      const getUserData = await wallet.viewMethod<{ username: string }>({
        contractId: "compoundx.near",
        method: "get_user",
        args: {
          wallet_id: signedAccountId,
        },
        gas: "300000000000000",
        deposit: "0",
      });

      const myShares = await wallet.viewMethod<string>({
        contractId: "v2.ref-finance.near",
        method: "get_pool_shares",
        args: {
          pool_id: 79, // Pool ID
          account_id: `${getUserData.subaccount_id}`,
        },
      });

      const myShares2 = await wallet.viewMethod<FarmerSeeds>({
        contractId: "boostfarm.ref-labs.near",
        method: "list_farmer_seeds",
        args: {
          farmer_id: `${getUserData.subaccount_id}`, // Pool ID
        },
      });

      const mySharesInt = parseInt(myShares);
      const totalStakedTokens = findPoolById(myShares2, id);

      const isStakeValid =
        mySharesInt > 0 ||
        (totalStakedTokens !== null && parseInt(totalStakedTokens) > 0);

      setShowStake(isStakeValid);

      setShare1(mySharesInt > 0 ? myShares : "0");
      setShare2(
        totalStakedTokens !== null && parseInt(totalStakedTokens) > 0
          ? totalStakedTokens
          : "0"
      );
    } catch (err) {
      console.error("Error checking shares:", err);
    }
  }

  if (count < 2) {
    checkShares().catch((err) => {
      console.error("Error in checkShares:", err);
    });
  }

  return (
    <div className="text-white max-w-4xl mx-auto p-7">
      <div className="h-[20vh]">
        <Header />
      </div>
      <Link href={`/finance/pool/${id}`} className="text-sm font-semibold">
        {"< Farms"}
      </Link>
      <div className="flex justify-between max-w-xl py-3 items-center">
        <p className="text-3xl font-semibold">
          {pool?.token_symbols?.[0]}-{pool?.token_symbols?.[1]}{" "}
          {pool?.farm && <span>Farms</span>}
        </p>
        <div>
          <p className=" text-[#4f5f64]">Fee</p>
          <p className="font-semibold">0.30%</p>
        </div>
        <div>
          <p className=" text-[#4f5f64]">Current Price</p>
          <p className="font-semibold">1 USDC = 1 NEAR</p>
        </div>
      </div>
      <div className="flex max-w-3xl pt-6 ">
        <div className="max-w-xl w-full mr-3 space-y-4">
          <div className=" bg-[#0c171f] p-3 rounded-md">
            <div className="space-y-3 p-4">
              <p className="text-sm text-[#4f5f64]">Total Lp shares</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
            <div className="flex justify-between max-w-sm p-4">
              <div className="space-y-3">
                <p className="text-sm text-[#4f5f64]">Staked Share</p>
                <p className="text-2xl font-semibold">$0</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-[#4f5f64]">Unstaked Share</p>
                <p className="text-2xl font-semibold">0%</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          {showStake ? (
            <Card className="w-[250px]">
              <CardHeader>
                <CardTitle>Staking pool</CardTitle>
                <CardDescription>
                  Click the button below to start staking
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between">
                <Stake
                  poolType1={share1}
                  poolType2={share2}
                  poolTypeID1={pool?.token_account_ids?.[0] ?? ""}
                  poolTypeID2={pool?.token_account_ids?.[1] ?? ""}
                  Poolid={id}
                />
              </CardFooter>
            </Card>
          ) : (
            <Card className="w-[250px]">
              <CardHeader>
                <CardTitle>Add Liquidity</CardTitle>
                <CardDescription>
                  Add liquidity to the pool to open staking pool
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between"></CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
