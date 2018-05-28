import redis from "redis";
import bluebird from "bluebird";
import config from "./config";
import { SimulatedVideo } from "../../lib";

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const r_client = redis.createClient(config.redis_port, config.redis_host, config.redis_options);

function getRoomKey(name) {
  return "rooms:" + name;
}

function getSimKey(room_name) {
  return getRoomKey(room_name) + ":simulation";
}

async function roomExists(room_name) {
  const rooms = await r_client.lrangeAsync("rooms", 0, -1);
  for (let room of rooms) {
    if (room == room_name) {
      return true;
    }
  }
  return false;
} 

function createRoom(room_name) {
  r_client.rpush(["rooms", room_name], () => { });

  let video_id = config.default_video_id;
  let simulation = new SimulatedVideo();
  let roomInfo = { video_id, simulation }

  setRoomInfo(room_name, roomInfo);

  return roomInfo;
}

async function getSimulationInfo(room_name) {
  const status = r_client.getAsync(getSimKey(room_name) + ":status");
  const elapsed = r_client.getAsync(getSimKey(room_name) + ":elapsed");
  const start_time = r_client.getAsync(getSimKey(room_name) + ":start_time");

  const state = await Promise.all([ status, elapsed, start_time ]);
  const simState = { status: state[0], elapsed: state[1], start_time: state[2] };

  const sim = new SimulatedVideo(simState);
  return sim;
}

function setSimulationInfo(room_name, sim) {
  r_client.set(getRoomKey(room_name) + ":simulation:status", sim.status);
  r_client.set(getRoomKey(room_name) + ":simulation:elapsed", sim.elapsed);
  r_client.set(getRoomKey(room_name) + ":simulation:start_time", sim.start_time);
}

async function getRoomInfo(name) {
  const video_id = await r_client.getAsync(getRoomKey(name) + ":video_id"); 
  // const simulation = await r_client.hgetallAsync("rooms:" + name + ":simulation");
  const simulation = await getSimulationInfo(name);

  return { video_id, simulation };
}

function setRoomInfo(name, info) {
  r_client.set(getRoomKey(name) + ":video_id", info.video_id);
  setSimulationInfo(name, info.simulation);
}

export { roomExists, createRoom, getRoomInfo, setRoomInfo, getSimulationInfo, setSimulationInfo };
