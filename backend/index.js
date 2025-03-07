const nearAPI = require("near-api-js");
const nearAPI2 = require("near-seed-phrase");
// import { parseSeedPhrase } from 'near-seed-phrase';
const { connect, keyStores, KeyPair, utils } = nearAPI;
const { parseSeedPhrase } = nearAPI2;
const express = require("express");
const fs = require("fs");
const {
  ftGetTokenMetadata,
  getConfig,
  init_env,
  ftGetTokensMetadata,
  fetchAllPools,
  estimateSwap,
  getStablePools,
  instantSwap,
} = require("@ref-finance/ref-sdk");
require("dotenv").config();
init_env("mainnet");

const bodyParser = require("body-parser");

const helmet = require("helmet");

const cors = require("cors");
const expressSanitizer = require("express-sanitizer");

const YOCTO_PER_NEAR = BigInt("1000000000000000000000000");

const app = express();

app.use(cors()); // Allow all origins

app.options("*", cors());

app.use(helmet());
// app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(expressSanitizer());

const MASTER_ACCOUNT = process.env.ACC_NAM;
const MASTER_FULL_ACCESS_KEY = process.env.ACC_ENV;

const masterKeyStore = new keyStores.InMemoryKeyStore();
const masterKeyPair = KeyPair.fromString(MASTER_FULL_ACCESS_KEY);
masterKeyStore.setKey("mainnet", MASTER_ACCOUNT, masterKeyPair);

function base64ToUint8Array(base64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = Object.fromEntries(
    [...chars].map((char, index) => [char, index])
  );

  // Remove any invalid characters (e.g., newlines, spaces)
  base64 = base64.replace(/[^A-Za-z0-9+/=]/g, "");

  // Validate length
  if (base64.length % 4 !== 0) {
    throw new Error("Invalid Base64 string length");
  }

  // Remove padding and calculate buffer length
  let padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  let bufferLength = (base64.length * 3) / 4 - padding;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64[i]];
    const encoded2 = lookup[base64[i + 1]];
    const encoded3 = base64[i + 2] !== "=" ? lookup[base64[i + 2]] : 0;
    const encoded4 = base64[i + 3] !== "=" ? lookup[base64[i + 3]] : 0;

    if (encoded1 === undefined || encoded2 === undefined) {
      throw new Error("Invalid Base64 string");
    }

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (base64[i + 2] !== "=") {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (base64[i + 3] !== "=") {
      bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
    }
  }

  return bytes;
}

async function getNearConnection(keyStore) {
  return await connect({
    networkId: "mainnet",
    keyStore,
    nodeUrl: "https://rpc.mainnet.near.org",
  });
}

function stripSuffix(userId) {
  const parts = userId.split(".");
  return parts.length > 1 ? parts[0] : userId; // Return first part if there's a dot, else return the full input
}

function remainingAfterTwoNear(balance) {
  // Ensure we work with BigInt
  const bal = typeof balance === "bigint" ? balance : BigInt(balance);
  const twoNear = 2n * YOCTO_PER_NEAR;
  if (bal > twoNear) {
    return bal - twoNear;
  }
  return null;
}

function yoctoToNear(yoctoAmount) {
  // Ensure we have a BigInt for calculation
  const yocto = BigInt(yoctoAmount);
  const divisor = BigInt("1000000000000000000000000"); // 1 NEAR in yoctoNEAR

  // Determine the whole number portion
  const wholePart = yocto / divisor;
  // Determine the fractional part as remainder
  let fractionPart = yocto % divisor;

  // Convert fraction to a string with leading zeros up to 24 digits
  let fractionStr = fractionPart.toString().padStart(24, "0");

  // Optionally, remove trailing zeros for cleaner output
  fractionStr = fractionStr.replace(/0+$/, "");

  // If there's no fractional part left, return just the whole number
  if (fractionStr === "") {
    return wholePart.toString();
  }

  return `${wholePart.toString()}.${fractionStr}`;
}

function getMinAmountOut(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.actions && Array.isArray(data.actions)) {
      for (const action of data.actions) {
        if (action.min_amount_out) {
          return action.min_amount_out;
        }
      }
    }
    return null; // Return null if not found
  } catch (error) {
    console.error("Invalid JSON string", error);
    return null;
  }
}

function getMinAmountOut2(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.actions && Array.isArray(data.actions)) {
      for (const action of data.actions) {
        if (action.pool_id) {
          return action.pool_id;
        }
      }
    }
    return null; // Return null if not found
  } catch (error) {
    console.error("Invalid JSON string", error);
    return null;
  }
}

