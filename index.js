'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const request = require('request');
const Request = request.defaults({
  jar: true,
  headers: {
    cookie: 'NSC_BQQMF=ffffffffaf121a1545525d5f4f58455e445a4a423660',
  }
})

const cheerio = require('cheerio')
const mongoose = require('mongoose');
mongoose.connect('mongodb://admin:admin123@ds135757.mlab.com:35757/slave');
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
var sent = false;
var reservationInfo = [
{
  person_id: 'A134405743',
  from_station: '051',
  to_station: '100',
  getin_date: '2018/12/25',
  train_no: '271',
  n_order_qty_str: '1',
  returnTicket: '0'
},
{
  person_id: 'A145843937',
  from_station: '051',
  to_station: '100',
  getin_date: '2018/12/25',
  train_no: '271',
  n_order_qty_str: '1',
  returnTicket: '0'
},
{
  person_id: 'A146950048',
  from_station: '051',
  to_station: '100',
  getin_date: '2018/12/25',
  train_no: '271',
  n_order_qty_str: '1',
  returnTicket: '0'
},
{
  person_id: 'A195231530',
  from_station: '051',
  to_station: '100',
  getin_date: '2018/12/25',
  train_no: '271',
  n_order_qty_str: '1',
  returnTicket: '0'
},
];

function orderTic(replyToken, choice){
  initCookie()
  .then(() => {
    return fillInfo(replyToken, choice).catch(err => {console.log(err)});
  })
  .catch(err => {
    console.log(err);
  });
}


function initCookie () {
  return new Promise(done => {
    Request('http://railway.hinet.net', (err, res, body) => {
      done()
    })
  })
}

function fillInfo(replyToken, choice) {
  return new Promise(done => {
    var options = {
      url: 'http://railway.hinet.net/Foreign/common/check_etno1.jsp?language=zh_TW',
      method: 'POST',
      form: reservationInfo[choice],
      headers: {
        referer: 'http://railway.hinet.net/Foreign/TW/etno1.html',
      }
    }
    Request(options, (err, res, body) => {
      console.log(body);
      var $ = cheerio.load(body, {xmlMode: true});
      $('body').append($('table noscript').html());
      var codePic = 'http://railway.hinet.net/' + $('#idRandomPic').eq(1).attr('src');
      console.log('codePic: '+codePic);
      sent = true;
      const downloadPath = path.join(__dirname, 'downloaded', `${choice}.jpeg`);
      // const previewPath = path.join(__dirname, 'downloaded', `${choice}-preview.jpg`);
      Request('http://railway.hinet.net/' + $('#idRandomPic').eq(1).attr('src')).pipe(fs.createWriteStream(downloadPath)).on('close', done);
      client.replyMessage(replyToken, {
        type: 'text',
        text: codePic
      });
      client.replyMessage(replyToken, {
        type: 'image',
        originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
        previewImageUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
      }).catch(err => {console.log(err)});
    })
  });
}

