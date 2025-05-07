"use client";
import Header from "@/components/Header";
import { useState, useEffect, useContext } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { NearContext } from "@/wallets/near";
const WithdrawPage = () => {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalItems = 20;
  const itemsToShow = 6;
  const [share2, setshare2] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [token, settoken] = useState<any[]>([]);
  const [token2, settoken2] = useState<any[]>([]);
  const [fromToken, setFromToken] = useState<any>(0);
  const [tokensymbol, setmainbal] = useState<any>("");
  const [tokenid, setmainbal2] = useState<any>("");
  const [amount, setAmount] = useState(0);

  const nextItem = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex + 1) % (totalItems - itemsToShow + 1)
    );
  };

  const previousItem = () => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + totalItems) % (totalItems - itemsToShow + 1)
    );
  };

  useEffect(() => {
    async function fetchTokenData() {
      try {
        const tokenResponse = await fetch("https://api.ref.finance/list-token");
        if (!tokenResponse.ok) {
          throw new Error("Failed to fetch token list");
        }
        const tokenData = await tokenResponse.json();

        const priceResponse = await fetch(
          "https://api.ref.finance/list-token-price"
        );
        if (!priceResponse.ok) {
          throw new Error("Failed to fetch token price list");
        }
        const priceData = await priceResponse.json();

        const tokensArray = Object.keys(tokenData).map((contractId) => {
          const token = tokenData[contractId];
          return {
            tokenName: token.name,
            contractId: contractId,
            tokenSymbol: token.symbol,
            icon: token.icon,
            price: priceData[contractId] ? priceData[contractId].price : null,
          };
        });

        return tokensArray;
      } catch (error) {
        console.error("Error fetching token data:", error);
        return [];
      }
    }

    fetchTokenData().then((tokens) => {
      settoken(tokens);
    });
  }, [share2]);
  const filteredTokens = token?.filter(
    (token) =>
      token.tokenSymbol.toLowerCase().includes(search.toLowerCase()) ||
      token.tokenName.toLowerCase().includes(search.toLowerCase()) ||
      token.contractId.toLowerCase().includes(search.toLowerCase())
  );

  async function getTokenBalance(
    accountId: any,
    tokenContractId: any,
    tokenSym: any
  ) {
    try {
      const balance = await wallet.viewMethod({
        contractId: tokenContractId,
        method: "ft_balance_of",
        args: {
          account_id: accountId,
        },
      });

      if (tokenSym === "wNEAR") {
        setmainbal(tokenSym);
        setmainbal2(tokenContractId);

        setFromToken(toHumanReadable(balance, "near"));
      } else {
        setmainbal2(tokenContractId);
        setmainbal(tokenSym);
        setFromToken(toHumanReadable(balance, "token"));
      }

      return balance;
    } catch (error) {
      console.error(`Error fetching balance for ${tokenContractId}:`, error);
      return "0";
    }
  }

  function toHumanReadable(amount: any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;

    const amountStr = String(amount).padStart(power + 1, "0");

    const integerPart = amountStr.slice(0, -power);
    const fractionalPart = amountStr.slice(-power);

    const humanReadable = `${integerPart}.${fractionalPart}`;

    const formattedAmount = parseFloat(humanReadable).toFixed(2);

    return formattedAmount;
  }

  const handleChange = (e: any) => {
    const value = e.target.value;
    setAmount(value);
  };

  const isWithdrawDisabled =
    parseFloat(amount) > parseFloat(fromToken) ||
    parseFloat(amount) === 0 ||
    parseFloat(fromToken) === 0;

  function toSmallestUnit(amount: any, tokenType = "token") {
    const power = tokenType.toLowerCase() === "near" ? 24 : 18;

    const amountStr = String(amount);

    const [integerPart, fractionalPart = ""] = amountStr.split(".");

    const paddedFractionalPart = fractionalPart.padEnd(power, "0");

    const smallestUnit = BigInt(integerPart + paddedFractionalPart);

    return smallestUnit.toString();
  }

  async function Withdraw() {
    const getUserData = await wallet.viewMethod({
      contractId: "compoundx.near",
      method: "get_user",
      args: {
        wallet_id: signedAccountId,
      },
      gas: "300000000000000",
      deposit: "0",
    });

    let tokenAmount;

    if (tokensymbol === "wNEAR") {
      tokenAmount = toSmallestUnit(amount, "near");
    } else {
      tokenAmount = toSmallestUnit(amount, "token");
    }

    const transactions = [
      {
        receiverId: `${getUserData.subaccount_id}`,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "withdraw_token",
              args: {
                token_id: tokenid,
                receiver_id: signedAccountId,
                amount: tokenAmount,
              },
              gas: "300000000000000",
              deposit: "1",
            },
          },
        ],
      },
    ];

    const products2 = await wallet.signAndSendTransactions({
      transactions,
    });
  }

  return (
    <div>
      {signedAccountId && (
        <>
          <div className="h-[15vh]">
            <Header />
          </div>

          <div className="sm:max-w-3xl max-w-sm mx-auto py-[3rem] bg-[#03080ae6]/30 mt-5">
            <div className="max-w-2xl mx-auto flex flex-col justify-center items-center">
              <p className="text-2xl font-bold text-white font-neuton">
                Withdraw your Earnings
              </p>
              <p className="text-white text-sm">
                Pick a token and then select the amount you want to withdraw.
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-4 my-5 items-center w-full max-w-2xl mx-auto">
                <div className="text-white flex-1">
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Token to withdraw" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Token to withdraw</SelectLabel>

                        <div className="grid gap-4">
                          <Input
                            placeholder="Search by name or symbol"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                          <ScrollArea className="h-[300px] w-[300px]">
                            <div className="grid gap-2">
                              {filteredTokens?.map((token) => (
                                <Button
                                  key={token.symbol}
                                  variant="ghost"
                                  className="w-full justify-start gap-12"
                                  onClick={() => {
                                    async function gettokbal() {
                                      const getUserData =
                                        await wallet.viewMethod({
                                          contractId: "compoundx.near",
                                          method: "get_user",
                                          args: {
                                            wallet_id: signedAccountId,
                                          },
                                          gas: "300000000000000",
                                          deposit: "0",
                                        });
                                      const accountId = `${getUserData.subaccount_id}`;
                                      getTokenBalance(
                                        accountId,
                                        token.contractId,
                                        token.tokenSymbol
                                      );
                                      setOpen(false);
                                      settoken2(token.tokenSymbol);
                                    }

                                    gettokbal();
                                  }}
                                >
                                  <img
                                    src={token.icon || "/toks.png"}
                                    alt={token.tokenSymbol}
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                  />
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium">
                                      {token.tokenSymbol}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {token.tokenName}
                                    </span>
                                  </div>
                                  {token.price && (
                                    <div className="ml-auto text-right">
                                      <span className="text-sm font-medium">
                                        ${token.price}
                                      </span>
                                    </div>
                                  )}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="max-w-[20rem] w-full text-white bg-[#03080ae6]/70 py-2 text-center">
                  <p className="text-sm">{token2} Balance</p>
                  <p className="text-2xl font-bold">{fromToken}</p>
                </div>
              </div>
              <div className="flex gap-4 my-5 items-center max-w-2xl mx-auto">
                <Input
                  onChange={handleChange}
                  value={amount}
                  type="number"
                  placeholder="0"
                  className="w-full max-w-xl py-6 border-2 mx-auto text-white border-white rounded-md"
                />
              </div>
            </div>
            <div className="max-w-2xl flex mx-auto">
              <Button
                onClick={() => {
                  Withdraw();
                }}
                disabled={isWithdrawDisabled}
                className="w-full max-w-xl mx-auto p-6 bg-green-500 text-white font-bold hover:bg-green-600"
              >
                Withdraw
              </Button>
            </div>
          </div>
        </>
      )}

      {!signedAccountId && (
        <>
          <div className="h-[15vh]">
            <Header />
          </div>
          <div className="flex flex-col items-center justify-center text-white text-center">
            <p className="mb-4 text-lg font-medium max-w-sm sm: max-w-3xl">
              To continue, please connect wallet
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default WithdrawPage;
