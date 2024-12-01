// 파일: azureUtil.js
const { v4: uuidv4 } = require("uuid");
const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

require("dotenv").config();

// Azure Storage 연결 초기화
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME; // .env에서 계정 이름 가져오기
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY; // .env에서 계정 키 가져오기
const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

// SAS URL 생성 시 필요한 Shared Key Credential
const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

/**
 * 파일 업로드
 * @param {string} containerName - 파일 컨테이너 이름
 * @param {Buffer} fileBuffer - 업로드할 파일의 버퍼 데이터
 * @param {string} originalName - 파일의 원본 이름
 * @param {string} mimeType - 파일 MIME 타입
 */
async function uploadFile(containerName, fileBuffer, originalName) {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Blob 이름 생성 (UUID + 원본 파일 이름)
    const blobName = `${uuidv4()}_${originalName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Azure에 업로드
    await blockBlobClient.upload(fileBuffer, fileBuffer.length);

    // 업로드된 파일의 URL 반환
    return { url: blockBlobClient.url, blobName };
  } catch (error) {
    console.error("Error uploading blob:", error.message);
    throw error;
  }
}

/**
 * SAS URL 생성
 * @param {string} containerName - Blob 컨테이너 이름
 * @param {string} blobName - Blob 이름
 * @param {number} expiryHours - SAS URL 유효 시간 (시간 단위)
 * @returns {string} SAS URL
 */
function downloadSasUrl(containerName, blobName, expiryHours = 1) {
  try {
    console.log('111')
    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + expiryHours); // 만료 시간 설정
    console.log('222')
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // 읽기 권한
        expiresOn,
      },
      sharedKeyCredential
    ).toString();
    console.log('sasToken', sasToken)

    const blobClient = blobServiceClient
      .getContainerClient(containerName)
      .getBlobClient(blobName);
    console.log('blobClient', blobClient)
    const sasUrl = `${blobClient.url}?${sasToken}`;
    console.log(`Generated SAS URL: ${sasUrl}`);
    return sasUrl;
  } catch (error) {
    console.error("Error generating SAS URL:", error.message);
    return null;
  }
}

// 모듈 내보내기
module.exports = {
  uploadFile,
  downloadSasUrl,
};