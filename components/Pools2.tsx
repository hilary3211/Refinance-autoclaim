"use client";
import React, { useEffect, useState, useContext } from "react";
import PoolData from "./PoolData2";
import { AreaChartData } from "./AreaChart";
import { NearContext } from "../wallets/near";

const Pools2 = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [data, setData] = useState<any>([]);

  //   const getPools = async () => {
  //     try {
  //       // const pools = await fetch("https://api.ref.finance/list-top-pools");
  //       // const data = await pools.json();

  //       // const filteredPools = data.filter((pool) => {
  //       //   return pool.tvl > 500;
  //       // });

  //       const getpool = await wallet.viewMethod({
  //         contractId: "contract.main.burrow.near",
  //         method: "get_assets_paged_detailed",
  //         args: {
  //         },

  //       });
  //       const pools = await fetch("https://api.ref.finance/list-top-pools");
  //       const data = await pools.json();
  // console.log(getpool)
  //       setData(getpool);

  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  interface Pool {
    pool_kind: string;
    token_account_ids: string[];
    amounts: string[];
    total_fee: number;
    shares_total_supply: string;
    amp: number;
    farming: boolean;
    token_symbols: string[];
    update_time: number;
    id: string;
    tvl: string;
    token0_ref_price: string;
  }

  interface Farm {
    rewards: Record<string, any>;
    // Add additional farm properties if needed
  }

  interface Token {
    token_id: string;
    token_name?: string;
    farms?: Farm[];
    // Add additional token properties if needed
  }

  async function enrichPoolData(): Promise<Token[]> {
    // Fetch all pools from Ref Finance.
    const poolsResponse = await fetch("https://api.ref.finance/list-top-pools");
    const poolsData: Pool[] = await poolsResponse.json();

    // Build a mapping between token account IDs and token symbols.
    const tokenMap: Record<string, string> = {};
    poolsData.forEach((pool) => {
      pool.token_account_ids.forEach((tokenId, index) => {
        tokenMap[tokenId] = pool.token_symbols[index];
      });
    });

    // Retrieve token data from the contract's view method.
    const getPoolData: Token[] = await wallet.viewMethod({
      contractId: "contract.main.burrow.near",
      method: "get_assets_paged_detailed",
      args: {},
    });

    // Enrich the pool data by adding the token name if a match is found.
    const enrichedData = getPoolData.map((token) => {
      if (tokenMap[token.token_id]) {
        return { ...token, token_name: tokenMap[token.token_id] };
      }
      return token;
    });

    // Filter the tokens to return only those with at least one farm having non-empty rewards.
    const filteredData = enrichedData.filter((token) => {
      if (Array.isArray(token.farms)) {
        return token.farms.some(
          (farm) => farm.rewards && Object.keys(farm.rewards).length > 0
        );
      }
      return false;
    });

    setData(filteredData);
    return filteredData;
  }

  useEffect(() => {
    enrichPoolData();
  }, []);

  return (
    <div>
      <div className="sm:max-w-5xl max-w-sm mx-auto"></div>

      <PoolData data={data} />
    </div>
  );
};

export default Pools2;
