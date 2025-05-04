"use client";

import { RepeatIcon, RocketIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Pools from "@/components/Pools";
import Pools2 from "@/components/Pools2";
import Swap from "@/components/Swap";
import { SwapCard } from "@/components/SwapCard";
import React, { useEffect, useState, useRef, useContext } from "react";
import { CreateDialog } from "@/components/CreateDialog";
import { Grid } from "react-loader-spinner";
import { NearContext } from "@/wallets/near";

const Finance: React.FC = () => {
  const [isregistered, setisregistered] = useState<boolean>(true);
  const { signedAccountId, wallet } = useContext(NearContext);
  const [loading, setLoading] = useState<boolean>(true);

  let count = 0;

  async function getdata(): Promise<void> {
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

   

    if (getUserData !== null) {
      try {
        const getuserbalance = await wallet.viewMethod({
          contractId: `${getUserData.subaccount_id}`,
          method: "get_contract_balance",
          args: {},
        });
        console.log("Balance:", getuserbalance);
      } catch (error: any) {
        if (error.message.includes("doesn't exist")) {
          const response = await fetch(
            "https://us-central1-almond-1b205.cloudfunctions.net/claimauto/createAccount",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: signedAccountId }),
            }
          );
          const apiResult = await response.json();
          console.log("Account creation result:", apiResult);
          setLoading(false);
        } else {
          setisregistered(false);
          setLoading(false);
        }
      } finally {
        setisregistered(false);
        setLoading(false);
      }
    } else {
      setisregistered(true);
      setLoading(false);
    }
  }

  if (count < 2) {
    getdata().catch((err) => {});
  }

  return (
    <div>
      {loading ? (
        <div
          style={{ background: "transperent" }}
          className="flex flex-col items-center justify-center min-h-screen bg-darkBlue text-white"
        >
          <div className="h-[0vh]">
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
        <>
          <div className="h-[20vh]">
            <Header />
          </div>
          {isregistered ? (
            <div className="flex flex-col items-center justify-center text-white text-center">
              <p className="mb-4 text-lg font-medium max-w-sm sm: max-w-3xl">
                To continue, please click the button below to create your
                subaccount.
              </p>
              <CreateDialog />
            </div>
          ) : (
            <Tabs defaultValue="Pools" className="w-full">
              <TabsList
                style={{ backgroundColor: "#0c171f" }}
                className="grid sm:max-w-xl max-w-sm mx-auto grid-cols-3 my-1 bg-grey-500"
              >
                <TabsTrigger value="Pools" className="space-x-2">
                  <RocketIcon className="w-4 h-4" />
                  <p>Pools</p>
                </TabsTrigger>
                <TabsTrigger value="swap">
                  <RepeatIcon className="w-4 h-4" />
                  <p>Swap</p>
                </TabsTrigger>
                <TabsTrigger value="pools2">
                  <RocketIcon className="w-4 h-4" />
                  <p>Burrow Pool</p>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="Pools">
                <Pools />
              </TabsContent>
              <TabsContent value="pools2">
                <Pools2 />
              </TabsContent>
              <TabsContent value="swap">
                <SwapCard />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default Finance;
