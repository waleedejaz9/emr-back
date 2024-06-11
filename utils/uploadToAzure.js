const { BlobServiceClient } = require("@azure/storage-blob");
// const { AZURE_STORAGE_CONNECTION_STRING, CONTAINER_NAME } = require("../config/azureConfig");

const uploadToAzure = async (file, ContaninerName) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    "DefaultEndpointsProtocol=https;AccountName=emrtraining;AccountKey=DrhWqb3BfWBzmTuPxrvuW/iQYTHo5aPmfLZksnNmgQeb01O2owx4l1V2g86YLYI/mJqF0MM9aC+++AStRlw2eg==;EndpointSuffix=core.windows.net"
  );
  const containerClient = blobServiceClient.getContainerClient("emr-training");
  const blobName = `${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer);

  return blockBlobClient.url;
};

module.exports = uploadToAzure;
