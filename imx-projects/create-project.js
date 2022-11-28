'use strict';

const { ImmutableX } = require('@imtbl/core-sdk');
const config = require('../utils/config');
const Responses = require('../utils/api-responses');

module.exports = { createProjectEndpoint, createProjectFunction };

function createProjectEndpoint(event, context, callback) {
    try {
    const createProjectResponse = createProjectFunction(...JSON.parse(event.body));
    return Responses._200(createProjectResponse);
  } catch (error) {
    console.log('error', error);
    return Responses._400({ message: error.message || 'Couldn\'t create the project.' });
  }
};

async function createProjectFunction(projectParams) {
  
  const imxClient = new ImmutableX(config.imxConfig);
  return await imxClient.createProject(
    config.systemWallet.ethSigner,
    projectParams,
  );
}