async function getOrCreateUserSubaccountmain(userIds) {
  const userId = stripSuffix(userIds);

  const near = await getNearConnection(masterKeyStore);
  const masterAccount = await near.account(MASTER_ACCOUNT);

  const subaccountId = `${userId}.${MASTER_ACCOUNT}`;

  const newKeyPair = KeyPair.fromRandom("ed25519");

  const initialBalance = utils.format.parseNearAmount("2");

  const userKeyStore = new keyStores.InMemoryKeyStore();

  console.log(
    `Creating subaccount ${subaccountId} with balance ${initialBalance}`
  );

  await masterAccount.createAccount(
    subaccountId,
    newKeyPair.getPublicKey(),
    initialBalance
  );
  await userKeyStore.setKey("mainnet", subaccountId, newKeyPair);

  // Connect to NEAR using the subaccount's key store
  const near2 = await getNearConnection(userKeyStore);
  const subaccount = await near2.account(subaccountId);
  const wasmBuffer = fs.readFileSync("./autoclaim.wasm");

  const wasmBase64 = wasmBuffer.toString("base64");
  // Deploy the contract to the subaccount
  const wasmBytes = base64ToUint8Array(wasmBase64);
  const deployResult = await subaccount.deployContract(wasmBytes);

  return subaccountId;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function claimFunction() {
  const near = await getNearConnection(masterKeyStore);
  const masterAccount = await near.account(MASTER_ACCOUNT);

  // Fetch all users from the smart contract
  const getUsersResult = await masterAccount.functionCall({
    contractId: "auto-claim-main2.near", // Contract that stores users
    methodName: "get_all_users",
    args: {},
    gas: "30000000000000", // Gas limit
    attachedDeposit: "0", // No deposit
  });

  // Decode the result
  const base64Value = getUsersResult.status.SuccessValue;
  const decodedValue = Buffer.from(base64Value, "base64").toString("utf-8");
  const users = JSON.parse(decodedValue);

  const executeSwapTransactions = async (transactions) => {
    for (const tx of transactions) {
      const { receiverId, functionCalls } = tx;

      for (const call of functionCalls) {
        const { methodName, args, gas, amount } = call;

        try {
          const result = await masterAccount.functionCall({
            contractId: receiverId,
            methodName,
            args,
            gas: "30000000000000",
            attachedDeposit:
              methodName === "ft_transfer_call"
                ? "1"
                : "125000000000000000000000",
          });

          console.log(
            `Transaction successful: ${methodName} on ${receiverId}`,
            result
          );
        } catch (error) {
          console.error(
            `Transaction failed: ${methodName} on ${receiverId}`,
            error
          );
          throw error; // Stop execution if any transaction fails
        }
      }
    }
  };

  // Loop over each user
  for (const user of users) {
    if (user.subaccount_id === "auto-claim-main2.near") {
    } else {
      if (Array.isArray(user.preferences) && user.preferences.length > 0) {
        for (const pref of user.preferences) {
          try {
            // Check the balance of the user's account
            const getUsersBalance = await masterAccount.functionCall({
              contractId: pref.smart_contract_name,
              methodName: "get_contract_balance",
              args: {},
              gas: "30000000000000", // Gas limit
              attachedDeposit: "0", // No deposit
            });

            const runClaimResult = await masterAccount.functionCall({
              contractId: pref.smart_contract_name,
              methodName: "claim_all_rewards",
              args: {
                seed_id: pref.seed_id,
                neargas: 50,
                tokenid: pref.token_id,
              },
              gas: "30000000000000", // Gas limit
              attachedDeposit: "0", // No deposit
            });

            // Claim rewards for the user's preference
            const runClaimResult2 = await masterAccount.functionCall({
              contractId: pref.smart_contract_name,
              methodName: "claim_from_burrow",
              args: {
                neargas: 50,
              },
              gas: "30000000000000", // Gas limit
              attachedDeposit: "0", // No deposit
            });

            console.log(
              `Claimed rewards for ${user.wallet_id} preference:`,
              pref
            );

            // Check if reinvestment is enabled
            if (pref.is_active === "true") {
              const userBalance = BigInt(getUsersBalance);
              const balance = remainingAfterTwoNear(userBalance);
              const pointOneNear = BigInt("100000000000000000000000");

              if (balance !== null && balance > pointOneNear) {
                if (pref.reinvest_to === "Burrow") {
                  // Deposit into Burrow
                  const depositResult = await masterAccount.functionCall({
                    contractId: pref.smart_contract_name,
                    methodName: "deposit_into_burrow",
                    args: {
                      deposit_amount: balance.toString(),
                      neargas: 50,
                    },
                    gas: "30000000000000", // Gas limit
                    attachedDeposit: "0", // No deposit
                  });
                  console.log(`Deposited into Burrow for ${user.wallet_id}`);
                } else if (pref.reinvest_to === "Stake") {
                  // Perform token swap and stake
                  const amountswap = yoctoToNear(balance);

                  const { ratedPools, unRatedPools, simplePools } =
                    await fetchAllPools();
                  const stablePools = unRatedPools.concat(ratedPools);
                  const stablePoolsDetail = await getStablePools(stablePools);
                  const tokenIn = await ftGetTokenMetadata("wrap.near");
                  const tokenOut = await ftGetTokenMetadata(
                    "xtoken.ref-finance.near"
                  );

                  const swapTodos = await estimateSwap({
                    tokenIn,
                    tokenOut,
                    amountIn: amountswap,
                    simplePools,
                  });

                  const transactionsRef = await instantSwap({
                    tokenIn,
                    tokenOut,
                    amountIn: amountswap,
                    swapTodos,
                    slippageTolerance: 0.5,
                    AccountId: pref.smart_contract_name,
                    referralId: "",
                  });

                  const minAmountOut = getMinAmountOut(
                    transactionsRef[0].functionCalls[0].args.msg
                  );
                  const minAmountOut2 = getMinAmountOut2(
                    transactionsRef[0].functionCalls[0].args.msg
                  );
                  //smart_contract_name: String, transfer_call_args: String, deposit_amount : String , neargas : String
                  const depositResult = await masterAccount.functionCall({
                    contractId: pref.smart_contract_name,
                    methodName: "stake_xRef",
                    args: {
                      smart_contract_name: pref.smart_contract_name,
                      transfer_call_args:
                        transactionsRef[1].functionCalls[0].args,
                      deposit_amount: balance,
                      neargas: 50,
                      receiver_id: "xtoken.ref-finance.near",
                      min_amount_out: minAmountOut,
                      pool_id: minAmountOut2,
                    },
                    gas: "30000000000000", // Gas limit
                    attachedDeposit: "0", // No deposit
                  });

                  console.log(`Swapped and staked for ${user.wallet_id}`);
                } else if (pref.reinvest_to) {
                  // Perform token swap and stake
                  const amountswap = yoctoToNear(balance);

                  const { ratedPools, unRatedPools, simplePools } =
                    await fetchAllPools();
                  const stablePools = unRatedPools.concat(ratedPools);
                  const stablePoolsDetail = await getStablePools(stablePools);
                  const tokenIn = await ftGetTokenMetadata("wrap.near");
                  const tokenOut = await ftGetTokenMetadata(pref.reinvest_to);

                  const swapTodos = await estimateSwap({
                    tokenIn,
                    tokenOut,
                    amountIn: amountswap,
                    simplePools,
                  });

                  const transactionsRef = await instantSwap({
                    tokenIn,
                    tokenOut,
                    amountIn: amountswap,
                    swapTodos,
                    slippageTolerance: 0.5,
                    AccountId: pref.smart_contract_name,
                    referralId: "",
                  });

                  await executeSwapTransactions(transactionsRef);

                  const depositResult = await masterAccount.functionCall({
                    contractId: pref.smart_contract_name,
                    methodName: "deposit_into_burrow_pool",
                    args: {
                      tokenid: pref.reinvest_to,
                      deposit_amount: balance,
                      neargas: 50,
                    },
                    gas: "30000000000000", // Gas limit
                    attachedDeposit: "0", // No deposit
                  });

                  console.log(`Swapped and staked for ${user.wallet_id}`);
                }
              }
            }
          } catch (error) {
            console.error(
              `Error processing ${user.wallet_id} preference:`,
              pref,
              error
            );
          }

          // Wait 1 minute before processing the next preference
          await sleep(60000);
        }
      }
    }
  }
}

async function getswap(tokenin, tokenout, amount, accid) {
  const { ratedPools, unRatedPools, simplePools } = await fetchAllPools();
  const stablePools = unRatedPools.concat(ratedPools);
  const stablePoolsDetail = await getStablePools(stablePools);
  const tokenIn = await ftGetTokenMetadata(tokenin);
  const tokenOut = await ftGetTokenMetadata(tokenout);

  const swapTodos = await estimateSwap({
    tokenIn,
    tokenOut,
    amountIn: amount,
    simplePools,
  });

  const transactionsRef = await instantSwap({
    tokenIn,
    tokenOut,
    amountIn: amount,
    swapTodos,
    slippageTolerance: 0.5,
    AccountId: accid,
    referralId: "",
  });
  return transactionsRef;
}

app.post("/swapdata", async (req, res) => {
  const { tokenin, tokenout, amount, accid } = req.body;
  try {
    const data = await getswap(tokenin, tokenout, amount, accid);

    res.json({ success: "successful!!!!", data });
  } catch (error) {
    console.error("Error performing swap:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/createAccount", async (req, res) => {
  const { username } = req.body;
  try {
    const data = await getOrCreateUserSubaccountmain(username);
    res.json({ success: "successful!!!!", data });
  } catch (error) {
    // Check if the error message indicates that the account already exists.
    if (error.message.includes("already exists")) {
      // Return a 200 success response
      console.log("Account already exists. Returning success.");
      res.json({ success: "successful!!!!", data: "Account already exists." });
    } else {
      console.error("Error performing swap:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
});
const intervalTime = 1 * 60 * 1000;
setInterval(async () => {
  try {
    console.log("Running claimFunction...");
    await claimFunction();
    console.log("claimFunction completed successfully.");
  } catch (error) {
    console.error("Error in claimFunction:", error);
  }
}, intervalTime);

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
