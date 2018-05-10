import express from "express";
import path from "path";
import logger from "morgan";
import http from "http";

import config from "./config"

const public_folder = path.resolve("../public");
const app = express();

app.use(logger(config.logging_format));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(public_folder));


app.get("/", (req, res) => {
    res.sendFile(path.join(public_folder, "index.html"));
});

export default app;