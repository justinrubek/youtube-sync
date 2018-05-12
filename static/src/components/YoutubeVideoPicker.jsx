import React, { Component } from "react";

export default class YoutubeVideoPicker extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: ""
        };

        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    onClick() {
        const { value } = this.state;
        this.props.onSelect(value);
        //socket.emit("change", value);
    }

    onChange(e) {
        console.log(e.target.value);
        this.setState({ value: e.target.value });
    }

    render() {
        const { value } = this.state;

        return (
            <div>
                <input onChange={this.onChange} value={value} />
                <button onClick={this.onClick}>Change video</button>
            </div>
        );
    }
}
