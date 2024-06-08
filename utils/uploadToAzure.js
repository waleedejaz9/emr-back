const { BlobServiceClient } = require("@azure/storage-blob");
const { azureKey,azureContainerName } = require("../config");
// const { AZURE_STORAGE_CONNECTION_STRING, CONTAINER_NAME } = require("../config/azureConfig");


const uploadToAzure = async (file, ContaninerName) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    azureKey
  );
  const containerClient = blobServiceClient.getContainerClient(azureContainerName);
  const blobName = `${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer);

  return blockBlobClient.url;
};

module.exports = uploadToAzure;
