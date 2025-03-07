"use client";

import "@near-wallet-selector/modal-ui/styles.css";
import React, { useEffect, useState, useRef, useContext } from "react";
import { Button } from "./ui/button";

import { NearContext } from "../wallets/near";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CreateDialog } from "./CreateDialog";
import Link from "next/link";
import { Wallet } from "lucide-react";

const Header = () => {
  const [account, setAccount] = useState<any | null>(false);
  const { signedAccountId, wallet } = useContext(NearContext);
  const [action, setAction] = useState<any>(() => {});
  const [label, setLabel] = useState("Loading...");

  const [isregistered, setisregistered] = useState(true);

  let count = 0;

  async function getdata() {
    try {
      const getuserdata = await wallet.viewMethod({
        contractId: "auto-claim-main2.near",
        method: "get_user",
        args: {
          wallet_id: signedAccountId,
        },
        gas: "300000000000000",
        deposit: "0",
      });
      if (getuserdata !== null) {
        setisregistered(false);
      } else {
        setisregistered(true);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  if (count < 2) {
    getdata().catch((err) => {});
  }

  useEffect(() => {
    if (!wallet) return;

    if (signedAccountId) {
      setAction(() => wallet.signOut);
      setLabel(`Disconnect ${signedAccountId}`);
      setAccount(true);
    } else {
      setAction(() => wallet.signIn);
      setLabel("Connect wallet");
      setAccount(false);
    }
  }, [signedAccountId, wallet]);

  function SpinningLogo() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
      if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.5;
      }
    });

    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.5, 0.5, 0.5]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
        <mesh position={[-0.5, -0.5, -0.5]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#999999" />
        </mesh>
      </group>
    );
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="flex items-center">
          <div className="w-20 h-20">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <SpinningLogo />
            </Canvas>
          </div>
          <span className="sm:text-2xl font-bold text-green-400 text-lg">
            Ref Finance
          </span>
        </Link>
        {account ? (
          <>
            <div className="flex items-center lg:gap-2">
              <div
                className="text-sm text-green-500 text-center border lg:px-3 py-2 font-semibold bg-white rounded-md"
                onClick={action}
              >
                {`${label.slice(0, 17)}...${label.slice(-7)}`}
              </div>
              <div className="lg:mx-4 mx-2 flex items-center gap-2">
                {isregistered && <CreateDialog />}
                <Link href="/withdraw">
                  <Wallet className="w-5 h-5 text-green-500 cursor-pointer hover:text-green-600" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <Button onClick={action}>{label}</Button>
        )}
      </nav>
    </header>
  );
};

export default Header;
