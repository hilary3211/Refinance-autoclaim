"use client";

import React, { useState, ChangeEvent } from "react";
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

const formatCurrency = (value: number | string): string => {
  const numericValue = Number(value);

  if (isNaN(numericValue)) return "$0.00";

  if (numericValue >= 1_000_000) {
    return `$${(numericValue / 1_000_000).toFixed(2)}M`;
  } else if (numericValue >= 1_000) {
    return `$${(numericValue / 1_000).toFixed(2)}K`;
  } else {
    return `$${numericValue.toFixed(2)}`;
  }
};

type PoolDataProps = {
  data: {
    id: string;
    token_symbols: string[];
    total_fee: number;
    tvl: number | string;
  }[];
};

const PoolData: React.FC<PoolDataProps> = ({ data }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredData = data.filter((item) =>
    item.token_symbols
      .join(" / ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const maxVisiblePages = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePoolClick = (poolId: string) => {
    router.push(`/finance/pool/${poolId}`);
  };

  return (
    <div className="sm:max-w-5xl max-w-sm mx-auto">
      <div className="mb-4 pt-6 w-full flex">
        <div className="flex-1" />
        <input
          type="text"
          placeholder="Search pools by name..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-xl w-full items-end p-2 rounded-md"
        />
      </div>

      <div className="grid grid-cols-5 gap-2 text-[#4f5f64] px-3 text-sm font-semibold py-2">
        <p className="col-span-3">Pair</p>
        <p className="col-span-1">Fee (%)</p>
        <p className="col-span-1">TVL</p>
      </div>

      {data.length === 0 ? (
        <SkeletonLoader />
      ) : (
        <>
          {currentItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handlePoolClick(item.id)}
              className="bg-[#0c171f] px-5 p-5 text-sm hover:bg-[#0c171f]/60 text-white cursor-pointer rounded-md grid grid-cols-5 gap-2 my-2"
            >
              <h1 className="col-span-3 font-semibold">
                {item.token_symbols.join(" / ")}
              </h1>
              <h1 className="col-span-1">
                {(item.total_fee / 100).toFixed(2)}%
              </h1>
              <h1 className="col-span-1 text-wrap truncate">
                {formatCurrency(item.tvl)}
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
                className="bg-white"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            {pageNumbers.map((number) => (
              <PaginationItem key={number}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    paginate(number);
                  }}
                  isActive={number === currentPage}
                  className={`${
                    number === currentPage
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-white border-white text-black"
                  }`}
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
                  if (currentPage < totalPages) paginate(currentPage + 1);
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
