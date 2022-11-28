const { Config, createStarkSigner } = require('@imtbl/core-sdk');
const { AlchemyProvider } = require('@ethersproject/providers');
const { Wallet } = require('@ethersproject/wallet');

module.exports = configInit();

function configInit() {

    const network = getEnv('ETH_NETWORK');
    const imxConfig = network === 'mainnet' ? Config.PRODUCTION : Config.SANDBOX;

    const privateKey = getEnv('PRIVATE_KEY');
    return {
        imxConfig: imxConfig,
        systemWallet: generateWalletConnection(privateKey, getEnv('STARK_KEY'), network, getEnv('ALCHEMY_API_KEY')),
        alchemyApiKey: getEnv('ALCHEMY_API_KEY'),
        alchemyChainRPC: getEnv('ALCHEMY_CHAIN_RPC'),
        network: getEnv('ETH_NETWORK'),
        gasLimit: getEnv('GAS_LIMIT'),
        gasPrice: getEnv('GAS_PRICE'),
        privateKey: privateKey,
        dynamoDBTable: getEnv('DYNAMODB_TABLE'),
        collectionFactoryAddress: getEnv('COLLECTION_FACTORY_ADDRESS'),
        contractFactoryJson: "../contracts-l1/AssetFactory.json",
        apiUrl: getEnv('API_URL'),
    }
}

function generateWalletConnection(userPrivateKey, userStarkKey, ethNetwork, alchemyKey) {
    // connect provider
  const provider = new AlchemyProvider(ethNetwork, alchemyKey);

  // L1 credentials
  const ethSigner = new Wallet(userPrivateKey).connect(provider);

  // L2 credentials
  const starkSigner = createStarkSigner(userStarkKey);

  return {
    ethSigner,
    starkSigner,
  };
}

function getEnv(name, defaultValue = undefined) {
    const value = process.env[name];

    if (value !== undefined) {
        return value;
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    throw new Error(`Environment variable '${name}' not set`);
}