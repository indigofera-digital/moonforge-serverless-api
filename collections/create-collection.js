'use strict';

const { ImmutableX, Config, createStarkSigner } = require('@imtbl/core-sdk');
const _ = require('lodash');
const { MoonforgeTable, Collections, NFTs } = require('../utils/dynamodb');
const config = require('../utils/config');
const Responses = require('../utils/api-responses');
const Web3 = require('web3');
const shortuuid = require('short-uuid');
const factoryContractJSON = require(config.contractFactoryJson);
const createProject = require('../imx-projects/create-project').createProjectFunction;
const getProjects = require('../imx-projects/get-projects').getProjectsFunction;


// 1. Send transaction to factory and create new nft collection contract
// 2. Imx register new project or use existing one (project limits!)
// 3. Create collection on imx assigned to imx project (step 2)
// 4. Register collection metadata schema (?)

const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];

module.exports.createCollection = async (event, context, callback) => {
  const body = JSON.parse(event.body);

  // TODO validation
  // if (!body || !body.image || !body.mime) {
  //   return Responses._400({ message: 'incorrect body on request' });
  // }
  // if (!allowedMimes.includes(body.mime)) {
  //   return Responses._400({ message: 'mime is not allowed ' });
  // }

  // let imageData = body.image;
  // if (body.image.substr(0, 7) === 'base64,') {
  //   imageData = body.image.substr(7, body.image.length);
  // }

  // const buffer = Buffer.from(imageData, 'base64');
  // const fileInfo = await fileType.fromBuffer(buffer);
  // const detectedExt = fileInfo.ext;
  // const detectedMime = fileInfo.mime;

  // if (detectedMime !== body.mime) {
  //   return Responses._400({ message: 'mime types dont match' });
  // }


  try {

    // TODO form base uri for collection
    // const collectionId = shortuuid.generate();

    // https://apibaseuri/{opensea|immutablex}/{address}/{tokenId}[.json]
    const openSeaBaseUri = `${config.apiUrl}/opensea/`;

    // create collection contract on L1
    const web3 = new Web3(`${config.alchemyChainRPC}${config.alchemyApiKey}`);
    const suggestion_gas = await web3.eth.getGasPrice();
    console.log(suggestion_gas);

    const factoryContract = new web3.eth.Contract(factoryContractJSON.abi, config.collectionFactoryAddress);
    const createCollectionTx = {
      to: config.collectionFactoryAddress,
      data: factoryContract.methods.createCollection(
        config.systemWallet.ethSigner.address,
        body.name,
        body.symbol,
        openSeaBaseUri,
        config.imxConfig.ethConfiguration.coreContractAddress
      ).encodeABI(),
      // gas: 2000000
      gas: config.gasLimit
    };

    console.log("Submiting L1 transaction to create collection contract");
    const transaction = await web3.eth.accounts.signTransaction(createCollectionTx, config.privateKey);
    const transactionReceipt = await web3.eth.sendSignedTransaction(transaction.rawTransaction);
    const collectionAddress = transactionReceipt.logs[0].address;
    console.log('Collection contract created at address', collectionAddress);

    // create imx project or use existing one (per client)
    // find project by name where name is client name (brand)
    const imxProjects = await getProjects();
    let imxBrandProject;
    imxBrandProject = _.find(imxProjects.result, function (p) { return p.name === body.clientName && (p.collection_monthly_limit == 0 || p.collection_remaining > 0); });
    if (!imxBrandProject) {
      // create new project
      imxBrandProject = await createProject(
        {
          company_name: 'Moonforge',
          contact_email: 'djordje@hey.com',
          name: body.clientName,
        }
      );
      console.log('Created new project', imxBrandProject.id);
    }
    console.log('Assigning collection to project:', imxBrandProject);

    
    // process image inputs and upload to ipfs/s3 - collection images
    const collectionImageUrl = "https://moonforge.s3.eu-west-1.amazonaws.com/mfp/collection.jpg";
    const iconImageUrl = "https://moonforge.s3.eu-west-1.amazonaws.com/mfp/icon.png";

    // process nfts prize pool and upload nft images to ipfs/s3
    // const inputNFTdata = [
    //   {
    //     quantity: 1,
    //     name: "Moonforge NFT",
    //     description: "Moonforge NFT",
    //     image: "byte from front",
    //     attributes: [{'atkey': 'atval'}]
    //   }
    // ];

    
    const collectionImageBucket = `${config.s3Bucket}/collection/${collectionAddress}`;

    const prizePool = _.flatMap(body.prizes, (prize) => {  
      // upload image and set to image url TODO
      const imageByte = prize.image;
      // const imageUrl = `${collectionImageBucket}/${prize.name}.png`;
      const imageUrl = `https://moonforge.s3.eu-west-1.amazonaws.com/mfp/icon.png`;

      const nft = {
        address: collectionAddress,
        name: prize.name,
        description: prize.description,
        imageUrl: imageUrl,
        attributes: prize.attributes
      };

      return _.times(prize.quantity, () => nft);
    });

    const tokenizedPrizePool = _.map(_.shuffle(prizePool), (nft, index) => { return { ...nft, tokenId: index } });
    const remainingPrizePool = _.map(tokenizedPrizePool, 'tokenId');

    const result = await MoonforgeTable.batchWrite(
      _.map(tokenizedPrizePool, (nft) => MoonforgeTable.NFTs.putBatch(nft)),
      {
        capacity: 'total',
        metrics: 'size'
      }
    );
    console.log('NFT Batch write result', result);
    
    const immutablexBaseUri = `${config.apiUrl}/immutablex/${collectionAddress}`;
    const createCollectionParams = {
      contract_address: collectionAddress,
      name: body.name,
      owner_public_key: config.systemWallet.ethSigner.publicKey,
      project_id: imxBrandProject.id,

      description: body.description,
      collection_image_url: collectionImageUrl,
      icon_url: iconImageUrl,
      metadata_api_url: immutablexBaseUri,
    };

    const imxClient = new ImmutableX(config.imxConfig);
    const createCollectionResponse = await imxClient.createCollection(
      config.systemWallet.ethSigner,
      createCollectionParams,
    );
    console.log('Collection created on imx', createCollectionResponse);

    const collection = {
      address: collectionAddress,
      name: body.name,
      description: body.description,
      projectId: imxBrandProject.id.toString(),
      clientName: body.clientName,
      symbol: body.symbol,
      openSeaBaseUri: openSeaBaseUri,
      immutablexBaseUri: immutablexBaseUri,
      imageUrl: collectionImageUrl,
      iconUrl: iconImageUrl,
      remainingPrizePool: remainingPrizePool,
    }

    await Collections.put(collection);
    // const response = await Collections.get({ address: collectionAddress });
    
    return Responses._200(collection);

  } catch (error) {
    console.error('error', error);
    return Responses._400({ message: error.message || 'failed to create collection' });
  };

};
