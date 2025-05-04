const nearAPI = require("near-api-js");
const { connect, keyStores, KeyPair } = nearAPI;
const express = require("express");
require("dotenv").config();

const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const expressSanitizer = require("express-sanitizer");

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

async function autoClaimAndCompound() {
  try {
    const near = await getNearConnection(masterKeyStore);
    const masterAccount = await near.account("david.compoundx.near");

    const getuserdata = await masterAccount.functionCall({
      contractId: "compoundx.near",
      methodName: "get_user",
      args: {
        wallet_id: MASTER_ACCOUNT_ID,
      },
      gas: "300000000000000",
      attachedDeposit: "0",
    });

    const base64Value = getuserdata.status.SuccessValue;

    const decodedValue = Buffer.from(base64Value, "base64").toString("utf-8");

    const userData = JSON.parse(decodedValue);

    console.log(userData);

    await masterAccount.functionCall({
      contractId: userData.subaccount_id,
      methodName: "compound",
      args: {},
      gas: "30000000000000",
      attachedDeposit: "0",
    });
  } catch (error) {
    console.error("Error in autoClaimAndCompound:", error);
    throw error;
  }
}

const runAutoClaim = async () => {
  try {
    console.log("Running autoClaimAndCompound...");
    await autoClaimAndCompound();
    console.log("autoClaimAndCompound completed successfully.");
  } catch (error) {
    console.error("Error in autoClaimAndCompound:", error);
  }

  // // Schedule next run in 20 seconds
  // setTimeout(runAutoClaim, 50 * 1000);
};
runAutoClaim();
const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
