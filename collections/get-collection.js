'use strict';

const { Collections } = require('../utils/dynamodb');
const Responses = require('../utils/api-responses');

module.exports.getCollection = async (event, context, callback) => {
  try {
    const { Item: collection } = await Collections.get({ address: event.pathParameters.id });
    if (!collection) {
      return Responses._404({ message: `Collection ${event.pathParameters.id} not found` });
    }
    return Responses._200(collection);
  } catch (error) {
    console.log('error', error);
    return Responses._400({ message: error.message || `Couldn\'t fetch the collection ${event.pathParameters.id}` });
  }
};
