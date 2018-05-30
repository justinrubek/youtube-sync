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
            player: null,
            previous_player_state: null
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
        const {
            player,
            previous_player_state,
            socket,
            simulation
        } = this.state;

        const new_player_state = event.data;
        if (new_player_state == YT.PlayerState.UNSTARTED) {
            // The server doesn't need to know?
            return;
        }

        // TODO: Revamp
        // Player should interact with a simulation
        // ^^MAYBE^^
        // X: We should check whether or not the change is a play or pause event
        // If not, we might not have to send anything to the server
        // PlayerState -1 when first initialized, 3 when buffering, 1 & 2 for running
        // Will probably start with a -1, likely followed by a 3 for the video initial buffer
        // before setting between 1 and 2. This is repeated every time the video is changed on the player

        // Check if this is our initial buffer upon video load
        if (new_player_state == 3) {
            // This is the initial buffering
            if (previous_player_state == -1) {
                return;
            }

            // Probably alert the server to pause or something, somebody is behind
        }

        const elapsed = player.getCurrentTime();
        if (new_player_state != previous_player_state) {
            if (new_player_state == YT.PlayerState.PLAYING) {
                socket.emit("play", elapsed);
            }
            if (new_player_state == YT.PlayerState.PAUSED) {
                socket.emit("pause", elapsed);
            }

            this.setState({ previous_player_state: new_player_state });
        } else {
            const url = player.getVideoUrl();

            const state = {
                player_state: new_player_state,
                url: url,
                elapsed: elapsed,
                timestamp: Date.now() / 1000
            };
            socket.emit("seek", elapsed);

            // socket.emit("update", state);
            // console.log("update");
        }
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
            seekTo(player, data);
            player.playVideo();
            console.log("playVideo");
        });

        socket.on("pause", data => {
            seekTo(player, data);
            player.pauseVideo();
            console.log("pauseVideo");
        });

        socket.on("change", new_id => {
            player.pauseVideo();
            player.loadVideoById(new_id);
        });

        socket.on("seek", time => {
            seekTo(player, time);
        });
        this.setState({ socket: socket });
    }
}

function seekTo(player, time) {
    if (player.getPlayerState() == YT.PlayerState.PLAYING) {
        time += 0.7;
    }
    player.seekTo(time);
    console.log("seek");
}

SyncedYoutubePlayer.defaultProps = {
    video_id: "c8W-auqg024"
};
