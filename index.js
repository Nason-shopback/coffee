'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const request = require('request');

const cheerio = require('cheerio')
// getting-started.js
const mongoose = require('mongoose');
mongoose.connect('mongodb://admin:admin123@ds135757.mlab.com:35757/slave');
// const mongodb = require('mongodb');
// const MongoClient = mongodb.MongoClient;
// create LINE SDK config from env variables
const config = {
  channelAccessToken: '3fIe/4upQMWouWdAdN9POh9Gx/pM2x/3ZpvU7CGTL2BokVGWCHmrzA7XkpZa1sCAWqhzlvWUr9sb38jQq6be25cabH3U7gk4RQjAKNdxpr72K1z4MEoJyIFo6q4ElL8qlEVAnKxyuNoTv/BCiCUPaAdB04t89/1O/w1cDnyilFU=',
  channelSecret: '23e875b7f89a534de55249f2c5911639',
};
const db = mongoose.connection;


// base URL for webhook server
const baseURL = 'https://coffee-nason.herokuapp.com/';

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// serve static and downloaded files
app.use('/static', express.static('static'));
app.use('/downloaded', express.static('downloaded'));

// webhook callback
app.post('/callback', line.middleware(config), (req, res) => {
  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  // handle events separately
  Promise.all(req.body.events.map(handleEvent))
  .then(() => res.end())
  .catch((err) => {
    console.error(err);
    res.status(500).end();
  });
});

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
    );
};

