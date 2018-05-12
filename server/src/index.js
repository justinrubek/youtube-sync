import "babel-polyfill";
import app from "./app";
import http from "http";
import socketio from "socket.io";
import YoutubeVideoId from "youtube-video-id";

import config from "./config";
import { stat } from "fs";

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
let room = {
    name: "default",
    video_id: "c8W-auqg024",
    status: "unstarted",
    elapsed: 0,
    time: Date.now() / 1000
};
io.on("connection", (socket) => {
    socket.join(room.name)

    // Update information on room
    socket.to(room.name).emit("ping")

    // Alert the client 
    socket.emit("join", room);

    console.log("Connection established");
    console.log(room);
    console.log(room.name);
    socket.on("disconnect", (socket) => {
        console.log("Disconnected");
    })

    socket.on("update", (player_data) => {
        // Determine if there is enough variation that we need to resync
        const { player_state, url, elapsed, timestamp } = player_data;

        const id = video_id(url);
        if (id != room.video_id) {
            // We've changed the video
            console.log(`changed video id old(${room.video_id}) new(${id})`)
            room.time = Date.now() / 1000
            room.video_id = id;
            room.elapsed = 0;
            room.status = "unstarted";
            socket.to(room.name).emit("change", id);
            return;
        }

        let new_time = Date.now() / 1000;
        if (new_time < room.time)
            new_time = room.time;

        // Calculate how much time the video elapsed
        const new_elapsed = new_time - room.time;
        let diff = Math.abs(new_elapsed - elapsed)
        console.log(`elapsed: ${elapsed}`)
        console.log(`new_elapsed: ${new_elapsed}`)
        console.log(`diff: ${diff}`)
        if (diff > 5) {
            // Send out to other sockets that the time has updated
            socket.to(room.name).emit("seek", elapsed);
        }

        // If so, update all sockets in room
        const state = PlayerState[player_state];
        console.log(`State: ${state}`)
        console.log(`PlayerState: ${PlayerState[player_state]}`)
        if (state != room.status) {
            const now = (Date.now() / 1000) - elapsed;
            switch(state) {
                case "playing":
                    socket.to(room.name).emit("play")
                    room.status = "playing"
                    room.time = (Date.now() / 1000) - elapsed
                    break;
                case "paused":
                    socket.to(room.name).emit("pause")
                    room.status = "paused";
                    room.time
                    break;
                default:
                    break;
            }
        }
        
        // Finally return the new room state?
    });

    socket.on("play", (data) => {
        if (room.status != "playing") {
            // Broadcast to rest of room
            socket.to(room.name).emit("play", data);
            room.status = "playing";
            console.log(`Playing Video with data: ${data}`);
        }

    });

    socket.on("pause", (data) => {
        if (room.status != "paused") {
            socket.to(room.name).emit("pause", data);
            room.status = "paused";
            console.log(`Pausing Video with data: ${data}`);
        }
    });
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