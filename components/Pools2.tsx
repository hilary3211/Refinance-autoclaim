"use client";
import React, { useEffect, useState, useContext } from "react";
import PoolData from "./PoolData2";
import { AreaChartData } from "./AreaChart";
import { NearContext } from "../wallets/near";

const Pools2 = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [data, setData] = useState<any>([]);

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
  }

  interface Token {
    token_id: string;
    token_name?: string;
    farms?: Farm[];
  }

  async function enrichPoolData(): Promise<Token[]> {
    const poolsResponse = await fetch("https://api.ref.finance/list-top-pools");
    const poolsData: Pool[] = await poolsResponse.json();

    const tokenMap: Record<string, string> = {};
    poolsData.forEach((pool) => {
      pool.token_account_ids.forEach((tokenId, index) => {
        tokenMap[tokenId] = pool.token_symbols[index];
      });
    });

    const getPoolData: Token[] = await wallet.viewMethod({
      contractId: "contract.main.burrow.near",
      method: "get_assets_paged_detailed",
      args: {},
    });

    const enrichedData = getPoolData.map((token) => {
      if (tokenMap[token.token_id]) {
        return { ...token, token_name: tokenMap[token.token_id] };
      }
      return token;
    });

    const filteredData = enrichedData.filter((token) => {
      if (Array.isArray(token.farms)  && token.token_name !== "BRRR") {
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
