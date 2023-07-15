require("dotenv").config();
require("express-async-errors");

const path = require("path");

const express = require("express");
const app = express();

// extra packages
const helmet = require("helmet");
const xss = require("xss-clean");

// connect DB
const connectDB = require("./db/connect.js");

const authenticateUser = require("./middleware/authentication.js");

// routers
const authRouter = require("./routes/auth.js");
const jobsRouter = require("./routes/jobs.js");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const { getAllJobs } = require("./controllers/jobs.js");

// middlewares
app.set("trust proxy", 1); // for api limiter

app.use(express.static(path.resolve(__dirname, "./client/build"))); // static files
app.use(express.json());
app.use(helmet());
app.use(xss());

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", authenticateUser, jobsRouter);

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "./client/build", "index.html"));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();
