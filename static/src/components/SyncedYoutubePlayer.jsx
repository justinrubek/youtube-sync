import React, { Component } from "react";
import Youtube from "react-youtube";
import YoutubeVideoId from "youtube-video-id";

import Selector from "./YoutubeVideoPicker";

import io from "socket.io-client";

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

        this.state = {
            player: null
        };

        // Bind methods to this
        this.playerOnReady = this.playerOnReady.bind(this);
        this.playerOnStateChange = this.playerOnStateChange.bind(this);
        this.onSelectVideo = this.onSelectVideo.bind(this);
    }

    onSelectVideo(video_url) {
        const { player } = this.state;

        const id = YoutubeVideoId(video_url);

        player.loadVideoById(id);
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
            <div>
                <Selector onSelect={this.onSelectVideo} />
                <Youtube
                    videoId={video_id}
                    opts={options}
                    onReady={this.playerOnReady}
                    onStateChange={this.playerOnStateChange}
                />
            </div>
        );
    }

    playerOnStateChange(event) {
        console.log("Player state change");
        const { player, previous_player_state, socket } = this.state;

        const new_player_state = event.data;
        const url = player.getVideoUrl();
        const elapsed = player.getCurrentTime();

        const state = {
            player_state: new_player_state,
            url: url,
            elapsed: elapsed,
            timestamp: Date.now() / 1000
        };

        socket.emit("update", state);
        console.log("update");
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
        const socket = io("", { query: "room=default" });
        const player = event.target;
        this.setState({ player: player, connected: true });
        console.log(event.target);

        console.log(
            `Video quality options: ${player.getAvailableQualityLevels()}`
        );

        socket.on("play", data => {
            player.playVideo();
            console.log("playVideo");
        });

        socket.on("pause", data => {
            player.pauseVideo();
            console.log("pauseVideo");
        });

        socket.on("change", new_id => {
            player.pauseVideo();
            player.loadVideoById(new_id);
        });

        socket.on("seek", time => {
            if (player.getPlayerState() == YT.PlayerState.PLAYING) {
                time += 0.7;
            }
            player.seekTo(time);
            console.log("seek");
        });
        this.setState({ socket: socket });
    }
}

SyncedYoutubePlayer.defaultProps = {
    video_id: "c8W-auqg024"
};
