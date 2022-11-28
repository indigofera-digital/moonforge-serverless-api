# Serverless HTTP API with DynamoDB and offline support

This example demonstrates how to run a service locally, using the
[serverless-offline](https://github.com/dherault/serverless-offline) plugin. It
provides an HTTP API to manage Todos stored in a DynamoDB, similar to the
[aws-node-http-api-dynamodb](https://github.com/serverless/examples/tree/master/aws-node-http-api-dynamodb)
example. A local DynamoDB instance is provided by the
[serverless-dynamodb-local](https://github.com/99xt/serverless-dynamodb-local)
plugin.

## Use-case

Test your service locally, without having to deploy it first.

## Setup

```bash
npm install
serverless dynamodb install (or to use a persistent docker dynamodb instead, open a new terminal: cd ./dynamodb && docker-compose up -d)
serverless offline start (this CREATES dynamodb table, local invoke does not create/update dynamodb table)
serverless dynamodb migrate (this imports schema)
```

## Run service offline

```bash
serverless offline start

serverless invoke local -f listCollections -s dev
```


## Deployment

```
serverless deploy --stage production --region eu-central-1
```


## Local testing

```
serverless offline start --stage local
```
