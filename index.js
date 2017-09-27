var port = 8000;
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(app.listen(port));
const request = require('request');
var miners = [];
var sitestats;
var payoutstats;

app.use(express.static('public'));

setInterval(function(){
  request('https://api.coin-hive.com/stats/site?secret='+process.argv[2], function (error, response, bodyone) {
    sitestats = JSON.parse(bodyone);
    request('https://api.coin-hive.com/stats/payout?secret='+process.argv[2], function (error, response, bodytwo) {
      payoutstats = JSON.parse(bodytwo);
      io.sockets.emit('stats',{payout:payoutstats, site:sitestats});
    })
  })
},60000)


io.on('connection', function (socket) {
  socket.emit('miner', miners.length);
  if(sitestats && payoutstats){
    io.sockets.emit('stats',{payout:payoutstats, site:sitestats});
  }
  socket.on('start', function (data) {
    if(miners.indexOf(socket.id) === -1){
      miners.push(socket.id);
      io.sockets.emit('miner', miners.length);
    }
  });
  socket.on('stop', function (data) {
    if(miners.indexOf(socket.id) > -1){
      miners.pop(socket.id);
      io.sockets.emit('miner', miners.length);
    }
  });
  socket.on('disconnect', function () {
    if(miners.indexOf(socket.id) > -1){
      miners.pop(socket.id);
      io.sockets.emit('miner', miners.length);
    }
  });
})
