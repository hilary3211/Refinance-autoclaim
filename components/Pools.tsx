"use client";
import React, { useEffect, useState } from "react";
import PoolData from "./PoolData";
import { AreaChartData } from "./AreaChart";

interface Pool {
  token_id: string;
  token_name: string;
  tvl: number;
  supplied: { balance: string };
  borrowed: { balance: string };
}

const Pools = () => {
  const [data, setData] = useState<Pool[]>([]);

  const getPools = async () => {
    try {
      const pools = await fetch("https://api.ref.finance/list-top-pools");
      const data = await pools.json();

      const filteredPools = data.filter((pool: Pool) => {
        return pool.tvl > 500;
      });

      setData(filteredPools);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getPools();
  }, []);

  return (
    <div>
      <div className="sm:max-w-5xl max-w-sm mx-auto"></div>
      <PoolData data={data} />
    </div>
  );
};

export default Pools;
