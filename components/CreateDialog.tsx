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
import { CirclePlusIcon } from "lucide-react";
import { useState, useContext } from "react";
import { NearContext } from "@/wallets/near";
import { Grid } from "react-loader-spinner";
import Header from "@/components/Header";

export function CreateDialog() {
  const [open, setOpen] = useState(false);
  const { signedAccountId, wallet } = useContext(NearContext);
  const [loading, setLoading] = useState(false);

  // function convertNearFormat(username: string) {
  //   return username.replace(/\.near\b/g, "-near").replace(/\.tg\b/g, "-tg");
  // }

  function convertNearFormat(username: string) {
    return username ? username.replace(/\./g, '-') : '';
  }
  
  async function Createaccount(username: string) {
    try {
      const getUserData = await wallet.viewMethod({
        contractId: "compoundx.near",
        method: "get_user",
        args: { wallet_id: signedAccountId },
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
                body: JSON.stringify({
                  username:username ,
             
                }),
              }
            );
            const apiResult = await response.json();
            console.log("Account creation result:", apiResult);
          } else {
            console.log("done");
          }
        }
      } else {
        const transactions = [
          {
            receiverId: "compoundx.near",
            actions: [
              // {
              //   type: "Transfer",
              //   params: { deposit: "2000000000000000000000000" },
              // },
              {
                type: "FunctionCall",
                params: {
                  methodName: "store_user",
                  args: {
                    subaccount_id: `${convertNearFormat(
                      signedAccountId
                    )}.compoundx.near`,
                  },
                  gas: "30000000000000",
                  deposit: "2000000000000000000000000",
                },
              },
            ],
          },
        ];

        const maketrans = await wallet.signAndSendTransactions({
          transactions,
        });
        console.log("Transaction result:", maketrans);
      }
    } catch (error) {
      console.error("Error in createAccount:", error);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (signedAccountId) {
        await Createaccount(signedAccountId);
        setOpen(false);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <div
          style={{ background: "transperent" }}
          className="flex flex-col items-center justify-center bg-darkBlue text-white"
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
            wrapperClass="grid-wrapper"
          />
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <CirclePlusIcon className="w-5 h-5 text-green-500 cursor-pointer hover:text-green-600" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Subaccount</DialogTitle>
                <DialogDescription>
                  Welcome to the CompoundX auto claim. To continue, you are
                  required to create a subaccount which would cost you 2 NEAR
                  tokens. Click the button below to proceed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="submit">Create Account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
