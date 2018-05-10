import React, { Component } from "react";
import Youtube from "react-youtube";
import io from "socket.io-client";
const socket = io();

export default class SyncedYoutubePlayer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      connected: false
    };
  }

  render() {
    const { connected } = this.state;

    if (connected != true) {
    return (<h1>Establishing socket connection</h1>);
    }

return (<div />);
  }
}
