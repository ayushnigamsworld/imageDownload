const serverless = require("serverless-http");
const express = require("express");
const app = express();
const axios = require('axios');
const fs = require('fs');

app.get("/breed/:breed", async (req, res, next) => {
  const breedName = req.params.breed;
  const limit = req.query ? req.query.limit : 1;
  let url = `https://dog.ceo/api/breed/${breedName}/images/random`;
  if (limit) {
    url = `${url}/${limit}`;
  }
  const result = await axios.get(`${url}`);
  const imgUrlArr = [];
  const imagesUrl = result.data.message;
  // handle error here
  if (Array.isArray(imagesUrl)) {
    imgUrlArr.push(...imagesUrl);
  } else {
    imgUrlArr.push(imagesUrl);
  }
  
  const promiseArr = [];
  const imgPathArr = [];
  
  for (const imgUrl of imgUrlArr) {
    let tempArr = imgUrl.split('/');
    const imgName = tempArr[tempArr.length - 1];
    const imgPath = `${imgName}`;
    imgPathArr.push(imgPath);
    promiseArr.push(downloadImage(imgUrl, imgPath));
  }
  await Promise.all(promiseArr);
  res.writeHead(200, {'content-type':'image/jpg'});
  for (const imgPath of imgPathArr) {
    fs.createReadStream(imgPath).pipe(res);
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

const downloadImage = async (url, image_path) => {
  const response = await axios({
    url,
    responseType: 'stream',
  });

  await response.data
          .pipe(fs.createWriteStream(image_path));
};
app.listen(3000);
module.exports.handler = serverless(app);
