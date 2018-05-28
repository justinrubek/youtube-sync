import "babel-polyfill";

import app from "./app";
import http from "http";
import redis from "redis";
import bluebird from "bluebird";
import socketio from "socket.io";
import YoutubeVideoId from "youtube-video-id";

import register_socket from "./sockethandler";
import { roomExists, createRoom, getRoomInfo, setRoomInfo, getSimulationInfo, setSimulationInfo } from "./roomutil";

// import SimulatedVideo from "../../lib/SimulatedVideo";
//import SimulatedVideo from "./SimulatedVideo";
import { SimulatedVideo } from "../../lib";

import config from "./config";
import { stat } from "fs";

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

function video_id(url) {
    let video_id = url.split('v=')[1];
    
    // Should verify video_id
    let ampersandPosition = video_id.indexOf('&');
    if (ampersandPosition != -1) {
      video_id = video_id.substring(0, ampersandPosition);
    }
  
    return video_id;
}

const port = normalizePort(process.env.PORT || config.port);
app.set("port", port);

const server = http.createServer(app);

const io = socketio(server);

const PlayerState = {
    "-1": "unstarted",
    "0": "ended",
    "1": "playing",
    "2": "paused",
    "3": "buffering",
    "4": "cued"
};

io.on("connection", async (socket) => {
    const requested_room = socket.handshake.query.room;
    console.log("connecting");
    // console.log("Connection opened for room: " + requested_room);

    let room_info;
    if (await roomExists(requested_room) == false) {
      console.log("Creating room");
      room_info = createRoom(requested_room);
    }
    else {
      console.log("Room exists, joining...");
      room_info = await getRoomInfo(requested_room);
    }

    socket.join(requested_room);

    let sim_state = room_info.simulation.getState();
    console.log("Room sim state: " + JSON.stringify(sim_state));
    // socket.emit("initialize", sim_state);

    // Setup the newcomer to the current video
    console.log("Changing newcomer id to: " + room_info.video_id);
    socket.emit("change", room_info.video_id);

    if (sim_state.status == "playing") {
        // Find out how far in the video we are to catch up
      const elapsed = sim_state.elapsed;
      console.log("Seeking to: " + elapsed);
      // Update the client's time
      socket.emit("seek", elapsed);
    }

    // Register socket for room updates
    console.log("Registering socket with room");
    register_socket(requested_room, socket);
});

// Listen on all network interfaces
server.on("error", onError);
server.on("listening", onListening);
server.listen(port);

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
