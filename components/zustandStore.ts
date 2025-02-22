import { create } from "zustand";

interface walletState {
  wallet: any;
  signedAccountId: string;
  setSignedAccountId: (signedAccountId: string) => void;
  setWallet: (wallet: any) => void;
}

export const useWallet = create<walletState>((set) => ({
  signedAccountId: "",
  setSignedAccountId: (signedAccountId: string) => set({ signedAccountId }),
  wallet: null,
  setWallet: (wallet: any) => set({ wallet }),
}));

