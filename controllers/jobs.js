const Job = require("../models/Job.js");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const mongoose = require("mongoose");
const moment = require("moment");

// get all jobs controller
const getAllJobs = async (req, res) => {
    console.log(req.query);

    const { status, jobType, sort, search } = req.query;

    const queryObject = {
        createdBy: req.user.userId,
    };

    if (search) {
        queryObject.position = { $regex: search, $options: "i" };
    }

    if (status && status !== "all") {
        queryObject.status = status;
    }

    if (jobType && jobType !== "all") {
        queryObject.jobType = jobType;
    }

    let result = Job.find(queryObject);

    // We need to sort first because we can't use sort in "await"
    if (sort === "latest") {
        result = result.sort("-createdAt");
    }

    if (sort === "oldest") {
        result = result.sort("createdAt");
    }

    if (sort === "a-z") {
        result = result.sort("position");
    }

    if (sort === "z-a") {
        result = result.sort("-position");
    }

    // pagination setup
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    result = result.skip(skip).limit(limit);

    const jobs = await result;
    const totalJobs = await Job.countDocuments(queryObject);
    const numOfPages = Math.ceil(totalJobs / limit);

    return res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages });
};

// get job / get single job controller
const getJob = async (req, res) => {
    const {
        user: { userId },
        params: { id: jobId },
    } = req;

    const job = await Job.findOne({ _id: jobId, createdBy: userId });

    if (!job) {
        throw new NotFoundError(`No job with ID : ${jobId}`);
    }

    return res.status(StatusCodes.OK).json({ job });
};

const createJob = async (req, res) => {
    req.body.createdBy = req.user.userId;

    const job = await Job.create(req.body);

    return res.status(StatusCodes.CREATED).json({ job });
};

const updateJob = async (req, res) => {
    const {
        body: { company, position },
        user: { userId },
        params: { id: jobId },
    } = req;

    if (company === "" || position === "") {
        throw new BadRequestError(
            "Company and/or Position fields cannoy be empty."
        );
    }

    const job = await Job.findOneAndUpdate(
        { _id: jobId, createdBy: userId },
        req.body,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!job) {
        throw new NotFoundError(`No job with ID : ${jobId}`);
    }

    return res.status(StatusCodes.CREATED).json({ job });
};

const deleteJob = async (req, res) => {
    const {
        user: { userId },
        params: { id: jobId },
    } = req;

    const job = await Job.findOneAndRemove({ _id: jobId, createdBy: userId });

    if (!job) {
        throw new NotFoundError(`No job with ID : ${jobId}`);
    }

    return res.status(StatusCodes.OK).send();
};

const showStats = async (req, res) => {
    let stats = await Job.aggregate([
        { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // refactor stats data
    stats = stats.reduce((acc, curr) => {
        const { _id: title, count } = curr;
        acc[title] = count;
        return acc;
    }, {});

    // console.log(stats);

    // set default stats
    const defaultStats = {
        pending: stats.pending || 0,
        interview: stats.interview || 0,
        declined: stats.declined || 0,
    };

    // monthly applications setup
    let monthlyApplications = await Job.aggregate([
        { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { "_id.year": -1, "_id.month": -1 },
        },
        {
            $limit: 6,
        },
    ]);

    monthlyApplications = monthlyApplications
        .map((item) => {
            const {
                _id: { year, month },
                count,
            } = item;

            const date = moment()
                .month(month - 1)
                .year(year)
                .format("MMM Y");

            return { date, count };
        })
        .reverse();

    // console.log(monthlyApplications);

    res.status(StatusCodes.OK).json({
        defaultStats,
        monthlyApplications,
    });
};

module.exports = {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    showStats,
};
