'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const { Table, Entity } = require('dynamodb-toolbox');
const config = require('../utils/config');

let options = {};

// connect to local DB if running offline
if (process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
  };
}

const DocumentClient = new AWS.DynamoDB.DocumentClient(options);

const MoonforgeTable = new Table({
  name: config.dynamoDBTable,

  partitionKey: 'pk',
  sortKey: 'sk',

  DocumentClient
});

const Collections = new Entity({
  name: 'Collections',

  attributes: {
    pk: { partitionKey: true, default: 'collection#', hidden: true },
    sk: { sortKey: true, prefix: 'collection#', hidden: true },
    // collectionId: { type: 'string' },
    address: ['sk', 0, { save: true, required: true }],
    name: { type: 'string' },
    description: { type: 'string' },
    projectId: { type: 'string' },
    clientName: { type: 'string' },
    symbol: { type: 'string' },
    openSeaBaseUri: { type: 'string' },
    immutablexBaseUri: { type: 'string' },
    imageUrl: { type: 'string' },
    iconUrl: { type: 'string' },
    remainingPrizePool: { type: 'list' },
  },

  table: MoonforgeTable
});

const NFTs = new Entity({
  name: 'NFTs',

  attributes: {
    pk: { partitionKey: true, prefix: 'collection#', hidden: true },
    sk: { sortKey: true, prefix: 'token#', hidden: true },
    address: ['pk', 0, { save: true, required: true }],
    tokenId: ['sk', 0, { save: true, required: true }],
    name: { type: 'string' },
    description: { type: 'string' },
    imageUrl: { type: 'string' },
    attributes: { type: 'list' },
  },

  table: MoonforgeTable
});

const Brand = new Entity({
  name: 'Brand',

  attributes: {
    pk: { partitionKey: true, default: 'collection#' },
    sk: { sortKey: true, prefix: 'collection#' },
    address: ['sk', 0, { save: true, required: true }],
    name: { type: 'string' },
    description: { type: 'string' },
    projectId: { type: 'number' },
  },

  table: MoonforgeTable
});

module.exports = { MoonforgeTable: MoonforgeTable, Collections: Collections, NFTs: NFTs };