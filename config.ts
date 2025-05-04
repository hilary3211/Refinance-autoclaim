const contractPerNetwork = {
    mainnet: 'compoundx.near',
    testnet: 'autoclaimm2.testnet',
  };
  
  // Chains for EVM Wallets 
  const evmWalletChains = {
    mainnet: {
      chainId: 397,
      name: "Near Mainnet",
      explorer: "https://eth-explorer.near.org",
      rpc: "https://eth-rpc.mainnet.near.org",
    },
    testnet: {
      chainId: 398,
      name: "Near Testnet",
      explorer: "https://eth-explorer-testnet.near.org",
      rpc: "https://eth-rpc.testnet.near.org",
    },
  }
  
  export function getConfig(
    env= ENV ||
      process.env.NEAR_ENV ||
      process.env.REACT_APP_REF_SDK_ENV
  ) {
    ENV = env;
    switch ("testnet") {
      case 'mainnet':
        return {
          networkId: 'mainnet',
          nodeUrl: 'https://rpc.mainnet.near.org',
          walletUrl: 'https://wallet.near.org',
          WRAP_NEAR_CONTRACT_ID: 'wrap.near',
          REF_FI_CONTRACT_ID: 'v2.ref-finance.near',
          REF_TOKEN_ID: 'token.v2.ref-finance.near',
          indexerUrl: 'https://indexer.ref.finance',
          explorerUrl: 'https://testnet.nearblocks.io',
          REF_DCL_SWAP_CONTRACT_ID: 'dclv2.ref-labs.near',
        };
      case 'testnet':
        return {
          networkId: 'testnet',
          nodeUrl: 'https://rpc.testnet.near.org',
          walletUrl: 'https://wallet.testnet.near.org',
          indexerUrl: 'https://testnet-indexer.ref-finance.com',
          WRAP_NEAR_CONTRACT_ID: 'wrap.testnet',
          REF_FI_CONTRACT_ID: 'ref-finance-101.testnet',
          REF_TOKEN_ID: 'ref.fakes.testnet',
          explorerUrl: 'https://testnet.nearblocks.io',
          REF_DCL_SWAP_CONTRACT_ID: 'dclv2.ref-dev.testnet',
        };
      default:
        return {
          networkId: 'mainnet',
          nodeUrl: 'https://rpc.mainnet.near.org',
          walletUrl: 'https://wallet.near.org',
          REF_FI_CONTRACT_ID: 'v2.ref-finance.near',
          WRAP_NEAR_CONTRACT_ID: 'wrap.near',
          REF_TOKEN_ID: 'token.v2.ref-finance.near',
          indexerUrl: 'https://indexer.ref.finance',
          explorerUrl: 'https://nearblocks.io',
          REF_DCL_SWAP_CONTRACT_ID: 'dclv2.ref-labs.near',
        };
    }
  }
  
  
  export const NetworkId = 'mainnet';
  export const HelloNearContract = contractPerNetwork[NetworkId];
  export const EVMWalletChain = evmWalletChains[NetworkId];