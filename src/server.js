import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import authorsRoutes from "./BlogAuthors/index.js";
import usersRoutes from "./Users/index.js";
import blogPostsRoutes from "./BlogPosts/index.js";
import {unAuthorizedHandler, notFoundErrorHandler, badRequestErrorHandler, forbiddenErrorHandler, catchAllErrorHandler } from "./errorHandlers.js";
import { getCurrentFolderPath } from "./lib/fs-tools.js";
import { dirname, join } from "path";
import mongoose from "mongoose";

const server = express();

const port = process.env.PORT || 3001;

const publicFolderPath = join(getCurrentFolderPath(import.meta.url), "../public");

server.use(express.static(publicFolderPath));

const whitelist = [process.env.FRONTEND_DEV_URL, process.env.FRONTEND_CLOUD_URL];

const corsOptions = {
  origin: function (origin, next) {
    console.log("ORIGIN", origin);
    if (whitelist.indexOf(origin) !== -1) {
      next(null, true);
    } else {
      next(new Error("CORS TROUBLES!!!!!"));
    }
  },
};
// server.use(cors(corsOptions));
server.use(cors());
server.use(express.json());

server.use("/authors", authorsRoutes);
server.use("/users", usersRoutes);

server.use("/blogPosts", blogPostsRoutes);
// server.use("/files", filesRoutes);

server.use(unAuthorizedHandler);
server.use(notFoundErrorHandler);
server.use(badRequestErrorHandler);
server.use(forbiddenErrorHandler);
server.use(catchAllErrorHandler);

// console.log(listEndpoints(server));
console.table(listEndpoints(server));

mongoose.connect(process.env.MONGO_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  server.listen(port, () => {
    console.log("Server is running on port: ", port);
  });
});




