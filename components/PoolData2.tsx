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

const formatCurrency = (value: any): string => {
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
  const num = BigInt(amount);

  // Define thresholds:
  const millionThreshold = BigInt("1000000000000000000000000"); // 1e24
  const thousandThreshold = BigInt("1000000000000000000000"); // 1e21
  const hundredThreshold = BigInt("1000000000000000000"); // 1e18

  // Helper to format a number using a given divisor and suffix.
  function formatWithDivisor(divisor: bigint, suffix: string): string {
    const wholePart = num / divisor;
    const remainder = num % divisor;
    // Calculate two decimal places.
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

const PoolData = ({ data }: { data: any[] }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredData = data.filter((item) =>
    item.token_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const pageNumbers = [];
  const maxVisiblePages = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePoolClick = (pool: any) => {
    router.push(`/finance/burrow/${pool.token_id}AND${pool.token_name}`);
  };

  return (
    <div className="sm:max-w-5xl max-w-sm mx-auto">
      <div className="mb-4 pt-6 w-full flex">
        <div className="flex-1"></div>
        <input
          type="text"
          placeholder="Search pools by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
          {currentItems.map((item: any) => (
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
                  parseInt(item.supplied.balance) -
                    parseInt(item.borrowed.balance)
                )}
              </h1>
            </div>
          ))}
        </>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center my-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className="bg-white"
                onClick={() => paginate(currentPage - 1)}
                // @ts-ignore
                disabled={currentPage === 1}
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
                  onClick={() => paginate(number)}
                  isActive={number === currentPage}
                >
                  {number}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                className="bg-white"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default PoolData;
