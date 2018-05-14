
/*
  status: the 'state' of the player (unstarted, playing, paused)
  elapsed: how far along the player should be at the updated time
  start_time: a simulated time representing when we would've started
                had we never stopped playing
 */
class SimulatedVideo {
  constructor() {
    // Is in seconds
    this.status = "paused";
    this.elapsed = 0;
    this.start_time = Date.now() / 1000;
  }

  from(state) {
    const s = new SimulatedVideo();
    s.setState(state);
    return s;
  }

  play() {
    if (this.status != "playing") {
      // This assumes that if the video is not playing, that elapsed is correct
      this.update();
      this.status = "playing";

      // Fire play event to local subscribers
      console.log("playing video");
    }
  }

  update() {
    if (this.status == "paused") {
      this.start_time = Date.now() / 1000 - this.elapsed;
    }
    else if (this.status == "playing") {
      let now = Date.now() / 1000;
      if (now < this.start_time) {
        now = this.start_time;
      }
      this.elapsed = now - this.start_time;
    }
  }

  pause() {
    // Calculate elapsed properly for use in play
    if (this.status != "paused") {
      // This assumes that start time is valid
      this.update();
      this.status = "paused";
      // Fire event to local subscribers (possibly send a time update as well
      console.log("paused video");
    }
  }

  seek(time) {
    this.elapsed = time;
    this.start_time = (Date.now() / 1000) - this.elapsed;

    console.log("seeking to time: " + this.elapsed);

  }

  getState() {
    this.update();
    return {
      elapsed: this.elapsed,
      start_time: this.start_time,
      status: this.status
    };
  }

  setState(newState) {
    this.elapsed = newState.elapsed;
    this.start_time = newState.start_time;
    this.status =  newState.status;
  }
}