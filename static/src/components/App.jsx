import React from "react";
import Player from "./SyncedYoutubePlayer";

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    componentDidMount() {}

    render() {
        const player = <Player />;

        return <div>{player}</div>;
    }
}
