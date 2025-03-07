const nearAPI = require("near-api-js");
const { connect, keyStores, KeyPair } = nearAPI;
const express = require("express");
const {
  ftGetTokenMetadata,
  init_env,
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
app.use(cors());
app.options("*", cors());

app.use(helmet());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(expressSanitizer());

const MASTER_ACCOUNT = process.env.ACC_NAM;
const MASTER_FULL_ACCESS_KEY = process.env.ACC_ENV;
const MASTER_ACCOUNT_ID = process.env.ACC_ID;

const masterKeyStore = new keyStores.InMemoryKeyStore();
const masterKeyPair = KeyPair.fromString(MASTER_FULL_ACCESS_KEY);
masterKeyStore.setKey("mainnet", MASTER_ACCOUNT, masterKeyPair);

async function getNearConnection(keyStore) {
  return await connect({
    networkId: "mainnet",
    keyStore,
    nodeUrl: "https://rpc.mainnet.near.org",
  });
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

async function autoClaimAndCompound() {
  const near = await getNearConnection(masterKeyStore);
  const masterAccount = await near.account(MASTER_ACCOUNT);

  const getuserdata = await wallet.viewMethod({
    contractId: "auto-claim-main2.near",
    method: "get_user",
    args: {
      wallet_id: MASTER_ACCOUNT_ID,
    },
    gas: "300000000000000",
    deposit: "0",
  });

  const getUsersBalance = await masterAccount.functionCall({
    contractId: `${getuserdata.username}.auto-claim-main2.near`,
    methodName: "get_contract_balance",
    args: {},
    gas: "30000000000000", 
    attachedDeposit: "0",
  });

  const userBalance = BigInt(getUsersBalance);
  const balance = remainingAfterTwoNear(userBalance);

  const amountswap = yoctoToNear(balance);

  const { ratedPools, unRatedPools, simplePools } = await fetchAllPools();
  const stablePools = unRatedPools.concat(ratedPools);
  const stablePoolsDetail = await getStablePools(stablePools);
  const tokenIn = await ftGetTokenMetadata("wrap.near");
  const tokenOut = await ftGetTokenMetadata("xtoken.ref-finance.near");

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

  const compoundResult = await masterAccount.functionCall({
    contractId: "auto-claim-main2.near",
    methodName: "compound",
    args: {},
    gas: "30000000000000",
    attachedDeposit: "0",
  });

  const reinvestResult = await masterAccount.functionCall({
    contractId: "auto-claim-main2.near",
    methodName: "reinvest",
    args: {
      minamountout: minAmountOut,
      minamountout2: minAmountOut2,
    },
    gas: "30000000000000",
    attachedDeposit: "0",
  });
}



const intervalTime = 60 * 60 * 1000;
  setInterval(async () => {
    try {
      console.log("Running autoClaimAndCompound...");
      await autoClaimAndCompound();
      console.log("autoClaimAndCompound completed successfully.");
    } catch (error) {
      console.error("Error in autoClaimAndCompound:", error);
    }
  }, intervalTime);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
