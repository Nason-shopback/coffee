var linebot = require('linebot');
var express = require('express');
const line = require('@line/bot-sdk');
const client = new line.Client({
  channelAccessToken: '3fIe/4upQMWouWdAdN9POh9Gx/pM2x/3ZpvU7CGTL2BokVGWCHmrzA7XkpZa1sCAWqhzlvWUr9sb38jQq6be25cabH3U7gk4RQjAKNdxpr72K1z4MEoJyIFo6q4ElL8qlEVAnKxyuNoTv/BCiCUPaAdB04t89/1O/w1cDnyilFU='
});


var bot = linebot({
	channeId: '1599893363',
	channelSecret: '23e875b7f89a534de55249f2c5911639',
	channelAccessToken: '3fIe/4upQMWouWdAdN9POh9Gx/pM2x/3ZpvU7CGTL2BokVGWCHmrzA7XkpZa1sCAWqhzlvWUr9sb38jQq6be25cabH3U7gk4RQjAKNdxpr72K1z4MEoJyIFo6q4ElL8qlEVAnKxyuNoTv/BCiCUPaAdB04t89/1O/w1cDnyilFU='
});
bot.on('message', function(event) {
  client.getProfile(event.source.userId)
  .then((profile) => {
    console.log(profile.displayName);
    console.log(profile.userId);
    console.log(profile.pictureUrl);
    console.log(profile.statusMessage);
    
    if (event.message.type == 'text') {
      if (event.message.text== 'test'){
          event.reply({
          "type": "template",
          "altText": "this is a confirm template",
          "template": {
            "type": "confirm",
            "text": "Are you sure?",
            "actions": [
            {
              "type": "message",
              "label": "Yes",
              "text": "yes"
            },
            {
              "type": "message",
              "label": "No",
              "text": "no"
            }
            ]
          }
        });
        
      }

      var msg = '收到：'+profile.displayName+'的'+event.message.text;

      event.reply(msg).then(function(data) {
      // success 
      console.log(msg);
      console.log(event);

    }).catch(function(error) {
      // error 
      console.log('error');
    });
  }

})
  .catch((err) => {
    // error handling
  });

});
// client.pushMessage('U505af16bb05fed728c8f39f72806de75',{type: 'text', text: '測試點咖啡'}).then(()=>{
//   console.log("Message has sent.");

// })
// .catch((error)=>{
//   console.log(error);
// });


const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
	var port = server.address().port;
	console.log("App now running on port", port);
});
