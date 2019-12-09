const tmi = require('tmi.js');
var zerorpc = require("zerorpc");
const express = require('express');
const bodyParser = require('body-parser');
const workerOrigin = 'tcp://localhost:18889'

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.put('/botEnabled', (req, res) => {
    console.log("/botEnabled PUT")
    targetStatus = req.body.botEnabled
    channel = req.body.userLogin
    console.log(`${targetStatus}, ${channel}`)
    if (targetStatus){
        tClient.join(channel)
        .then((data) =>{
            console.log(`joined channel: ${data}`)
            res.send({botEnabled: targetStatus})
            return
        })
        .catch((error) => {
            console.log(`join failed: ${error}`)
            res.send({botEnabled: !targetStatus})
            return
        });
    } else {
        tClient.part(channel)
        .then((data) =>{
            console.log(`left channel: ${data}`)
            res.send({botEnabled: targetStatus})
            return
        })
        .catch((error) => {
            console.log(`left failed: ${error}`)
            res.send({botEnabled: !targetStatus})
            return
        });
    }
})

app.get('/isEnabled', (req, res) => {
    try{
        res.send({botEnabled: req.body.userName in tClient.getChannels()});
    } catch(err) {
        res.status(500).send(err);
    }
})

app.listen(18888);

const zClient = new zerorpc.Client();
zClient.connect(workerOrigin);

const tClient = new tmi.Client({
	connection: {
		secure: true,
		reconnect: true
	},
	channels: []
});

tClient.connect()
.then((data) => {
    console.log(`tmi client connected to ${data}`)
})
.catch((error) => {
    console.log(`tmi client connection failed: ${error}`)
});

tClient.on('message', (channel, tags, message, self) => {
    if (tags['emotes'] != undefined){
        if (tags['emote-only']){
            return
        }
    }
    broadcasterID = tags['room-id']
    chatterDisplayName = tags['display-name']
    // console.log(`broadcaster_id: ${broadcasterID}\ndisplay name: ${chatterDisplayName}\nmessage: ${message}`)
    
    // channel: #woowakgood
    // broadcasterID = tags['room-id'] = 154...
    // chatterDisplayName = tags['display-name'] = 엉오
    // message = 안녕

    zClient.invoke("get_response", broadcasterID, message, (error, res, more) => {
        if (error){
            console.log(error)
        }
        console.log(res)
    });
    // console.log(`channel: ${channel}\ntags: ${JSON.stringify(tags)}\ndisplay name: ${tags['display-name']}\nmessage: ${message}`);
});