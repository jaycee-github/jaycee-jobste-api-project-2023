require("dotenv").config();

const mockData = require("./mock-data.json");
const Job = require("./models/Job.js");
const connectDB = require("./db/connect.js");

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        await Job.create(mockData);
        console.log("Successfully uploaded data.....");
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

start();
