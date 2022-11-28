'use strict';

const _ = require('lodash');
const dynamodb = require('./dynamodb');
const mintImx = require('./mint-imx');

// Forging - check puzzle piece - burn them and mint complete puzzle to forger address
module.exports.forge = async (event, context, callback) => {
  const data = JSON.parse(event.body);
  console.log(data);

  // if (typeof data.name !== 'string' || typeof data.pieces !== 'number') { // TODO validation check
  //   console.error('Validation Failed');
  //   callback(null, {
  //     statusCode: 400,
  //     headers: { 'Content-Type': 'text/plain' },
  //     body: 'Couldn\'t create collection.',
  //   });
  //   return;
  // }

  const getParams = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: data.collectionAddress,
    },
  };
  const res = await dynamodb.get(getParams).promise()
  const collection = res.Item;

  // resolve token id and puzzle part
  const randomIndex = _.random(0, collection.mintedState.puzzlesPool.length - 1);
  const tokenId = collection.mintedState.puzzlesPool.splice(randomIndex, 1)[0];
  const tokens = [{
    id: tokenId.toString(),
    blueprint: `${tokenId}`,
    // overriding royalties for complete puzzle
    royalties: [{                                        
      recipient: collection.feeCollectorAddress.toLowerCase(),
      percentage: 5
    }],
  }];
  // mint on imx
  const minted = await mintImx(collection, tokens, data.receiverAddress);

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: collection
  }
  await dynamodb.put(params).promise()

  const response = {
    statusCode: 200,
    body: JSON.stringify({"ok": true}),
  };
  return response;
};
