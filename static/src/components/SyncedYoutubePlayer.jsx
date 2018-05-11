import React, { Component } from "react";
import Youtube from "react-youtube";
import io from "socket.io-client";
const socket = io();

const playerstate = {
    "-1": "unstarted",
    "0": "ended",
    "1": "playing",
    "2": "paused",
    "3": "buffering",
    "4": "cued"
};

export default class SyncedYoutubePlayer extends Component {
    constructor(props) {
        super(props);

        this.state = {};

        // Bind methods to this
        this.playerOnReady = this.playerOnReady.bind(this);
        this.playerOnStateChange = this.playerOnStateChange.bind(this);
    }

    render() {
        const {} = this.state;
        const { video_id } = this.props;

        const options = {
            host: "https://www.youtube.com",
            width: "100%",
            height: "100%",
            playerVars: {
                autoplay: 0
            },
            widget_referrer: window.location.href
        };

        return (
            <Youtube
                videoId={video_id}
                opts={options}
                onReady={this.playerOnReady}
                onStateChange={this.playerOnStateChange}
            />
        );
    }

    playerOnStateChange(event) {
        const { player, previous_player_state } = this.state;

        if (previous_player_state == playerstate[event.data]) {
            // Maybe just do offset checking?
            return;
        }

        const new_player_state = playerstate[event.data];
        const elapsed = player.getCurrentTime();
        const data = {
            time: elapsed
        };

        console.log(new_player_state);
        if (new_player_state == "playing") {
            socket.emit("play", data);
        }
        if (new_player_state == "paused") {
            socket.emit("pause", data);
        }
        this.setState({ previous_player_state: new_player_state });
    }

    playerOnReady(event) {
        const player = event.target;
        this.setState({ player: player, connected: true });
        console.log(event.target);

        console.log(
            `Video quality options: ${player.getAvailableQualityLevels()}`
        );

        socket.on("play", data => {
            player.seekTo(data.time);
            player.playVideo();
        });

        socket.on("pause", data => {
            player.pauseVideo();
            player.seekTo(data.time);
        });
    }
}

SyncedYoutubePlayer.defaultProps = {
    video_id: "c8W-auqg024"
};
