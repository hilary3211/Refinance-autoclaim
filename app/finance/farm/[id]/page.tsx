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
const page = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const params = useParams();
  const id = params.id as string;
  const [pool, setPool] = useState<any>(null);
  const [showStake, setshowstake] = useState<any>(null);
  const [pool2, setPool2] = useState<any>(null);

  const [share1, setshare1] = useState<any>(null);
  const [share2, setshare2] = useState<any>(null);

  const fetchPoolById = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(
        `https://api.ref.finance/list-pools-by-ids?ids=${id}`
      );
      const data = await res.json();
      data[0];
      setPool(data[0]);
    } catch (error) {
      console.log(error);
    }
  };

  function findPoolById(data: any, poolId: any) {
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

  async function checkshares() {
    count++;
    const getuserdata = await wallet.viewMethod({
      contractId: "auto-claim-main.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    const myshares = await wallet.viewMethod({
      contractId: "v2.ref-finance.near",
      method: "get_pool_shares",
      args: {
        pool_id: 79, // Pool ID
        account_id: `${getuserdata.username}.auto-claim-main.near`,
      },
    });

    // setshare1(myshares)
    const myshares2 = await wallet.viewMethod({
      contractId: "boostfarm.ref-labs.near",
      method: "list_farmer_seeds",
      args: {
        farmer_id: `${getuserdata.username}.auto-claim-main.near`, // Pool ID
      },
    });

    const mysharesInt = parseInt(myshares);
    const Totalstakedtokens = findPoolById(myshares2, id);

    const isStakeValid =
      mysharesInt > 0 ||
      (Totalstakedtokens !== null && parseInt(Totalstakedtokens) > 0);

    setshowstake(isStakeValid);

    if (mysharesInt > 0) {
      setshare1(myshares);
    } else {
      setshare1("0");
    }

    if (Totalstakedtokens !== null && parseInt(Totalstakedtokens) > 0) {
      setshare2(Totalstakedtokens);
    } else {
      setshare2("0");
    }
  }
  if (count < 2) {
    checkshares().catch((err) => {});
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
          {pool?.token_symbols[0]}-{pool?.token_symbols[1]}{" "}
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
                  poolTypeID1={pool?.token_account_ids[0]}
                  poolTypeID2={pool?.token_account_ids[1]}
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

export default page;
