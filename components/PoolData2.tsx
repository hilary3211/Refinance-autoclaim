import React, { useState, useEffect, useContext } from "react";
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
import { NearContext } from "@/wallets/near";
interface PoolItem {
  token_id: string;
  token_name: string;
  supplied: {
    balance: string;
  };
  borrowed: {
    balance: string;
  };
  supply_apr: string;
}

// function formatSuppliedAmount(amount: string): string {
//   if (!amount) return "0";

//   const num = BigInt(amount);

//   const millionThreshold = BigInt("1000000000000000000000000");
//   const thousandThreshold = BigInt("1000000000000000000000");
//   const hundredThreshold = BigInt("1000000000000000000");

//   function formatWithDivisor(divisor: bigint, suffix: string): string {
//     const wholePart = num / divisor;
//     const remainder = num % divisor;

//     const decimals = (remainder * BigInt(100)) / divisor;
//     return `${wholePart.toString()}.${decimals
//       .toString()
//       .padStart(2, "0")}${suffix}`;
//   }

//   if (num >= millionThreshold) {
//     return formatWithDivisor(millionThreshold, "M");
//   } else if (num >= thousandThreshold) {
//     return formatWithDivisor(thousandThreshold, "K");
//   } else if (num >= hundredThreshold) {
//     return formatWithDivisor(hundredThreshold, "H");
//   } else {
//     return num.toString()
//   }
// }


function formatSuppliedAmount(amount: string): string {
  if (!amount) return "0";

  const num = BigInt(amount);
  const decimals = 18; // Assuming ETH-like decimals

  // Thresholds in wei/atto units
  const millionThreshold = BigInt("1000000000000000000000000"); // 1M ETH
  const thousandThreshold = BigInt("1000000000000000000000");   // 1K ETH
  const hundredThreshold = BigInt("1000000000000000000");       // 1 ETH
  const baseThreshold = BigInt("1000000000000000");             // 0.001 ETH

  function formatWithDivisor(divisor: bigint, suffix: string): string {
    const wholePart = num / divisor;
    const remainder = num % divisor;
    
    // Calculate 2 decimal places
    const decimals = (remainder * BigInt(100)) / divisor;
    return `${wholePart}.${decimals.toString().padStart(2, "0")}${suffix}`;
  }

  function formatSmallNumber(): string {
    // Convert to ETH units and format with 2 decimal places
    const ethValue = Number(num) / 1e18;
    return ethValue.toFixed(2);
  }

  if (num >= millionThreshold) {
    return formatWithDivisor(millionThreshold, "M");
  } else if (num >= thousandThreshold) {
    return formatWithDivisor(thousandThreshold, "K");
  } else if (num >= hundredThreshold) {
    return formatWithDivisor(hundredThreshold, "");
  } else if (num >= baseThreshold) {
    return formatSmallNumber();
  } else {
    return "0.00"; // Very small amounts
  }
}

// function formatSuppliedAmount(amount: string, tokenDecimals: number = 24): string {
//   if (!amount || !/^\d+$/.test(amount)) return "0";

//   const num = BigInt(amount);
//   const tokenDecimalsBigInt = BigInt("10") ** BigInt(tokenDecimals);

//   const millionThreshold = tokenDecimalsBigInt;
//   const thousandThreshold = tokenDecimalsBigInt / BigInt("1000");
//   const hundredThreshold = tokenDecimalsBigInt / BigInt("1000000");

//   function formatWithDivisor(divisor: bigint, suffix: string): string {
//     const wholePart = num / divisor;
//     const remainder = num % divisor;
//     const decimals = (remainder * BigInt(100)) / divisor;
//     const nextDecimal = (remainder * BigInt(1000)) / divisor;
//     const roundedDecimals = nextDecimal >= BigInt(500) ? decimals + BigInt(1) : decimals;
//     return `${wholePart.toString()}.${roundedDecimals.toString().padStart(2, "0")}${suffix}`;
//   }

//   function formatSmallNumber(): string {
//     const wholePart = num / tokenDecimalsBigInt;
//     const remainder = num % tokenDecimalsBigInt;
//     const decimals = (remainder * BigInt(100)) / tokenDecimalsBigInt;
//     const nextDecimal = (remainder * BigInt(1000)) / tokenDecimalsBigInt;
//     const roundedDecimals = nextDecimal >= BigInt(500) ? decimals + BigInt(1) : decimals;
//     return `${wholePart.toString()}.${roundedDecimals.toString().padStart(2, "0")}`;
//   }

//   if (num >= millionThreshold) {
//     return formatWithDivisor(millionThreshold, "M");
//   } else if (num >= thousandThreshold) {
//     return formatWithDivisor(thousandThreshold, "K");
//   } else if (num >= hundredThreshold) {
//     return formatWithDivisor(hundredThreshold, "H");
//   } else {
//     return formatSmallNumber();
//   }
// }






// function formatSuppliedAmount(amount: string): string {
//   if (!amount || !/^\d+$/.test(amount)) return "0";

//   const num = BigInt(amount);
//   const tokenDecimals = BigInt("1000000000000000000000000"); // 10^24

//   const millionThreshold = BigInt("1000000000000000000000000"); // 10^24
//   const thousandThreshold = BigInt("1000000000000000000000"); // 10^21
//   const hundredThreshold = BigInt("1000000000000000000"); // 10^18

//   function formatWithDivisor(divisor: bigint, suffix: string): string {
//     const wholePart = num / divisor;
//     const remainder = num % divisor;
//     const decimals = (remainder * BigInt(100)) / divisor;
//     return `${wholePart.toString()}.${decimals
//       .toString()
//       .padStart(2, "0")}${suffix}`;
//   }

//   function formatSmallNumber(): string {
//     const wholePart = num / tokenDecimals;
//     const remainder = num % tokenDecimals;
//     const decimals = (remainder * BigInt(100)) / tokenDecimals;
//     return `${wholePart.toString()}.${decimals.toString().padStart(2, "0")}`;
//   }

//   if (num >= millionThreshold) {
//     return formatWithDivisor(millionThreshold, "M");
//   } else if (num >= thousandThreshold) {
//     return formatWithDivisor(thousandThreshold, "K");
//   } else if (num >= hundredThreshold) {
//     return formatWithDivisor(hundredThreshold, "H");
//   } else {
//     return formatSmallNumber();
//   }
// }

const PoolData = ({ data }: { data: PoolItem[] }) => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredData = data.filter((item) =>
    item.token_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  async function fetchPrice(contractId: any) {
    try {
      const response = await fetch(
        `https://api.data-service.burrow.finance/burrow/get_token_detail/${contractId}`
      );
      const priceData = await response.json();

      const tokenPrice = priceData[0]?.token_supply_apr;
      const tokenPrice2 = priceData[0]?.token_borrow_apr;
      if (!tokenPrice) {
        console.warn(
          `Price for ${contractId} not found. Using fallback price.`
        );
        return 41.78;
      }
      return [tokenPrice, tokenPrice2];
    } catch (error) {
      console.error("Error fetching price:", error);
      return 41.78;
    }
  }

  async function getTokenRewards(data: any, contractId: any) {
    const rewards: any = {};
    const zecPrice = await fetchPrice(contractId);

    return zecPrice;
  }

  const handlePoolClick = async (pool: PoolItem) => {
    const rewards: any = await getTokenRewards(pool, pool.token_id);

    const params = new URLSearchParams({
      token_id: pool.token_id,
      token_name: pool.token_name,
      apy: `${rewards[0] * 100}`,
      yearly: `${rewards[1] * 100}`,
      signerid: signedAccountId,
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
