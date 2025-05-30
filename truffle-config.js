require('ts-node/register'); // eslint-disable-line
require('dotenv-flow').config(); // eslint-disable-line
const HDWalletProvider = require('@truffle/hdwallet-provider'); // eslint-disable-line

module.exports = {
  compilers: {
    solc: {
      version: '0.5.16',
      docker: false,
      parser: 'solcjs',
      settings: {
        optimizer: {
          enabled: true,
          runs: 10000,
        },
      },
    },
  },
  networks: {
    test: {
      host: '0.0.0.0',
      port: 8545,
      gasPrice: 1,
      network_id: '1001',
      confirmations: 0,
      timeoutBlocks: 1,
      skipDryRun: true,
      deploymentPollingInterval: 1000,
      disableConfirmationListener: true,
    },
    coverage: {
      host: '127.0.0.1',
      port: 8555,
      gasPrice: 1,
      network_id: '1002',
    },
    docker: {
      host: 'localhost',
      network_id: '1313',
      port: 8545,
      gasPrice: 1,
    },
    btevm_testnet: {
      network_id: '945',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        process.env.BTEVM_TESTNET_RPC_URL || 'https://test.chain.opentensor.ai',
        0,
        1,
        true, // shareNonce
        'm/44\'/60\'/0\'/0/', // derivationPath
        false, // polling disabled
      ),
      gasPrice: Number(process.env.GAS_PRICE) || 1000000000, // 1 gwei
      gas: 8000000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 500,
      confirmations: 1,
      websockets: false,
      skipDryRun: true,
      disableConfirmationListener: true,
      deploymentPollingInterval: 60000, // 1 minute
      networkCheckTimeout: 120000, // 2 minutes
      verify: {
        apiUrl: 'https://api-testnet.bttcscan.com/api',
        apiKey: process.env.BTTCSCAN_API_KEY,
      },
      // Optimize migration settings
      dryRun: false,
      skipPreflight: true,
      chainId: 945,
    },
    btevm_mainnet: {
      network_id: '964',
      provider: () => {
        const provider = new HDWalletProvider({
          privateKeys: [process.env.DEPLOYER_PRIVATE_KEY],
          providerOrUrl: process.env.BTEVM_MAINNET_RPC_URL,
          chainId: 964,
          polling: false,
          pollingInterval: 0,
          shareNonce: true,
          derivationPath: 'm/44\'/60\'/0\'/0/',
          disablePolling: true,
        });
        return provider;
      },
      gasPrice: Number(process.env.GAS_PRICE) || 10000000000, // 10 gwei
      gas: 7000000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 1000,
      confirmations: 2,
      websockets: false,
      skipDryRun: true,
      disableConfirmationListener: true,
      deploymentPollingInterval: 0,
      networkCheckTimeout: 0,
      verify: {
        apiUrl: 'https://api.bttcscan.com/api',
        apiKey: process.env.BTTCSCAN_API_KEY,
      },
      // Optimize migration settings
      dryRun: false,
      skipPreflight: true,
      chainId: 964,
      // Disable all polling
      pollingInterval: 0,
      pollingTimeout: 0,
      disablePolling: true,
    },
    mainnet: {
      network_id: '1',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        process.env.ETHEREUM_WS_NODE_MAINNET,
        0,
        1,
      ),
      gasPrice: Number(process.env.GAS_PRICE),
      gas: 4900000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 500,
    },
    kovan: {
      network_id: '42',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        process.env.ETHEREUM_WS_NODE_KOVAN,
        0,
        1,
      ),
      gasPrice: 1100000000, // 1.1 gwei
      gas: 6900000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 500,
    },
  },
  plugins: ['solidity-coverage'],
  mocha: {
    timeout: false,
  },
};
