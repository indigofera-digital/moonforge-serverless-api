'use strict';

const { ImmutableX } = require('@imtbl/core-sdk');
const config = require('../utils/config');
const Responses = require('../utils/api-responses');

module.exports = { getProjectEndpoint, getProjectFunction };

async function getProjectEndpoint(event, context, callback) {

  try {
    const result = await getProjectFunction(event.pathParameters.id);
    return Responses._200(result);
  }
  catch (error) {
    console.log('error', error);
    return Responses._400({ message: error.message || `Couldn\'t fetch the project with id ${event.pathParameters.id}` });
  }
};

async function getProjectFunction(projectId) {

  const imxClient = new ImmutableX(config.imxConfig);
  return await imxClient.getProject(
    config.systemWallet.ethSigner,
    projectId
  );
}
