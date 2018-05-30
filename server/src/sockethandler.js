import redis from "redis";
import bluebird from "bluebird";
import socketio from "socket.io";
import urlParser from "js-video-url-parser";

import { SimulatedVideo } from "../../lib";
import { roomExists, createRoom, getRoomInfo, setRoomInfo, getSimulationInfo, setSimulationInfo } from "./roomutil";

import config from "./config";
import { stat } from "fs";

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

function video_id(url) {
}

const r_client = redis.createClient(config.redis_port, config.redis_host, config.redis_options);

const PlayerState = {
    "-1": "unstarted",
    "0": "ended",
    "1": "playing",
    "2": "paused",
    "3": "buffering",
    "4": "cued"
};

// Export a function that registers a socket to events related to its room
export default function register(room_name, socket) {
  console.log("Registering socket for room: " + room_name);

  socket.on("update", (data) => update(room_name, data, socket));
  socket.on("play", (data) => play(room_name, data, socket));
  socket.on("pause", (data) => pause(room_name, data, socket));
  socket.on("change", (data) => change(room_name, data, socket));

  socket.on("disconnect", (socket) => {
        console.log("Disconnected from " + room_name);
        // Probably check to see if room is empty?
        // Perhaps that should be left for the video end
    });
}

async function change(room_name, video_url, source) {
    console.log(room_name + " received change with data: " + JSON.stringify(video_url));

    console.log("Getting room info");
    let roomInfo = await getRoomInfo(room_name);
    
    console.log("Converting url to id");
    const video_info = urlParser.parse(url);
    console.log(JSON.stringify(video_info));
  
    const id = video_info.id;
    console.log("id determined to be: "+ id);
    if (id != roomInfo.video_id) {
      // Reset the room time to the beginning
      sim.seek(0);
      sim.pause();
      setRoomInfo(room_name, { video_id: id, simulation: sim.getState() });
      source.to(room_name).emit("change", id);
      return;
    }
}

async function update(room_name, player_data, source) {
    // sim_state and url in data
    console.log(room_name + " received update with data: " + JSON.stringify(player_data));
    const { player_state, url, elapsed, timestamp } = player_data;

    // Determine if there is enough variation that we need to resync
    // If so, update all sockets in the room
    let roomInfo = await getRoomInfo(room_name);
    let sim = roomInfo.simulation;

    const id = video_id(url);
    if (id != roomInfo.video_id) {
      // Reset the room time to the beginning
      sim.seek(0);
      sim.pause();
      setRoomInfo(room_name, { video_id: id, simulation: sim.getState() });
      source.to(room_name).emit("change", id);
      return;
    }

    // Compare elapsed time from client and server to determine if change
    let sim_state = sim.getState();

    // Calculate how much time the video elapsed
    let diff = Math.abs(sim_state.elapsed - elapsed)
    // Allow some wiggle room
    if (diff > 5) {
        // Send out to other sockets that the time has updated
        source.to(room_name).emit("seek", elapsed);
        sim.seek(elapsed);
        setSimulationInfo(room_name, sim.getState());
    }

    // Check for state changes
    const state = PlayerState[player_state];
    if (state != sim_state.status) {                                                                                                                   
        // const now = (Date.now() / 1000) - elapsed;
        switch(state) {
            case "playing":
                source.to(room_name).emit("play");
                sim.play();
                break;
            case "paused":
                source.to(room_name).emit("pause");
                sim.pause();
                break;
            default:
                break;
        }

        setSimulationInfo(room_name, sim.getState());
    }
    
    // Finally return the new room state?
}

async function play(room_name, data, source) {
  console.log(room_name + " received play with data: " + JSON.stringify(data));
  const roomInfo = await getRoomInfo(room_name);
  const sim = roomInfo.simulation;
  const sim_state = sim.getState();

  if (sim_state.status != "playing") {
      // Broadcast to rest of room
      source.to(room_name).emit("play", data);
      sim.play();
      setSimulationInfo(room_name, sim.getState());
  }
}

async function pause(room_name, data, source) {
  console.log(room_name + " received pause with data: " + JSON.stringify(data));
  const roomInfo = await getRoomInfo(room_name);
  const sim = roomInfo.simulation;
  const sim_state = sim.getState();

  if (sim_state.status != "paused") {
      source.to(room_name).emit("pause", data);
      sim.pause();
      setSimulationInfo(room_name, sim.getState());
  }
}