function takeOrder(replyToken, code) {

  return new Promise(done => {
    reservationInfo.randInput = code
    var options = {
      url: 'http://railway.hinet.net/Foreign/common/etno11.jsp',
      method: 'POST',
      form: reservationInfo,
      headers: {
        referer: 'http://railway.hinet.net/Foreign/common/check_etno1.jsp?language=zh_TW',
      }
    }
    Request(options, (err, res, body) => {
      var $ = cheerio.load(body);
      var num = $('#spanOrderCode').text();
      console.log('num: '+num);
      return client.replyMessage(replyToken, {
          type: 'text',
          text: num,
        }).catch(err => {console.log(err)});
    })
  })
}

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
  // addUsertIdintofile(source.userId);
  if (sent) {
    sent = false;
    return takeOrder(message).catch(err => {console.log(err)});
  }
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
    case 'list1':
    return client.replyMessage(
      replyToken,
      {
        type: 'template',
        altText: 'Buttons alt text',
        template: {
          type: 'buttons',
          title: 'List1',
          text: 'Choose one of category',
          actions: [
          { label: 'technology', type: 'message', text: 'technology' },
          { label: 'space', type: 'message', text: 'space' },
          { label: 'health-and-medicine', type: 'message', text: 'health-and-medicine' },
          { label: 'brain', type: 'message', text: 'brain' }
          ],
        },
      }
      );
    case 'list2':
    return client.replyMessage(
      replyToken,
      {
        type: 'template',
        altText: 'Buttons alt text',
        template: {
          type: 'buttons',
          title: 'List2',
          text: 'Choose one of category',
          actions: [
          { label: 'plants-and-animals', type: 'message', text: 'plants-and-animals' },
          { label: 'physics', type: 'message', text: 'physics' },
          { label: 'chemistry', type: 'message', text: 'chemistry' },
          { label: 'policy', type: 'message', text: 'policy' },
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
    case 'technology':
    return replyArticle(replyToken, 'technology');
    case 'space':
    return replyArticle(replyToken, 'space');
    case 'health-and-medicine':
    return replyArticle(replyToken, 'health-and-medicine');
    case 'brain':
    return replyArticle(replyToken, 'brain');
    case 'plants-and-animals':
    return replyArticle(replyToken, 'plants-and-animals');
    case 'physics':
    return replyArticle(replyToken, 'physics');
    case 'chemistry':
    return replyArticle(replyToken, 'chemistry');
    case 'policy':
    return replyArticle(replyToken, 'policy');
    case 'editors-blog':
    return replyArticle(replyToken, 'editors-blog');
    case 'top-random':
    return replyArticle(replyToken);
    case 'listening':
    return replySound(replyToken);
    case 'help':
    return replyText(replyToken, 
      "指令大全：\n"+
      "閱讀文章類別：\n"+
      "technology\n"+
      "space\n"+
      "health-and-medicine\n"+
      "brain\n"+
      "plants-and-animals\n"+
      "physics\n"+
      "chemistry\n"+
      "policy\n"+
      "editors-blog\n"+
      "隨機閱讀：\n"+
      "top-random\n"+
      "聽力：\n"+
      "listening");
    case 'A':
    return orderTic(replyToken, 0);
    case 'B':
    return orderTic(replyToken, 1);
    case 'C':
    return orderTic(replyToken, 2);
    case 'D':
    return orderTic(replyToken, 3);
    default:
    console.log(`Echo message to ${replyToken}: ${message.text}`);
    return replyText(replyToken, message.text+'\nBtw you can type "help" to get 指令大全:)');

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

// const pushArticle = (token=null)=>{
//   fs.readFile('UserID.list', 'utf8',(err, data)=>{

//     const url = 'https://www.iflscience.com/';
//     request(url, (err, res, body) => {
//       const userIds = data.split(',');
//       let $ = cheerio.load(body);
//       let Articles = [];
//       Articles = $('.page .main-content article .content').find('a');
//       const one = Math.floor((Math.random()*Articles.length));
//       const two = Math.floor((Math.random()*Articles.length));
//       const three = Math.floor((Math.random()*Articles.length));
//       if(token != null){
//         client.replyMessage(token, {
//           "type": "text",
//           "text": "選一篇喜歡的文章來讀吧~\n"+
//           "1.\n標題：\n"+Articles[one.toString()]["attribs"]["title"]+
//           "\n類別：\n"+Articles[one.toString()]["attribs"]["href"].split("/")[3]+
//           "\n"+Articles[one.toString()]["attribs"]["href"]+
//           "\n2.\n標題：\n"+Articles[two.toString()]["attribs"]["title"]+
//           "\n類別：\n"+Articles[two.toString()]["attribs"]["href"].split("/")[3]+
//           "\n"+Articles[two.toString()]["attribs"]["href"]+
//           "\n3.\n標題：\n"+Articles[three.toString()]["attribs"]["title"]+
//           "\n類別：\n"+Articles[three.toString()]["attribs"]["href"].split("/")[3]+
//           "\n"+Articles[three.toString()]["attribs"]["href"]
//         });
//       }else{
//         userIds.forEach((user)=>{
//           client.pushMessage(user,{
//             "type": "text",
//             "text": "選一篇喜歡的文章來讀吧~\n"+
//             "1.\n標題：\n"+Articles[one.toString()]["attribs"]["title"]+
//             "\n類別：\n"+Articles[one.toString()]["attribs"]["href"].split("/")[3]+
//             "\n"+Articles[one.toString()]["attribs"]["href"]+
//             "\n2.\n標題：\n"+Articles[two.toString()]["attribs"]["title"]+
//             "\n類別：\n"+Articles[two.toString()]["attribs"]["href"].split("/")[3]+
//             "\n"+Articles[two.toString()]["attribs"]["href"]+
//             "\n3.\n標題：\n"+Articles[three.toString()]["attribs"]["title"]+
//             "\n類別：\n"+Articles[three.toString()]["attribs"]["href"].split("/")[3]+
//             "\n"+Articles[three.toString()]["attribs"]["href"]
//           });

//         });
//       }
//     });
//   });

// };
const replyArticle = (replyToken, category="")=>{

  const article_url = 'https://www.iflscience.com/'+category;
  request(article_url, (err, res, body) => {

    let $ = cheerio.load(body);
    let Articles = [];
    Articles = $('.page .main-content article .content').find('a');
    
    const one = Math.floor((Math.random()*Articles.length));
    const two = Math.floor((Math.random()*Articles.length));
    const three = Math.floor((Math.random()*Articles.length));
    
    client.replyMessage(replyToken,{
      "type": "text",
      "text": "選一篇喜歡的文章來讀吧~\n"+
      "1.\n標題：\n"+Articles[one.toString()]["attribs"]["title"]+
      "\n類別：\n"+Articles[one.toString()]["attribs"]["href"].split("/")[3]+
      "\n"+Articles[one.toString()]["attribs"]["href"]+
      "\n2.\n標題：\n"+Articles[two.toString()]["attribs"]["title"]+
      "\n類別：\n"+Articles[two.toString()]["attribs"]["href"].split("/")[3]+
      "\n"+Articles[two.toString()]["attribs"]["href"]+
      "\n3.\n標題：\n"+Articles[three.toString()]["attribs"]["title"]+
      "\n類別：\n"+Articles[three.toString()]["attribs"]["href"].split("/")[3]+
      "\n"+Articles[three.toString()]["attribs"]["href"]
    });
  })

};
const replySound = (token=null)=>{
  const url = 'https://www.scientificamerican.com/podcasts/';
  request(url, (err,res,body)=>{
    let $ = cheerio.load(body);
      // let Sound;
      let Sounddata = $('.landing-main section .podcasts-listing__main h3 a span').toArray();
      let Soundvoice = $('.landing-main section .podcasts-listing__download a').toArray();
      // console.log(Sound[0]);
      const one = Math.floor((Math.random()*Sounddata.length));
      const two = Math.floor((Math.random()*Sounddata.length));
      const three = Math.floor((Math.random()*Sounddata.length));
      client.replyMessage(token, {
        "type": "text",
        "text": "選一個喜歡的postcast來聽吧～\n"+
        "1.\n標題：\n"+
        `${Sounddata[one.toString()]['children'][0]['data']}\n`+
        `音檔：\n${Soundvoice[one.toString()]['attribs']['href']}\n`+
        `原文：\n${Sounddata[one.toString()]['parent']['attribs']['href']}\n`+
        "2.\n標題：\n"+
        `${Sounddata[two.toString()]['children'][0]['data']}\n`+
        `音檔：\n${Soundvoice[two.toString()]['attribs']['href']}\n`+
        `原文：\n${Sounddata[two.toString()]['parent']['attribs']['href']}\n`+
        "3.\n標題：\n"+
        `${Sounddata[three.toString()]['children'][0]['data']}\n`+
        `音檔：\n${Soundvoice[three.toString()]['attribs']['href']}\n`+
        `原文：\n${Sounddata[three.toString()]['parent']['attribs']['href']}`
      });


    });
};
// const addUsertIdintofile = (id) => {
//   fs.readFile('UserID.list', 'utf8',(err, data)=>{

//     let UserIDs = data.split(',');
//     if (UserIDs.includes(id))
//       console.log('This User had been added.');
//     else{
//       UserIDs.push(id);
//       fs.writeFile('UserID.list', UserIDs, err => {
//         if (err) throw err;
//         console.log('user ID write successfully'); 
//       });
//     }
//   });
// }
  

  // fs.writeFileSync('UserID.json', UserIDs);
  // console.log(UserIDs);
  // db.on('error', console.error.bind(console, 'connection error:'));
  // db.once('open', function() {
  //   console.log('we\'re connected!');    
  //   var UserSchema = new mongoose.Schema({
  //     UserID: String
  //   });
  //   var UserModel = db.model('User', UserSchema);
  //   UserModel.count({
  //     UserID: id
  //   }, (err, count)=>{

  //     if (count > 0)
  //       console.log('User has existed.');
  //     else{
  //       var UserEntity = new UserModel({
  //         UserID: id
  //       });
  //       console.log('userid: '+UserEntity.UserID);
  //       UserEntity.save();
  //       console.log('User added successfully!');
  //     }
  //   });

  // });

// };
// var hours,minutes,seconds;
// function nowTime(){
//  hours=new Date().getHours();
//  minutes=new Date().getMinutes();
//  seconds=new Date().getSeconds();
// }

// function control(){
//   if(hours==(9-8) && minutes==0 && seconds==0){
//     console.log("Launch!!!");
//     pushArticle();
//   }
// }
// function check(){
//   nowTime();
//   control();
//   fs.readFile('date.list', 'utf8',(err, date)=>{
//     let TODATE = new Date().getDate();
//     if (date !== TODATE.toString()){
//       console.log('The last date:' + date);
//       console.log('Push articles');
//       pushArticle();
//       fs.writeFile('date.list', TODATE, err => {
//         if (err) throw err;

//         // console.log('Date write successfully'); 
//       });
//     }
//     else{
//       // console.log('It has been pushed.');
//     }
//   });
  // db.on('error', console.error.bind(console, 'connection error:'));
  // db.once('open', function() {
  //   console.log('we\'re connected!');
  //   var pushDateSchema = new mongoose.Schema({
  //     Year:Number,
  //     Month:Number,
  //     Date:Number
  //   });
  //   var pushDateModel = db.model('pushDate',pushDateSchema);

  //   let year = new Date().getFullYear();
  //   let month = new Date().getMonth() + 1;
  //   let date = new Date().getDate();
  //   pushDateModel.count({
  //     Year: year,
  //     Month: month,
  //     Date: date
  //   }, (err, count) => {
  //     if(count > 0)
  //       console.log('Today has pushed the Articles and Podcasts.');
  //     else{
  //       pushArticle();
  //       var pushdateEntity = new pushDateModel({
  //         Year: year,
  //         Month: month,
  //         Date: date
  //       });
  //       pushdateEntity.save();
  //       console.log('Not exists!');
  //     }
  //   });


  // });

// }
// check();
// setInterval(check,1000);
// listen on port
const port = process.env.PORT || 3033;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
