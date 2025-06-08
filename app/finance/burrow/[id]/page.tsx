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
import { Withdrawburrow } from "@/components/Withdrawburrow";
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
  const [apydata, setapydata] = useState<any>();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<TokenData | null>(null);
  const [userdata, setuserdata] = useState<any>();
  const decoded = decodeURIComponent(id);
  const values = decoded.split("&").map((pair) => pair.split("=")[1]);
  const [tokenId, tokenName, apy, yearly, signerid] = values;
  const [dec, setdec] = useState<any>();
  const [showdepo, setshowdepo] = useState<any>(true);

  function formatRewards(apy: any, yearly: any) {
    const apyValue = parseFloat(apy);
    const yearlyValue = parseFloat(yearly);

    const saneAPY = apyValue > 1000000 ? apyValue / 1000000 : apyValue;

    return {
      apy1:
        Math.min(saneAPY, 10000).toLocaleString("en", {
          maximumFractionDigits: 2,
        }) + "%",
      yearly1:
        yearlyValue > 1000
          ? (yearlyValue / 1000).toLocaleString("en", {
              maximumFractionDigits: 2,
            }) + "K"
          : yearlyValue.toFixed(2),
    };
  }

  const { apy1, yearly1 } = formatRewards(apy, yearly);

  function getCollateralAndRewards(data: any, tokenId: string) {
    const collateral = data.collateral.find(
      (item: any) => item.token_id === tokenId
    );

    const collateral2 = data.collateral.find(
      (item: any) => item.token_id === "wrap.near"
    );
    const collateralBalance = collateral ? collateral.balance : 0;

    const collateralBalance2 = collateral2 ? collateral2.balance : 0;

    const farm = data.farms.find(
      (farm: any) =>
        farm.farm_id.Supplied === tokenId ||
        farm.farm_id.TokenNetBalance === tokenId
    );
    const unclaimedAmount =
      farm && farm.rewards.length > 0 ? farm.rewards[0].unclaimed_amount : 0;

    return {
      collateralBalance,
      collateralBalance2,
      unclaimedAmount,
    };
  }

  function toHumanReadable(
    amount: string,
    tokenType: "token" | "near" = "token"
  ): string {
    const power = tokenType.toLowerCase() === "near" ? 24 : dec;
    const amountStr = String(amount).padStart(power + 1, "0");
    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);
    const humanReadable = `${integerPart}.${fractionalPart}`;

    if (/^0\.0+$/.test(humanReadable)) {
      return "0";
    } else {
      return humanReadable;
    }
  }

  function toHumanReadable2(amount: string, tokenType = "token", dec = 8) {
    let humanReadable: string;
    const paddedAmount = amount.padStart(dec + 1, "0");
    const integerPart = paddedAmount.slice(0, -dec) || "0";
    const fractionalPart = paddedAmount.slice(-dec);
    humanReadable = `${integerPart}.${fractionalPart}`;

    return parseFloat(humanReadable);
  }

  async function PoolData(): Promise<TokenData | null> {
    const getPoolData: TokenData[] = await wallet.viewMethod({
      contractId: "contract.main.burrow.near",
      method: "get_assets_paged_detailed",
      args: {},
    });
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: { wallet_id: signerid },
      gas: "300000000000000",
      deposit: "0",
    });

    const getbal = await wallet.viewMethod({
      contractId: "contract.main.burrow.near",
      method: "get_account",
      args: { account_id: `${getUserData.subaccount_id}` },
    });

    let getbals: any;
    if (getbal === null) {
      getbals = {
        collateralBalance: 0,
        unclaimedAmount: 0,
      };
    } else {
      getbals = getCollateralAndRewards(getbal, tokenId);
    }

    if (getbals?.collateralBalance > 0) {
      setshowdepo(false);
    } else {
      setshowdepo(true);
    }
    setuserdata(getbals);

    const getbal4 = await wallet.viewMethod({
      contractId: tokenId,
      method: "ft_metadata",
      args: {},
    });
    setdec(getbal4.decimals);

    const matchingToken = getPoolData.find(
      (token) => token.token_id === tokenId
    );

    if (matchingToken) {
      if (!matchingToken.token_name) {
        matchingToken.token_name = tokenName;
      }

      setData(matchingToken);
    }

    return matchingToken || null;
  }

  useEffect(() => {
    PoolData();
    fetchAPYData();
  }, []);

  function formatSuppliedAmount(amount: string): string {
    if (!amount) return "0";

    const num = BigInt(amount);

    const millionThreshold = BigInt("1000000000000000000000000");
    const thousandThreshold = BigInt("1000000000000000000000");
    const hundredThreshold = BigInt("1000000000000000000");

    function formatWithDivisor(divisor: bigint, suffix: string): string {
      const wholePart = num / divisor;
      const remainder = num % divisor;

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

  async function fetchAPYData() {
    try {
      const response = await fetch(
        "https://us-central1-almond-1b205.cloudfunctions.net/claimauto/getAPY",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tokenId: tokenId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setapydata(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching APY data:", error);
      throw error;
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
            <p className="text-3xl font-semibold">{tokenName}</p>
          </div>
          <div className="flex max-w-3xl pt-6 flex-wrap">
            <div className="max-w-xl w-full mr-3 mb-10">
              {data?.token_id && (
                <div className="grid grid-cols-3 gap-2 bg-[#0c171f] p-3 rounded-md">
                  <div>
                    <p>Total Supplied</p>
                    <p>
                      {formatSuppliedAmount(data?.supplied?.balance || "0")}
                    </p>
                  </div>
                  <div>
                    <p>Total Borrowed</p>
                    <p>
                      {formatSuppliedAmount(data?.borrowed?.balance || "0")}
                    </p>
                  </div>
                  <div>
                    <p>Total Liquidity</p>
                    <p>
                      {formatSuppliedAmount(
                        (
                          BigInt(data?.supplied?.balance || "0") -
                          BigInt(data?.borrowed?.balance || "0")
                        ).toString()
                      )}
                    </p>
                  </div>

                  <div>
                    <p>Supply APR </p>
                    <p>{apydata.supplyApy}</p>
                  </div>

                  <div>
                    <p> Borrow APR</p>
                    <p>{apydata.borrowApy}</p>
                  </div>

                  <div>
                    <p> {tokenName} Staked Balance</p>
                    <p>
                      {dec === 8
                        ? toHumanReadable2(
                            `${userdata.collateralBalance}`,
                            "token",
                            8
                          )
                        : toHumanReadable(
                            `${userdata.collateralBalance}`,
                            "token"
                          )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p>Unclaimed rewards</p>
                      <div className="flex items-center space-x-1">
                        <span>
                          {toHumanReadable(
                            `${userdata.unclaimedAmount}`,
                            "near"
                          )}
                        </span>
                        <span>Near</span>
                      </div>
                    </div>

                    <div>
                      <p>Reinvestment stake</p>
                      <div className="flex items-center space-x-1">
                        <span>
                          {toHumanReadable(
                            `${userdata.collateralBalance2}`,
                            "near"
                          )}
                        </span>
                        <span>Near</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-5">
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

              <Card className="w-[250px]">
                <CardHeader>
                  <CardTitle>Withdraw from Burrow pool</CardTitle>
                  <CardDescription>
                    CLick the button below to withdraw token into burrow pool
                    and earn rewards
                  </CardDescription>
                </CardHeader>

                <CardFooter className="flex justify-between">
                  <Withdrawburrow
                    tokenId={tokenId}
                    tokenName={tokenName}
                    Data={data}
                  />
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
