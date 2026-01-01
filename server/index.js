const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 3000 });
let clients = [];

server.on('connection', ws => {
  clients.push(ws);
  ws.on('message', msg => {
    clients.forEach(client => {
      if(client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
  ws.on('close', () => { clients = clients.filter(c => c !== ws); });
});
