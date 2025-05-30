/*

    Copyright 2020 dYdX Trading Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

const {
  getChainId,
  isDevNetwork,
  getChainlinkPriceOracleAddress,
  getMakerPriceOracleAddress,
  getDeployerAddress,
  getOracleAdjustment,
  getChainlinkOracleAdjustmentExponent,
  getInverseOracleAdjustmentExponent,
  getTokenAddress,
  getWethAddress,
  getMinCollateralization,
  getInsuranceFundAddress,
  getInsuranceFee,
  getDeleveragingOperatorAddress,
  getFundingRateProviderAddress,
  getSoloAddress,
  addDeploymentDelay,
} = require('./helpers');

// ============ Constants ============

const SOLO_USDC_MARKET = 2;

// ============ Contracts ============

// Base Protocol
const PerpetualProxy = artifacts.require('PerpetualProxy');
const PerpetualV1 = artifacts.require('PerpetualV1');

// Funding Oracles
const P1FundingOracle = artifacts.require('P1FundingOracle');
const P1InverseFundingOracle = artifacts.require('P1InverseFundingOracle');

// Traders
const P1Orders = artifacts.require('P1Orders');
const P1InverseOrders = artifacts.require('P1InverseOrders');
const P1Deleveraging = artifacts.require('P1Deleveraging');
const P1Liquidation = artifacts.require('P1Liquidation');

// Price Oracles
const P1ChainlinkOracle = artifacts.require('P1ChainlinkOracle');
const P1MakerOracle = artifacts.require('P1MakerOracle');
const P1OracleInverter = artifacts.require('P1OracleInverter');
const P1MirrorOracleETHUSD = artifacts.require('P1MirrorOracleETHUSD');

// Proxies
const P1CurrencyConverterProxy = artifacts.require('P1CurrencyConverterProxy');
const P1LiquidatorProxy = artifacts.require('P1LiquidatorProxy');
const P1SoloBridgeProxy = artifacts.require('P1SoloBridgeProxy');
const P1WethProxy = artifacts.require('P1WethProxy');

// Test Contracts
const TestExchangeWrapper = artifacts.require('Test_ExchangeWrapper');
const TestLib = artifacts.require('Test_Lib');
const TestP1Funder = artifacts.require('Test_P1Funder');
const TestP1Monolith = artifacts.require('Test_P1Monolith');
const TestP1Oracle = artifacts.require('Test_P1Oracle');
const TestP1Trader = artifacts.require('Test_P1Trader');
const TestSolo = artifacts.require('Test_Solo');
const TestToken = artifacts.require('Test_Token');
const TestToken2 = artifacts.require('Test_Token2');
const TestMakerOracle = artifacts.require('Test_MakerOracle');
const TestChainlinkAggregator = artifacts.require('Test_ChainlinkAggregator');
const WETH9 = artifacts.require('WETH9');

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await deployTestContracts(deployer, network);
  await deployProtocol(deployer, network, accounts);
  await deployOracles(deployer, network);
  await initializePerpetual(deployer, network);
  await deployTraders(deployer, network);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployTestContracts(deployer, network) {
  if (isDevNetwork(network)) {
    await addDeploymentDelay('TestExchangeWrapper');
    await deployer.deploy(TestExchangeWrapper);
    
    await addDeploymentDelay('TestLib');
    await deployer.deploy(TestLib);
    
    await addDeploymentDelay('TestP1Funder');
    await deployer.deploy(TestP1Funder);
    
    await addDeploymentDelay('TestP1Monolith');
    await deployer.deploy(TestP1Monolith);
    
    await addDeploymentDelay('TestP1Oracle');
    await deployer.deploy(TestP1Oracle);
    
    await addDeploymentDelay('TestP1Trader');
    await deployer.deploy(TestP1Trader);
    
    await addDeploymentDelay('TestSolo');
    await deployer.deploy(TestSolo);
    
    await addDeploymentDelay('TestToken');
    await deployer.deploy(TestToken);
    
    await addDeploymentDelay('TestToken2');
    await deployer.deploy(TestToken2);
    
    await addDeploymentDelay('TestMakerOracle');
    await deployer.deploy(TestMakerOracle);
    
    await addDeploymentDelay('TestChainlinkAggregator');
    await deployer.deploy(TestChainlinkAggregator);
    
    await addDeploymentDelay('WETH9');
    await deployer.deploy(WETH9);
  }
}

async function deployProtocol(deployer, network, accounts) {
  await addDeploymentDelay('PerpetualV1');
  await deployer.deploy(PerpetualV1);
  
  await addDeploymentDelay('PerpetualProxy');
  await deployer.deploy(
    PerpetualProxy,
    PerpetualV1.address, // logic
    getDeployerAddress(network, accounts), // admin
    '0x', // data
  );
  console.log('perpetual proxy deployed');
}

async function deployOracles(deployer, network) {
  // Get external oracle addresses.
  const chainlinkOracle = getChainlinkPriceOracleAddress(network, TestChainlinkAggregator);
  const makerOracle = getMakerPriceOracleAddress(network, TestMakerOracle);

  // Deploy funding oracles, Maker oracle wrapper, and Chainlink oracle wrapper sequentially
  await addDeploymentDelay('P1FundingOracle');
  await deployer.deploy(
    P1FundingOracle,
    getFundingRateProviderAddress(network),
  );
  
  await addDeploymentDelay('P1InverseFundingOracle');
  await deployer.deploy(
    P1InverseFundingOracle,
    getFundingRateProviderAddress(network),
  );
  
  await addDeploymentDelay('P1ChainlinkOracle');
  await deployer.deploy(
    P1ChainlinkOracle,
    chainlinkOracle,
    PerpetualProxy.address,
    getChainlinkOracleAdjustmentExponent(network),
  );
  
  await addDeploymentDelay('P1MakerOracle');
  await deployer.deploy(P1MakerOracle);

  // Deploy oracle inverter.
  await addDeploymentDelay('P1OracleInverter');
  await deployer.deploy(
    P1OracleInverter,
    P1MakerOracle.address,
    PerpetualProxy.address,
    getInverseOracleAdjustmentExponent(network),
  );

  // Deploy mirror oracle.
  await addDeploymentDelay('P1MirrorOracleETHUSD');
  await deployer.deploy(
    P1MirrorOracleETHUSD,
    makerOracle,
  );

  // Configure routing and permissions sequentially
  const oracle = await P1MakerOracle.deployed();
  const mirror = await P1MirrorOracleETHUSD.deployed();
  
  await addDeploymentDelay('Setting oracle routes');
  await oracle.setRoute(
    PerpetualProxy.address,
    makerOracle,
  );
  
  await addDeploymentDelay('Setting oracle inverter routes');
  await oracle.setRoute(
    P1OracleInverter.address,
    makerOracle,
  );
  
  await addDeploymentDelay('Setting oracle adjustment');
  await oracle.setAdjustment(
    makerOracle,
    getOracleAdjustment(network),
  );
  
  await addDeploymentDelay('Setting mirror oracle permissions');
  await mirror.kiss(
    P1MakerOracle.address,
  );
}

async function deployTraders(deployer, network) {
  // deploy traders sequentially
  await addDeploymentDelay('P1Orders');
  await deployer.deploy(
    P1Orders,
    PerpetualProxy.address,
    getChainId(network),
  );
  
  await addDeploymentDelay('P1InverseOrders');
  await deployer.deploy(
    P1InverseOrders,
    PerpetualProxy.address,
    getChainId(network),
  );
  
  await deployer.deploy(
    P1Deleveraging,
    PerpetualProxy.address,
    getDeleveragingOperatorAddress(network),
  );
  
  await deployer.deploy(
    P1Liquidation,
    PerpetualProxy.address,
  );

  // deploy proxies sequentially
  await deployer.deploy(
    P1CurrencyConverterProxy,
  );
  
  await deployer.deploy(
    P1LiquidatorProxy,
    PerpetualProxy.address,
    P1Liquidation.address,
    getInsuranceFundAddress(network),
    getInsuranceFee(network),
  );
  
  await deployer.deploy(
    P1SoloBridgeProxy,
    getSoloAddress(network, TestSolo),
    getChainId(network),
  );
  
  await deployer.deploy(
    P1WethProxy,
    getWethAddress(network, WETH9),
  );

  // initialize proxies on non-testnet
  if (!isDevNetwork(network)) {
    const currencyConverterProxy = await P1CurrencyConverterProxy.deployed();
    await currencyConverterProxy.approveMaximumOnPerpetual(PerpetualProxy.address);

    const liquidatorProxy = await P1LiquidatorProxy.deployed();
    await liquidatorProxy.approveMaximumOnPerpetual();

    const soloBridgeProxy = await P1SoloBridgeProxy.deployed();
    await soloBridgeProxy.approveMaximumOnPerpetual(PerpetualProxy.address);
    await soloBridgeProxy.approveMaximumOnSolo(SOLO_USDC_MARKET);

    const wethProxy = await P1WethProxy.deployed();
    await wethProxy.approveMaximumOnPerpetual(PerpetualProxy.address);
  }

  // set global operators sequentially
  const perpetual = await PerpetualV1.at(PerpetualProxy.address);
  
  await perpetual.setGlobalOperator(P1Orders.address, true);
  await perpetual.setGlobalOperator(P1Deleveraging.address, true);
  await perpetual.setGlobalOperator(P1Liquidation.address, true);
  await perpetual.setGlobalOperator(P1CurrencyConverterProxy.address, true);
  await perpetual.setGlobalOperator(P1LiquidatorProxy.address, true);
  await perpetual.setGlobalOperator(P1SoloBridgeProxy.address, true);
  await perpetual.setGlobalOperator(P1WethProxy.address, true);
  
  if (isDevNetwork(network)) {
    await perpetual.setGlobalOperator(TestP1Trader.address, true);
  }
}

async function initializePerpetual(deployer, network) {
  const perpetual = await PerpetualV1.at(PerpetualProxy.address);
  if (!isDevNetwork(network)) {
    await perpetual.initializeV1(
      getTokenAddress(network),
      P1MakerOracle.address,
      P1FundingOracle.address,
      getMinCollateralization(network),
    );
  }
}
