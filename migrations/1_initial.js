const Migrations = artifacts.require('./Migrations.sol');
const { addDeploymentDelay } = require('./helpers');

const migration = async (deployer) => {
  await addDeploymentDelay('Migrations');
  await deployer.deploy(Migrations);
};

module.exports = migration;
