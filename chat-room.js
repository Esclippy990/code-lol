const http = require('http');
const WebSocket = require('ws');
let a = "Example Text";
let clients = [];
let mutedIPS = [];
let users = [];
let { msgs } = require('./msgs.js');

function broadcast(message) {
msgs.push(message)
const fs = require('fs');
fs.writeFile(process.env.SECRET_FILE, `${process.env.SECRET}
// This is a server-generated file. Do not modify anything in this file, as it may break the chat system.`, (err) => {
console.error(err)
})
for (let websocket of clients) {
websocket.send(message)
}
}

// Create an HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`
    <!DOCTYPE html>
    <html>
    <head>
    <style>
    body {
    font-family: sans-serif;
    overflow-wrap: break-word;
    }
    #a {
    overflow: none;
    }
    #controls {
    position: fixed;
    top: 573px;
    }
    </style>
    </head>
    <body>
    <h1>Hello, WebSocket!</h1>
    <p>This is a websocket + http server example.</p>
    <br><div style="height: 100px; overflow: none;">
    <div id="a"><font color="grey" size="4"><big>Connecting...</big></font></div><br>
    <input id="name" placeholder="Name" disabled> <input id="msg" placeholder="Message" disabled><button id="send" disabled>Send</button><br><br>
    </div>
    <script>
    if (!window.localStorage.msgs) {
    window.localStorage.msgs = {e: []};
    }
    if (true) { // Now nobody can modify any defined variables in here cuz they aren't global :) (e.g mute variable to unmute)
    let checkedName = false;
    setInterval(() => {
    document.getElementById('name').value = document.getElementById('name').value.replaceAll('@everyone', '(at)everyone')
    document.getElementById('name').value = document.getElementById('name').value.replaceAll('@everyone', '(at)everyone')
    document.getElementById('name').value = document.getElementById('name').value.replaceAll('@everyone', '(at)everyone')
    document.getElementById('name').value = document.getElementById('name').value.replaceAll('@everyone', '(at)everyone')
    document.getElementById('name').value = document.getElementById('name').value.replaceAll('@everyone', '(at)everyone')
    document.getElementById('name').value = document.getElementById('name').value.replaceAll('@everyone', '(at)everyone')
    document.getElementById('name').value = document.getElementById('name').value.replaceAll('@everyone', '(at)everyone')
    if (document.getElementById('name').value.includes('@everyone')) {
    window.location.reload();
    }
    }, 0);
    let disconnected = 0;
    let mute = false;
    let h = false;
    window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && h === true) {
    document.getElementById('send').click()
    }
    })
    let messages
    document.getElementById('msg').onfocus = () => {
    document.getElementById('name').disabled = true;
    h = true;
    }
    document.getElementById('msg').onblur = () => {
    h = false;
    }
    setInterval(() => {
    if (mute === true) {
    document.getElementById('msg').disabled = true;
    document.getElementById('msg').title = 'You have been muted.'
    } else {
    document.getElementById('msg').disabled = false;
    document.getElementById('msg').maxLength = '100';
    document.getElementById('msg').title = ''
    }
    document.getElementById('name').maxLength = '100'
    if (document.getElementById('name').value.replaceAll(' ', '').length > 0 && mute === false) {
    document.getElementById('msg').disabled = false;
    } else {
    document.getElementById('msg').disabled = true
    }
    if (document.getElementById('msg').value.replaceAll(' ', '').length > 0) {
    document.getElementById('send').disabled = false;
    } else {
    document.getElementById('send').disabled = true;
    }
    }, 0);
    let s = function t() {
    let socket = new WebSocket('https://ambitious-glacier-heart.glitch.me/');
socket.onopen = () => {
document.getElementById('name').disabled = false
document.getElementById('a').innerHTML = ${"`"}<font color="grey" size="4"><big>No messages!</big></font><br>It seems like no messages have been recieved yet, or there aren't any. Say hi!${"`"}
let checkIfTheNameIsDoneLol = setInterval(() => {
if (document.getElementById('name').disabled === true) {
clearInterval(checkIfTheNameIsDoneLol)
socket.send(JSON.stringify({type: 'join', text: document.getElementById('name').value}));
}
}, 0);
let m = setInterval(() => {
try {
if (window.localStorage.msgs.e.length > 0) {
socket.send(window.localStorage.msgs.e[0])
window.localStorage.msgs.splice(window.localStorage.msgs.e[0]);
} else {clearInterval(m)}
} catch (error) {clearInterval(m); console.log(error)}
}, 400);
document.getElementById('send').onclick = () => {
    if (disconnected === 1 || mute === true) {
    window.scrollTo({
    top: document.body.scrollHeight+100,
    behavior: 'smooth'
    });
    if (document.getElementById('a').innerHTML === ${"`"}<font color="grey" size="4"><big>No messages!</big></font><br>It seems like no messages have been recieved yet, or there aren't any. Say hi!${"`"}) {
let msg = document.createElement('span');
msg.innerHTML = ${"`"}${"${"}document.getElementById('name').value}: <font color="red">${"${"}document.getElementById('msg').value}</font>${"`"};
msg.innerHTML += ${"`"} <small><small><span style="user-select: none; cursor: pointer;" title="Today, at ${"${"}Date().substring(16, 24)}; This message was not sent.">${"${"}Date().substring(16, 21)}</span></small></small>${"`"}
document.getElementById('a').innerHTML = '';
document.getElementById('a').appendChild(msg);
document.getElementById('msg').value = ''
} else {
let msg = document.createElement('span');
msg.innerHTML = ${"`"}${"${"}document.getElementById('name').value}: <font color="red">${"${"}document.getElementById('msg').value}</font>${"`"};
msg.innerHTML += ${"`"} <small><small><span style="user-select: none; cursor: pointer;" title="Today, at ${"${"}Date().substring(16, 24)}; This message was not sent.">${"${"}Date().substring(16, 21)}</span></small></small>${"`"}
document.getElementById('a').innerHTML += '<br>';
document.getElementById('a').appendChild(msg);
document.getElementById('msg').value = ''
}
    } else {
    socket.send(${"`"}${"${"}document.getElementById('msg').value}${"`"})
    document.getElementById('msg').value = ''
    }
    }
    }
