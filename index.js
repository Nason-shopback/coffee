var linebot = require('linebot');
var express = require('express');
const line = require('@line/bot-sdk');
const client = new line.Client({
  channelAccessToken: '3fIe/4upQMWouWdAdN9POh9Gx/pM2x/3ZpvU7CGTL2BokVGWCHmrzA7XkpZa1sCAWqhzlvWUr9sb38jQq6be25cabH3U7gk4RQjAKNdxpr72K1z4MEoJyIFo6q4ElL8qlEVAnKxyuNoTv/BCiCUPaAdB04t89/1O/w1cDnyilFU='
});
var user= '';

var bot = linebot({
	channeId: '1599893363',
	channelSecret: '23e875b7f89a534de55249f2c5911639',
	channelAccessToken: '3fIe/4upQMWouWdAdN9POh9Gx/pM2x/3ZpvU7CGTL2BokVGWCHmrzA7XkpZa1sCAWqhzlvWUr9sb38jQq6be25cabH3U7gk4RQjAKNdxpr72K1z4MEoJyIFo6q4ElL8qlEVAnKxyuNoTv/BCiCUPaAdB04t89/1O/w1cDnyilFU='
});
bot.on('message', function(event) {
  if (event.message.type = 'text') {
    var msg = event.message.text;
    event.reply(msg).then(function(data) {
      // success 
      console.log(msg);
      console.log(event);
      client.getProfile(event.source.userId)
      .then((profile) => {
        user = profile.userId;
        console.log(profile.displayName);
        console.log(profile.userId);
        console.log(profile.pictureUrl);
        console.log(profile.statusMessage);

        
      })
      .catch((err) => {
    // error handling
  });
    }).catch(function(error) {
      // error 
      console.log('error');
    });
  }
});
bot.push('8413382560424','文字：你好').then(()=>{
          console.log("Message has sent.");
        })
        .catch((error)=>{
          console.log(error);
        });


const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
	var port = server.address().port;
	console.log("App now running on port", port);
});
