'use strict';

const _ = require('lodash');
const dynamodb = require('./dynamodb');
const mintImx = require('./mint-imx');

// Funtion used to open packs and mint puzzle parts
// Used after buy packs transaction is confirmed and on opening free packs
module.exports.openPack = async (event, context, callback) => {
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

  console.log(res);
  console.log(collection);

  // resolve token id and puzzle part
  let tokens = [];
  for (let i = 0; i < collection.openSize; i++) {
    const randomIndex = _.random(0, collection.mintedState.piecesPool.length - 1);
    const tokenId = collection.mintedState.piecesPool.splice(randomIndex, 1)[0];
    tokens.push({
      id: tokenId.toString(),
      blueprint: `${tokenId}`
    });
  }

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