socket.onmessage = (event) => {
let l
try {
window.scrollTo({
top: document.body.scrollHeight
});
l = JSON.parse(event.data).type
} catch (error) {l = 'Normal'}
if (l === 'mute') {
if (mute === false) {
mute = true;
} else {
mute = false;
}
} else if (l === 'system') {
if (document.getElementById('a').innerHTML === ${"`"}<font color="grey" size="4"><big>No messages!</big></font><br>It seems like no messages have been recieved yet, or there aren't any. Say hi!${"`"}) {
document.getElementById('a').innerHTML = ''
let systemMessage = document.createElement('span');
systemMessage.innerHTML = JSON.parse(event.data).text+${"`"} <small><small><span style="user-select: none; cursor: pointer;" title="Today, at ${"${"}Date().substring(16, 24)}">${"${"}Date().substring(16, 21)}</span></small></small>${"`"};
document.getElementById('a').appendChild(systemMessage);
} else {
let systemMessage = document.createElement('span');
systemMessage.innerHTML = JSON.parse(event.data).text+${"`"} <small><small><span style="user-select: none; cursor: pointer;" title="Today, at ${"${"}Date().substring(16, 24)}">${"${"}Date().substring(16, 21)}</span></small></small>${"`"};
document.getElementById('a').innerHTML += '<br>';
document.getElementById('a').appendChild(systemMessage);
}
} else {
if (document.getElementById('a').innerHTML === ${"`"}<font color="grey" size="4"><big>No messages!</big></font><br>It seems like no messages have been recieved yet, or there aren't any. Say hi!${"`"}) {
let msg = document.createElement('span');
msg.innerText = event.data;
msg.innerHTML += ${"`"} <small><small><span style="user-select: none; cursor: pointer;" title="Today, at ${"${"}Date().substring(16, 24)}">${"${"}Date().substring(16, 21)}</span></small></small>${"`"}
msg.innerHTML = msg.innerHTML.replaceAll('@everyone', '<font color="lightblue"><b>@everyone</b></font>')
document.getElementById('a').innerHTML = '';
document.getElementById('a').appendChild(msg);
} else {
let msg = document.createElement('span');
msg.innerText = event.data;
msg.innerHTML += ${"`"} <small><small><span style="user-select: none; cursor: pointer;" title="Today, at ${"${"}Date().substring(16, 24)}">${"${"}Date().substring(16, 21)}</span></small></small>${"`"}
msg.innerHTML = msg.innerHTML.replaceAll('@everyone', '<font color="lightblue"><b>@everyone</b></font>')
document.getElementById('a').innerHTML += '<br>';
document.getElementById('a').appendChild(msg);
}
}
};
socket.onclose = () => {
disconnected = 1;
    console.log('WebSocket connection closed.');
    document.getElementById('a').innerHTML += '<br><b><font color="green">Chat Room:</font></b> You have disconnected. We will try to reconnect in 5 seconds. <small><span style="background-color: #3B82F6; border-radius: 3px; user-select: none;"><font color="white"><small>Only you can see this</small></font></span></small>'+${"`"} <small><small><span style="user-select: none; cursor: pointer;" title="Today, at ${"${"}Date().substring(16, 24)}">${"${"}Date().substring(16, 21)}</span></small></small>${"`"}
    setTimeout(() => {
    s()
    disconnected = 0;
    }, 5000);
};

