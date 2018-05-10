import React from "react";
import Player from "./SyncedYoutubePlayer";

export default class App extends React.Component {
  render() {
    return (
      <div>
        Hello World
        <Player />
      </div>
    );
  }
}
