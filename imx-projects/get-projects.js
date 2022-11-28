'use strict';

const { ImmutableX } = require('@imtbl/core-sdk');
const config = require('../utils/config');
const Responses = require('../utils/api-responses');

module.exports = { getProjectsEndpoint, getProjectsFunction };

async function getProjectsEndpoint(event, context, callback) {

  try {
    const result = await getProjectsFunction();
    return Responses._200(result);
  }
  catch (error) {
    console.log('error', error);
    return Responses._400({ message: error.message || 'Couldn\'t fetch the projects.' });
  }
};

async function getProjectsFunction() {

  const imxClient = new ImmutableX(config.imxConfig);
  return await imxClient.getProjects(
    config.systemWallet.ethSigner,
    10000
  );
}
