const express = require("express");
const router = express.Router();

const {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    showStats,
} = require("../controllers/jobs.js");

const testUser = require("../middleware/testUser.js");

router.route("/").post(testUser, createJob).get(getAllJobs);
router.route("/stats").get(showStats);
router
    .route("/:id")
    .get(getJob)
    .delete(testUser, deleteJob)
    .patch(testUser, updateJob);

module.exports = router;