// callback function to handle a single event
function handleEvent(event) {
  switch (event.type) {
    case 'message':
    const message = event.message;
    switch (message.type) {
      case 'text':
      return handleText(message, event.replyToken, event.source);
      case 'image':
      return handleImage(message, event.replyToken);
      case 'video':
      return handleVideo(message, event.replyToken);
      case 'audio':
      return handleAudio(message, event.replyToken);
      case 'location':
      return handleLocation(message, event.replyToken);
      case 'sticker':
      return handleSticker(message, event.replyToken);
      default:
      throw new Error(`Unknown message: ${JSON.stringify(message)}`);
    }

    case 'follow':
    return replyText(event.replyToken, 'Got followed event');

    case 'unfollow':
    return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case 'join':
    return replyText(event.replyToken, `Joined ${event.source.type}`);

    case 'leave':
    return console.log(`Left: ${JSON.stringify(event)}`);

    case 'postback':
    let data = event.postback.data;
    if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
      data += `(${JSON.stringify(event.postback.params)})`;
    }
    return replyText(event.replyToken, `Got postback: ${data}`);

    case 'beacon':
    return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);

    default:
    throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function handleText(message, replyToken, source) {
  const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;

  switch (message.text) {
    case 'profile':
    if (source.userId) {
      return client.getProfile(source.userId)
      .then((profile) => replyText(
        replyToken,
        [
        `Display name: ${profile.displayName}`,
        `Status message: ${profile.statusMessage}`,
        `Display userId: ${source.userId}`
        ]
        ));
    } else {
      return replyText(replyToken, 'Bot can\'t use profile API without user ID');
    }
    case 'buttons':
    return client.replyMessage(
      replyToken,
      {
        type: 'template',
        altText: 'Buttons alt text',
        template: {
          type: 'buttons',
          thumbnailImageUrl: buttonsImageURL,
          title: 'My button sample',
          text: 'Hello, my button',
          actions: [
          { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
          { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
          { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
          { label: 'Say message', type: 'message', text: 'Rice=米' },
          ],
        },
      }
      );
    case 'confirm':
    return client.replyMessage(
      replyToken,
      {
        type: 'template',
        altText: 'Confirm alt text',
        template: {
          type: 'confirm',
          text: 'Do it?',
          actions: [
          { label: 'Yes', type: 'message', text: 'Yes!' },
          { label: 'No', type: 'message', text: 'No!' },
          ],
        },
      }
      )
    case 'carousel':
    return client.replyMessage(
     replyToken,
     {
      type: 'template',
      altText: 'Carousel alt text',
      template: {
        type: 'carousel',
        columns: [
        {
          thumbnailImageUrl: buttonsImageURL,
          title: 'hoge',
          text: 'fuga',
          actions: [
          { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
          { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
          ],
        },
        {
          thumbnailImageUrl: buttonsImageURL,
          title: 'hoge',
          text: 'fuga',
          actions: [
          { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
          { label: 'Say message', type: 'message', text: 'Rice=米' },
          ],
        },
        ],
      },
    }
    );
    case 'image carousel':
    return client.replyMessage(
      replyToken,
      {
        type: 'template',
        altText: 'Image carousel alt text',
        template: {
          type: 'image_carousel',
          columns: [
          {
            imageUrl: buttonsImageURL,
            action: { label: 'Go to LINE', type: 'uri', uri: 'https://line.me' },
          },
          {
            imageUrl: buttonsImageURL,
            action: { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
          },
          {
            imageUrl: buttonsImageURL,
            action: { label: 'Say message', type: 'message', text: 'Rice=米' },
          },
          {
            imageUrl: buttonsImageURL,
            action: {
              label: 'datetime',
              type: 'datetimepicker',
              data: 'DATETIME',
              mode: 'datetime',
            },
          },
          ]
        },
      }
      );
    case 'datetime':
    return client.replyMessage(
      replyToken,
      {
        type: 'template',
        altText: 'Datetime pickers alt text',
        template: {
          type: 'buttons',
          text: 'Select date / time !',
          actions: [
          { type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
          { type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
          { type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
          ],
        },
      }
      );
    case 'imagemap':
    return client.replyMessage(
      replyToken,
      {
        type: 'imagemap',
        baseUrl: `${baseURL}/static/rich`,
        altText: 'Imagemap alt text',
        baseSize: { width: 1040, height: 1040 },
        actions: [
        { area: { x: 0, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/manga/en' },
        { area: { x: 520, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/music/en' },
        { area: { x: 0, y: 520, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/play/en' },
        { area: { x: 520, y: 520, width: 520, height: 520 }, type: 'message', text: 'URANAI!' },
        ],
      }
      );
    case 'bye':
    switch (source.type) {
      case 'user':
      return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
      case 'group':
      return replyText(replyToken, 'Leaving group')
      .then(() => client.leaveGroup(source.groupId));
      case 'room':
      return replyText(replyToken, 'Leaving room')
      .then(() => client.leaveRoom(source.roomId));
    }
    default:
    console.log(`Echo message to ${replyToken}: ${message.text}`);
    return replyText(replyToken, message.text);
  }
}

function handleImage(message, replyToken) {
  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpeg`);
  const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpeg`);

  return downloadContent(message.id, downloadPath)
  .then((downloadPath) => {
      // ImageMagick is needed here to run 'convert'
      // Please consider about security and performance by yourself
      cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);

      return client.replyMessage(
        replyToken,
        {
          type: 'image',
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
        }
        );
    });
}

function handleVideo(message, replyToken) {
  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp4`);
  const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

  return downloadContent(message.id, downloadPath)
  .then((downloadPath) => {
      // FFmpeg and ImageMagick is needed here to run 'convert'
      // Please consider about security and performance by yourself
      cp.execSync(`convert mp4:${downloadPath}[0] jpeg:${previewPath}`);

      return client.replyMessage(
        replyToken,
        {
          type: 'video',
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
        }
        );
    });
}

function handleAudio(message, replyToken) {
  const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.m4a`);

  return downloadContent(message.id, downloadPath)
  .then((downloadPath) => {
    var getDuration = require('get-audio-duration');
    var audioDuration;
    getDuration(downloadPath)
    .then((duration) => { audioDuration = duration; })
    .catch((error) => { audioDuration = 1; })
    .finally(() => {
      return client.replyMessage(
        replyToken,
        {
          type: 'audio',
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          duration: audioDuration * 1000,
        }
        );
    });
  });
}

function downloadContent(messageId, downloadPath) {
  return client.getMessageContent(messageId)
  .then((stream) => new Promise((resolve, reject) => {
    const writable = fs.createWriteStream(downloadPath);
    stream.pipe(writable);
    stream.on('end', () => resolve(downloadPath));
    stream.on('error', reject);
  }));
}

function handleLocation(message, replyToken) {
  // return replyText(replyToken, [message.address, message.latitude, message.longitude]);
  return client.replyMessage(
    replyToken,
    {
      type: 'location',
      title: 'your location',
      address: message.address,
      latitude: message.latitude,
      longitude: message.longitude,
    }
    );
}

function handleSticker(message, replyToken) {
  return client.replyMessage(
    replyToken,
    {
      type: 'sticker',
      packageId: message.packageId,
      stickerId: message.stickerId,
    }
    );
}
const pushArticle = ()=>{
  // db.on('error', console.error.bind(console, 'connection error:'));
  // db.once('open', function() {
  //   console.log('we\'re connected!');
  //   var ArticleSchema = new mongoose.Schema({
  //     title:String,
  //     href:String,
  //     category:String
  //   });
  //   var ArticleModel = db.model('Article',ArticleSchema);
    const url = 'https://www.iflscience.com/';
    request(url, (err, res, body) => {
    // console.log(body);
    const $ = cheerio.load(body);
    let Articles = [];
    Articles = $('.page .main-content article .content').find('a');
    // console.log(Articles);
    console.log('type= '+typeof(Articles));
    for(var index =0 ; index<3; index++){
      client.pushMessage('U505af16bb05fed728c8f39f72806de75',{
        "type": "text",
        "text": "選一篇喜歡的文章來讀吧~\n"+
                "1.\n 主題："+Articles[index.toString()]["attribs"]["title"]+
                "\n類別："+Articles[index.toString()]["attribs"]["href"].split("/")[3]+
                "\n"+Articles[index.toString()]["attribs"]["href"]
      });
      // var articleEntity = new ArticleModel(
      // {
      //   title:Articles[index.toString()]["attribs"]["title"],
      //   href:Articles[index.toString()]["attribs"]["href"],
      //   category: Articles[index.toString()]["attribs"]["href"].split("/")[3]
      // });
      // articleEntity.save();
    }
    
  })

  // });
};
setInterval(pushArticle,3000);
// listen on port
const port = process.env.PORT || 3033;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
