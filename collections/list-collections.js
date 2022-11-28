'use strict';

const { Collections } = require('../utils/dynamodb');
const Responses = require('../utils/api-responses');
const _ = require('lodash');

module.exports.listCollections = async (event, context, callback) => {
  try {
    const brand = _.get(event.queryStringParameters, 'brand', null);
    const params = brand ? { filters: { attr: 'clientName', eq: brand } } : undefined;
    const result = await Collections.query('collection#', params);
    return Responses._200(result.Items);
  }
  catch (error) {
    console.log('error', error);
    return Responses._400({ message: error.message || 'Couldn\'t fetch the collections' });
  }
};
