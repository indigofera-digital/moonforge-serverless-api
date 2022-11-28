'use strict';

const { ImmutableX } = require('@imtbl/core-sdk');
const config = require('../utils/config');
const Responses = require('../utils/api-responses');

module.exports = async function mintImx(collectionAddress, tokens, receiverAddress) {

    const imxClient = new ImmutableX(config.imxConfig);

    const mintParams = {
        contract_address: collectionAddress,
        users: [
            {
                tokens: tokens,
                user: receiverAddress,
            },
        ],
    };

    const mintResponse = await imxClient.mint(
        config.systemWallet.ethSigner,
        mintParams,
    );

    console.log('mintResponse', JSON.stringify(mintResponse));

    return mintResponse;
};
