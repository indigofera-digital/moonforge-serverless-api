'use strict';

const { NFTs } = require('../utils/dynamodb');
const Responses = require('../utils/api-responses');
const _ = require('lodash');

const supportedMarketplaces = ['opensea', 'immutablex'];

module.exports.getNFTMetadata = async (event, context, callback) => {
    try {

        const collectionAddress = event.pathParameters.address;
        const marketplace = event.pathParameters.marketplace;
        const tokenId = event.pathParameters.tokenId;

        if (!supportedMarketplaces.includes(marketplace)) {
            return Responses._400({ message: `${marketplace} not supported` });
        }

        const { Item: nft } = await NFTs.get({
            address: collectionAddress,
            tokenId: tokenId,
        });

        if (! nft) {
            return Responses._404({ message: `Token ${tokenId} not found` });
        }

        let metadata;

        if (marketplace === 'opensea') {
            metadata = {
                name: nft.name,
                description: nft.description,
                image: nft.imageUrl,
                attributes: _.map(nft.attributes, (att) => {
                    const key = _.keys(att)[0];
                    return {
                        trait_type: key,
                        value: _.get(att, key),
                    };
                }),
            };
        }
        if (marketplace === 'immutablex') {
            metadata = {
                name: nft.name,
                description: nft.description,
                image_url: nft.imageUrl,
                ..._.reduce(nft.attributes, (acc, att) => { return _.assign(acc, att) }, {}),
            };
        }

        return Responses._200(metadata);
    } catch (error) {
        console.log('error', error);
        return Responses._400({ message: error.message || 'Couldn\'t get NFT' });
    }
};
