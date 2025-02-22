import React from "react";
import { Skeleton } from "./ui/skeleton";

const SkeletonLoader = () => {
  const dummyArray = Array.from({ length: 10 }, (_, index) => index + 1);

  return (
    <>
      {dummyArray.map((item: any, index: number) => (
        <div
          key={index}
          className="bg-[#0c171f] px-5 p-5 text-sm hover:bg-[#0c171f]/60 text-white cursor-pointer rounded-md grid grid-cols-7 gap-2 my-2"
        >
          <Skeleton className="col-span-3 h-4 w-full" />
          <Skeleton className="col-span-1 h-4 w-full" />
          <Skeleton className="col-span-1 h-4 w-full" />
          <Skeleton className="col-span-1 h-4 w-full" />
          <Skeleton className="col-span-1 h-4 w-full" />
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;
