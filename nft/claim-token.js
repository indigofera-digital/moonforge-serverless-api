'use strict';

const _ = require('lodash');
const { MoonforgeTable, Collections, NFT } = require('../utils/dynamodb');
const mintImx = require('./mint-imx');
const Responses = require('../utils/api-responses');

module.exports.claimToken = async (event, context, callback) => {
  try {
    const body = JSON.parse(event.body);

    const receiverAddress = body.receiverAddress;
    const { Item: collection } = await Collections.get({ address: body.collectionAddress });
    if (!collection) {
      return Responses._404({ message: `Collection ${body.collectionAddress} not found` });
    }

    // resolve token Id and assemble token metadata based on collection/game type
    const prizePool = _.get(collection, 'remainingPrizePool', []);
    if (prizePool.length == 0) {
      return Responses._400({ message: `Collection ${collection.address} has no remaining prizes` });
    }
    const randomIndex = _.random(0, prizePool.length - 1);
    const tokenId = prizePool.splice(randomIndex, 1)[0];

    const tokens = [{
      id: tokenId.toString(),
      blueprint: `${tokenId}`
    }];
    // mint token
    const minted = await mintImx(collection.address, tokens, receiverAddress);

    console.log(prizePool);

    await Collections.update({
      address: collection.address,
      remainingPrizePool: prizePool
    })    

    return Responses._200(minted);
  }
  catch (error) {
    console.log('error', error);
    return Responses._400({ message: error.message || 'Couldn\'t not claim prize reward' });
  }

  // resolve token id and puzzle part
  //   let tokens = [];
  //   for (let i = 0; i < collection.openSize; i++) {
  //     const randomIndex = _.random(0, collection.mintedState.piecesPool.length - 1);
  //     const tokenId = collection.mintedState.piecesPool.splice(randomIndex, 1)[0];
  //     tokens.push({
  //       id: tokenId.toString(),
  //       blueprint: `${tokenId}`
  //     });
  //   }

  //   // mint on imx
  //   const minted = await mintImx(collection, tokens, data.receiverAddress);

  //   const params = {
  //     TableName: process.env.DYNAMODB_TABLE,
  //     Item: collection
  //   }
  //   await dynamodb.put(params).promise()

  //   const response = {
  //     statusCode: 200,
  //     body: JSON.stringify({"ok": true}),
  //   };
  //   return response;
};
