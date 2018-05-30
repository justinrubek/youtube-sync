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
            previous_player_state: null,
            initialized: false
        };

        // Bind methods to this
        this.playerOnReady = this.playerOnReady.bind(this);
        this.playerOnStateChange = this.playerOnStateChange.bind(this);
        this.onSelectVideo = this.onSelectVideo.bind(this);
    }

    onSelectVideo(video_url) {
        const { player, socket } = this.state;

        const id = YoutubeVideoId(video_url);

        player.loadVideoById(id);
        socket.emit("change", video_url);
    }

    render() {
        const {} = this.state;
        const { video_id } = this.props;

        const options = {
            host: "http://www.youtube.com",
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
            simulation,
            initialized
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
            console.log("Buffering");
            // This is the initial buffering
            if (previous_player_state == -1) {
                console.log("Initial buffer");
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
            console.log("received play from server");
            seekTo(player, data);
            player.playVideo();
            console.log("playVideo");
        });

        socket.on("pause", data => {
            console.log("received pause from server");
            seekTo(player, data);
            player.pauseVideo();
            console.log("pauseVideo");
        });

        socket.on("change", data => {
            // socket.disconnect();
            // this.setState({ socket: null });
            console.log("received change from server");
            const new_id = data.video_id;
            if (data.simulation != null) {
                player.loadVideoById({
                    videoId: new_id,
                    startSeconds: data.simulation.elapsed
                });
            } else {
                player.loadVideoById(new_id);
            }
        });

        socket.on("seek", time => {
            console.log("received seek from server");
            seekTo(player, time);
        });

        socket.on("initialize", sim_state => {
            seekTo(sim_state.elapsed);
            if (sim_state.status == "playing") {
                player.playVideo();
            } else if (sim_state.status == "paused") {
                player.pauseVideo();
            }
            this.setState({ initialized: true });
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
