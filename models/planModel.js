// models/planModel.js
const db = require("../config/db"); // Update path if needed
const moment = require("moment-timezone");

// Get all active plans
const getAllActivePlans = (callback) => {
  

    const sql = `
      SELECT * FROM tbl_plan ORDER BY id ASC
      `;

    db.query(sql, (queryErr, results) => {
      if (queryErr) return callback(queryErr, null);
      return callback(null, results);
    });
  
};

// Get all plans
const getAllPlans = (callback) => {

    const sql = `
      SELECT * FROM tbl_plan ORDER BY id ASC
    `;

    db.query(sql, (queryErr, results) => {
      if (queryErr) return callback(queryErr, null);
      return callback(null, results);
    });
  
};

// Update Plan title
const updatePlan = (id, planData, callback) => {

    const sql = `UPDATE tbl_plan SET allowedCalls = ? WHERE id = ?`;

    db.query(sql, [planData.allowedCalls, id], (queryErr, result) => {
      if (queryErr) return callback(queryErr);
      return callback(null, result);
    });
  
};

module.exports = {
  getAllPlans,
  getAllActivePlans,
  updatePlan,
};
