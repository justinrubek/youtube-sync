import React, { Component } from "react";
import Youtube from "react-youtube";
import io from "socket.io-client";
const socket = io();

const PlayerState = {
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

        const new_player_state = event.data;
        const url = player.getVideoUrl();
        const elapsed = player.getCurrentTime();

        const state = {
            player_state: new_player_state,
            url: url,
            elapsed: elapsed,
            timestamp: Date.now() / 1000
        };

        if (this.state.submitupdate == true) {
            socket.emit("update", state);
            console.log("update");
        }
        /*
        if (new_player_state == YT.PlayerState.PLAYING) {
            socket.emit("play", data);
        }
        if (new_player_state == YT.PlayerState.PAUSED) {
            socket.emit("pause", data);
        }
        this.setState({ previous_player_state: new_player_state });
        */
    }

    playerOnReady(event) {
        const player = event.target;
        this.setState({ player: player, connected: true });
        console.log(event.target);

        console.log(
            `Video quality options: ${player.getAvailableQualityLevels()}`
        );

        socket.on("play", data => {
            this.setState({ submitupdate: false });
            player.playVideo();
            console.log("playVideo");
            this.setState({ submitupdate: true });
        });

        socket.on("pause", data => {
            this.setState({ submitupdate: false });
            player.pauseVideo();
            console.log("pauseVideo");
            this.setState({ submitupdate: true });
        });

        socket.on("seek", time => {
            this.setState({ submitupdate: false });
            if (player.getPlayerState() == YT.PlayerState.PLAYING) {
                time += 0.7;
            }
            player.seekTo(time);
            console.log("seek");
            this.setState({ submitupdate: true });
        });
    }
}

SyncedYoutubePlayer.defaultProps = {
    video_id: "c8W-auqg024"
};
