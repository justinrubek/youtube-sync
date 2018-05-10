import "babel-polyfill";
import app from "./app";
import http from "http";
import socketio from "socket.io";

import config from "./config";


const port = normalizePort(process.env.PORT || config.port);
app.set("port", port);

const server = http.createServer(app);

const io = socketio(server);

io.on("connection", (socket) => {
    console.log("Connection established");
    socket.on("disconnect", (socket) => {
        console.log("Disconnected");
    })
});


// Listen on all network interfaces
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
}

function onListening() {
  const addr = server.address();
  console.log(`Listening on port ${addr.port}`);
}