// models/approveaddcallrequestModel.js
const db = require("../config/db"); // Update path if needed
const moment = require("moment-timezone");

// Get all active approveaddcallrequests
const getAllActiveApproveaddcallrequests = (callback) => {
  

    const sql = `
      SELECT tbl_approve_addcall_request.*, tbl_booking.fld_name as client_name, tbl_booking.fld_client_id as client_code, tbl_plan.plan as planName, addedby.id as crm_id, addedby.fld_name as crm_name, tbl_admin.fld_name as admin_name, tbl_admin.fld_email as admin_email FROM tbl_approve_addcall_request JOIN tbl_booking ON tbl_approve_addcall_request.bookingId = tbl_booking.id JOIN tbl_plan ON tbl_approve_addcall_request.planId = tbl_plan.id LEFT JOIN tbl_admin ON tbl_booking.fld_consultantid = tbl_admin.id LEFT JOIN tbl_admin as addedby ON tbl_booking.fld_addedby = addedby.id ORDER BY tbl_approve_addcall_request.id DESC
      `;

    db.query(sql, (queryErr, results) => {
      if (queryErr) return callback(queryErr, null);
      return callback(null, results);
    });
  
};

// Get all approveaddcallrequests
const getAllApproveaddcallrequests = (callback) => {
 

    const sql = `SELECT tbl_approve_addcall_request.*, tbl_booking.fld_name as client_name, tbl_booking.fld_client_id as client_code, tbl_plan.plan as planName, addedby.id as crm_id, addedby.fld_name as crm_name, tbl_admin.fld_name as admin_name, tbl_admin.fld_email as admin_email FROM tbl_approve_addcall_request JOIN tbl_booking ON tbl_approve_addcall_request.bookingId = tbl_booking.id JOIN tbl_plan ON tbl_approve_addcall_request.planId = tbl_plan.id LEFT JOIN tbl_admin ON tbl_booking.fld_consultantid = tbl_admin.id LEFT JOIN tbl_admin as addedby ON tbl_booking.fld_addedby = addedby.id ORDER BY tbl_approve_addcall_request.id DESC`;

    db.query(sql, (queryErr, results) => {
      
      if (queryErr) return callback(queryErr, null);
      return callback(null, results);
    });
  
};

// Update approveaddcallrequest status
const updateApproveaddcallrequeststatus = (approveaddcallrequestId, status, callback) => {
 

    const sql = `UPDATE tbl_approve_addcall_request SET status = ? WHERE id = ?`;

    db.query(sql, [status, approveaddcallrequestId], (queryErr, result) => {
      
      if (queryErr) return callback(queryErr);
      return callback(null, result);
    });
  
};

// ✅ New helper method
const enableBookingByApproveRequest = (approveaddcallrequestId, callback) => {
  const sql = `
    UPDATE tbl_booking 
    SET callDisabled = NULL 
    WHERE id = (
      SELECT bookingId FROM tbl_approve_addcall_request WHERE id = ?
    )
  `;

  db.query(sql, [approveaddcallrequestId], (err, result) => {
    if (err) return callback(err);
    return callback(null, result);
  });
};

const getAllPendingaddcallrequests = (callback) => {
  

    const sql = `
      SELECT COUNT(*) AS pendingCount 
      FROM tbl_approve_addcall_request
      WHERE status = 'Pending'
    `;

    db.query(sql, (queryErr, results) => {
      if (queryErr) return callback(queryErr, null);

      // results[0].pendingCount will hold the number
      return callback(null, results[0].pendingCount);
    });
  
};


module.exports = {
  getAllApproveaddcallrequests,
  getAllActiveApproveaddcallrequests,
  updateApproveaddcallrequeststatus,
  getAllPendingaddcallrequests,
  enableBookingByApproveRequest
};
