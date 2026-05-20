const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

const getDriveClient = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: SCOPES,
  });

  return google.drive({
    version: "v3",
    auth,
  });
};

const buildImageUrl = (fileId) => {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

exports.listImagesInFolder = async (folderId) => {
  const drive = getDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
    fields:
      "files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink, createdTime)",
    orderBy: "name",
    pageSize: 200,
  });

  const files = res.data.files || [];

  return files.map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    thumbnailLink: file.thumbnailLink,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    createdTime: file.createdTime,

    // Link dùng để render ảnh trên web
    imageUrl: buildImageUrl(file.id),
  }));
};