socket.onerror = (error) => {
//document.getElementById('a').innerHTML += '<br><b><font color="green">Chat Room:</font></b> Uh oh, it seems like we are currently having a problem while trying to connect. This error has been sent to the owner, and we are going to work on it as soon as possible. Please <button onclick="window.location.reload()">Reload</button> the page. <small><span style="background-color: #3B82F6; border-radius: 3px; user-select: none;"><font color="white"><small>Only you can see this</small></font></span></small>'+${"`"} <small><small><span style="user-select: none; cursor: pointer;" title="Today, at ${"${"}Date().substring(16, 24)}">${"${"}Date().substring(16, 21)}</span></small></small>${"`"}
    console.error('WebSocket error:', error);
};
}
s()
}
    </script>
    </body>
    </html>
    `);
});

// Create a WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  // Send every message already sent, so the new client knows what is going on.
  for (let msg of msgs) {
  ws.send(msg)
  }
  clients.push(ws)
  ws.ip = req.headers['x-forwarded-for'].split(',')[0];
  ws.spamWarnings = 0;
  if (mutedIPS.includes(req.headers['x-forwarded-for'].split(',')[0])) {
  ws.send(JSON.stringify({type: 'mute'}))
  let m = setInterval(() => {
  try {
  if (!mutedIPS.includes(req.headers['x-forwarded-for'].split(',')[0])) {
  ws.send(JSON.stringify({type: 'mute'}))
  clearInterval(m);
  }
  } catch (error) {console.error(error); clearInterval(m)}
  }, 0);
  }
  setInterval(() => {
  ws.spam = false;
  }, 300);
    console.log('New client connected');

    // Handle incoming messages from clients
    ws.on('message', (message) => {
    let string = String(message)
    let l
    try {
    l = JSON.parse(message).type
    } catch (error) {
    l = 'Normal'
    }
    if (l === 'join') {
    if (!ws.name) {
    ws.name = JSON.parse(message).text
    users.push(ws.name)
    broadcast(JSON.stringify({type: 'system', text: String('<span style="user-select: none;"><b><font color="green">Chat Room Broadcast</font></b>: '+(ws.name || '<b>An unknown person</b>')+' has joined the chat.</span>')}))
    }
    } else if (string.startsWith('/eval') && req.headers['x-forwarded-for'].split(',')[0] === process.env.IP) {
    try {
    broadcast(JSON.stringify({type: 'system', text: String('<span style="user-select: none;"><b><font color="green">Chat Room Broadcast</font></b>: <i>Eval Output:</i> '+eval(string.substring('/eval '.length))+' </span>')}))
    } catch (error) {
    broadcast(JSON.stringify({type: 'system', text: String('<span style="user-select: none;"><b><font color="green">Chat Room Broadcast</font></b>: <i>Eval Output <small>(Error)</small>:</i> '+error.message+' </span>')}))
    }
    } else if (string.startsWith('/broadcast') && req.headers['x-forwarded-for'].split(',')[0] === process.env.IP) {
    let m = string.substring('/broadcast '.length);
    broadcast(JSON.stringify({type: 'system', text: String('<span style="user-select: none;"><b><font color="green">Chat Room Broadcast</font></b>: '+m+'</span>')}))
    } else {
    let slurs = ['nigga', 'nigger', 'nigge', 'nigg', 'Nigga', 'Nigger', 'Nigge', 'Nigg', 'Uncle Tom', 'Uncle T', 'Uncle tom', 'uncle tom', 'uncle Tom', 'Slut', 'slut', 'sLut', 'slUt', 'sluT', 'sLUT', 'UNCLE TOM', 'NIGGA', 'SLUT', 'NIGGER'] // I will find a system to hide all of these slurs, i hope im not breaking any rules, just a simple slur filter.
    if (ws.spam === true) {
    mutedIPS.push(req.headers['x-forwarded-for'].split(',')[0])
    ws.send(JSON.stringify({type: 'mute'}))
    ws.spamWarnings += 1;
    broadcast(JSON.stringify({type: 'system', text: String('<span style="user-select: none;"><b><font color="orange">Moderation Bot</font></b>: '+ws.name+' has been muted '+`${ws.spamWarnings > 3 ? 'for 5 minutes' : 'for 30 seconds'}`+'. Reason: Suspected spam.</span> <small><span style="background-color: #3B82F6; border-radius: 3px; user-select: none; cursor: pointer;" title="This message was sent from a robot."><font color="white"><b>✓ Robot</b></font></span></small>')}))
    setTimeout(() => {
    try {
    if (ws.spamWarnings < 4) {
    ws.send(JSON.stringify({type: 'mute'}))
    mutedIPS.splice(req.headers['x-forwarded-for'].split(',')[0])
    } else {
    setTimeout(() => {
    ws.send(JSON.stringify({type: 'mute'}))
    mutedIPS.splice(req.headers['x-forwarded-for'].split(',')[0])
    }, 270000)
    }
    } catch (error) {} // Ik that if it wouldve been reloaded, it would throw a huge list of a gibberish error that would fill my console saying the websocket is closed and a bunch of paths i won't even need to know lol
    }, 30000);
    } else {
    let found = false;
    for (let slur of slurs) {
    if (String(message).includes(slur) && found === false) {
    found = true;
    mutedIPS.push(req.headers['x-forwarded-for'].split(',')[0])
    ws.send(JSON.stringify({type: 'mute'}))
    broadcast(JSON.stringify({type: 'system', text: String('<span style="user-select: none;"><b><font color="orange">Moderation Bot</font></b>: '+ws.name+' has been muted for 70 seconds. Reason: Saying a slur.</span> <small><span style="background-color: #3B82F6; border-radius: 3px; user-select: none; cursor: pointer;" title="This message was sent from a robot."><font color="white"><b>✓ Robot</b></font></span></small>')}))
    setTimeout(() => {
    try {
    ws.send(JSON.stringify({type: 'mute'}))
    mutedIPS.splice(req.headers['x-forwarded-for'].split(',')[0])
    } catch (error) {} // Ik that if it wouldve been reloaded, it would throw a huge list of a gibberish error that would fill my console saying the websocket is closed and a bunch of paths i won't even need to know lol
    }, 70000);
    }
    }
    if (found === false) {
    if (!ws.name) {
    
    } else {
    broadcast(String(ws.name+': '+message))
    }
    }
    }
      ws.spam = true;
    }
    });

    // Handle client disconnections
    ws.on('close', () => {
      console.log('A client disconnected!')
      if (ws.name) {
      broadcast(JSON.stringify({type: 'system', text: String('<span style="user-select: none;"><b><font color="green">Chat Room Broadcast</font></b>: '+(ws.name || '<b>An unknown person</b>')+' has left the chat.</span>')}))
      users.splice(ws.name)
      }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
})
// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});
