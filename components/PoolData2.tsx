import React, { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import SkeletonLoader from "./SkeletonLoader";
import { useRouter } from "next/navigation";

interface PoolItem {
  token_id: string;
  token_name: string;
  supplied: {
    balance: string;
  };
  borrowed: {
    balance: string;
  };
  supply_apr : string

}

const formatCurrency = (value: number | string): string => {
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

const PoolData = ({ data }: { data: PoolItem[] }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredData = data.filter((item) =>
    item.token_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // console.log(filteredData)

  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const pageNumbers: number[] = [];
  const maxVisiblePages = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  function getTokenRewards(data: any) {
    const rewards: any = {};
    
    // Loop through all farms (both Supplied and Borrowed positions)
    data.farms.forEach(farm => {
      const farmType = farm.farm_id.Supplied ? 'Supplied' : 'Borrowed';
      const tokenId = farm.farm_id[farmType];
      
      // Check if rewards exist for this farm
      if (farm.rewards) {
        Object.entries(farm.rewards).forEach(([rewardTokenId, rewardData]) => {
          if (!rewards[rewardTokenId]) {
            rewards[rewardTokenId] = {
              daily: 0,
              weekly: 0,
              yearly: 0,
              apy: 0,
              farmType
            };
          }
          
          // Convert from yoctoNEAR (1e-24) to readable units
          const daily = rewardData?.reward_per_day / 1e24;
          
          rewards[rewardTokenId].daily += daily;
          rewards[rewardTokenId].weekly += daily * 7;
          rewards[rewardTokenId].yearly += daily * 365;
        });
      }
    });
    
    // Calculate APY if user has a balance
    const userBalance = parseFloat(data.supplied.balance) / 1e24;
    if (userBalance > 0) {
      Object.keys(rewards).forEach(tokenId => {
        rewards[tokenId].apy = (rewards[tokenId].yearly / userBalance) * 100;
      });
    }
    
    return rewards;
  }
  const handlePoolClick = (pool: PoolItem) => {
  
    const rewards = getTokenRewards(pool);

    const params = new URLSearchParams({
      token_id: pool.token_id,
      token_name: pool.token_name,
      apy: rewards["wrap.near"]?.apy.toFixed(2),
      yearly: rewards["wrap.near"]?.yearly.toFixed(6)
    });
    
    router.push(`/finance/burrow/${params.toString()}`);
  
   
  };

  return (
    <div className="sm:max-w-5xl max-w-sm mx-auto">
      <div className="mb-4 pt-6 w-full flex">
        <div className="flex-1"></div>
        <input
          type="text"
          placeholder="Search pools by name..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          className="max-w-xl w-full items-end p-2 rounded-md"
        />
      </div>
      <div className="grid grid-cols-5 gap-2 text-[#4f5f64] px-4 text-sm font-semibold py-2">
        <p className="col-span-1">Name</p>
        <p className="col-span-1">Total Supplied </p>
        <p className="col-span-1">Total Borrowed</p>
        <p className="col-span-1">Total Liquidity</p>
      </div>
      {data.length === 0 ? (
        <SkeletonLoader />
      ) : (
        <>
          {currentItems.map((item: PoolItem) => (
            <div
              onClick={() => handlePoolClick(item)}
              key={item.token_id}
              className="bg-[#0c171f] px-5 p-5 text-sm hover:bg-[#0c171f]/60 text-white cursor-pointer rounded-md grid grid-cols-5 gap-2 my-2"
            >
              <h1 className="col-span-1 font-semibold">{item.token_name}</h1>
              <h1 className="col-span-1">
                {formatSuppliedAmount(item.supplied.balance)}
              </h1>
              <h1 className="col-span-1 text-wrap truncate">
                {formatSuppliedAmount(item.borrowed.balance)}
              </h1>
              <h1 className="col-span-1 text-wrap truncate">
                {formatSuppliedAmount(
                  (
                    BigInt(item.supplied.balance) -
                    BigInt(item.borrowed.balance)
                  ).toString()
                )}
              </h1>
            </div>
          ))}
        </>
      )}

      <div className="flex justify-between items-center my-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={`bg-white ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (currentPage === 1) paginate(currentPage - 1);
                }}
              />
            </PaginationItem>
            {pageNumbers.map((number) => (
              <PaginationItem key={number}>
                <PaginationLink
                  className={`${
                    number === currentPage
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-white"
                  }`}
                  href="#"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    paginate(number);
                  }}
                  isActive={number === currentPage}
                >
                  {number}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                className={`bg-white ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => {
                  if (currentPage === totalPages) paginate(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default PoolData;
