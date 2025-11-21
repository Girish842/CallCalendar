// models/helperModel.js
const db = require("../config/db"); // Update path if needed
const moment = require("moment-timezone");

function getCurrentDate(format = "YYYY-MM-DD") {
  return moment().tz("Asia/Kolkata").format(format);
}


// Get all active teams
const getAllActiveTeams = (callback) => {


  const sql = `
      SELECT * FROM tbl_team
      WHERE status = 'Active'
      ORDER BY fld_addedon DESC
    `;

  db.query(sql, (queryErr, results) => {
    if (queryErr) return callback(queryErr, null);
    return callback(null, results);
  });

};

// Get all teams
const getAllTeams = (callback) => {

const sql = `
    SELECT t.*, 
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'id', a.id, 
               'fld_name', a.fld_name
             )
           ) AS users
    FROM tbl_team t
    LEFT JOIN tbl_admin a 
      ON FIND_IN_SET(t.id, a.fld_team_id) > 0
    GROUP BY t.id
    ORDER BY t.fld_addedon DESC
  `;

  db.query(sql, (queryErr, results) => {
    if (queryErr) return callback(queryErr, null);

    // Fix MySQL JSON returning string instead of array
    const formattedResults = results.map(team => ({
      ...team,
      users: team.users ? JSON.parse(team.users) : []
    }));

    return callback(null, formattedResults);
  });

};

// Add a new team
const addTeam = (teamData, callback) => {


  const sql = `INSERT INTO tbl_team (fld_title, fld_addedon, status) VALUES (?, NOW(), 'Active')`;

  db.query(sql, [teamData.team], (queryErr, result) => {

    if (queryErr) return callback(queryErr);

    // Return only the inserted ID
    return callback(null, result.insertId);
  });

};


// Update team title
const updateTeam = (id, teamData, callback) => {


  const sql = `UPDATE tbl_team SET fld_title = ? WHERE id = ?`;

  db.query(sql, [teamData.team, id], (queryErr, result) => {

    if (queryErr) return callback(queryErr);
    return callback(null, result);
  });

};

// Update team status
const updateTeamStatus = (teamId, status, callback) => {


  const sql = `UPDATE tbl_team SET status = ? WHERE id = ?`;

  db.query(sql, [status, teamId], (queryErr, result) => {
    if (queryErr) return callback(queryErr);
    return callback(null, result);
  });

};

const getTeamById = (teamId, callback) => {
  if (!teamId) return callback(new Error("Team ID is required"));

  const query = 'SELECT * FROM tbl_team WHERE id = ?';



  db.query(query, [teamId], (error, results) => {

    if (error) return callback(error);

    if (results.length > 0) {
      callback(null, results[0]);
    } else {
      callback(null, null);
    }
  });

};

const getAllDomains = (callback) => {
  const sql = `
    SELECT 
      id, 
      domain,
      fld_addedon,
      status,
      cosultantId
    FROM tbl_domain_pref
    ORDER BY id DESC
  `;



  db.query(sql, [], (error, results) => {
    if (error) {
      console.error("Query error (getAllDomains):", error);
      return callback(error, null);
    }

    return callback(null, results);
  });

};


const getAllSubjectAreas = (callback) => {
  const query = `
    SELECT id, domain 
    FROM tbl_domain_pref 
    WHERE status = 'Active'
  `;


  db.query(query, (error, results) => {
    if (error) {
      console.error("Query error (subject areas):", error);
      return callback(error, null);
    }
    return callback(null, results);
  });

};

const getAllActiveConsultants = (callback) => {
  const query = `
    SELECT id, fld_name, fld_email, fld_phone ,fld_username,fld_permission
    FROM tbl_admin 
    WHERE fld_admin_type = 'CONSULTANT' 
      AND status = 'Active' 
      AND attendance = 'PRESENT'
  `;



  db.query(query, (error, results) => {
    if (error) {
      console.error("Query error (consultants):", error);
      return callback(error, null);
    }
    return callback(null, results);
  });

};

const getAllActiveBothConsultants = (callback) => {
  const query = `
    SELECT id, fld_name, fld_email, fld_phone, fld_username, fld_permission
    FROM tbl_admin 
    WHERE status = 'Active'
      AND attendance = 'PRESENT'
      AND (
        fld_admin_type = 'CONSULTANT' 
        OR fld_admin_type = 'SUBADMIN'
      )
  `;



  db.query(query, (error, results) => {
    if (error) {
      console.error("Query error (consultants):", error);
      return callback(error, null);
    }
    return callback(null, results);
  });

};


const getAdmin = (type, status, callback) => {
  let query = `
    SELECT * FROM tbl_admin
    WHERE status = ?
  `;
  let params = [status];

  if (type !== "BOTH") {
    query += ` AND fld_admin_type = ?`;
    params.push(type);
  } else {
    query += ` AND fld_admin_type IN ('CONSULTANT', 'SUBADMIN')`;
  }



  db.query(query, params, (error, results) => {
    if (error) {
      console.error("Query error (getAdmin):", error);
      return callback(error, null);
    }
    return callback(null, results);
  });

};


const getSuperConsultants = (status, callback) => {
  let query = `
    SELECT * FROM tbl_admin
    WHERE status = ? AND fld_admin_type = 'CONSULTANT' AND fld_consultant_role = 'SENIOR'
  `;
  let params = [status];

  db.query(query, params, (error, results) => {
    if (error) {
      console.error("Query error (getAdmin):", error);
      return callback(error, null);
    }
    return callback(null, results);
  });
};

const getPlanDetails = (callback) => {
  const query = `
    SELECT *
    FROM tbl_plan 
  `;



  db.query(query, (error, results) => {
    if (error) {
      console.error("Query error (plans):", error);
      return callback(error, null);
    }
    return callback(null, results);
  });

};

const getBookingDetailsWithRc = (id, callback) => {
  let sql = `
    SELECT 
      b.*, 
      r.slot_time AS rc_slot_time, 
      r.booking_date AS rc_booking_date, 
      a.fld_name AS consultant_name,
      a.fld_consultant_role AS consultant_role
    FROM tbl_booking b
    LEFT JOIN tbl_rc_call_booking_request r ON r.id = b.fld_call_request_id
    LEFT JOIN tbl_admin a ON a.id = b.fld_consultantid
    WHERE b.callDisabled IS NULL
  `;

  const values = [];

  if (id) {
    sql += ` AND b.id = ?`;
    values.push(id);
  }

  sql += ` ORDER BY b.id DESC`;

  db.query(sql, values, (error, results) => {
    if (error) return callback(error);

    if (id) {
      callback(null, results.length ? results[0] : null);
    } else {
      callback(null, results);
    }
  });
};


const getConsultantSettingData = (consultantId, callback) => {


  const sql = `
      SELECT * FROM tbl_consultant_setting
      WHERE fld_consultantid = ?
      ORDER BY id DESC
      LIMIT 1
    `;

  db.query(sql, [consultantId], (error, results) => {
    if (error) return callback(error);

    callback(null, results.length ? results[0] : null);
  });

};

const getConsultantPresaleSlots = (consultantId, callback) => {
  try {
    if (!consultantId) {
      return callback(new Error("consultantId is required"));
    }

    // Step 1: Get consultant role
    const roleQuery = `SELECT fld_consultant_role FROM tbl_admin WHERE id = ? LIMIT 1`;

    db.query(roleQuery, [consultantId], (roleErr, roleResults) => {
      if (roleErr) {
        console.error("Error fetching consultant role:", roleErr);
        return callback(roleErr);
      }

      if (!roleResults.length) {
        return callback(null, {}); // No such consultant
      }

      const role = roleResults[0].fld_consultant_role;

      // Step 2: If SUB → return empty array
      if (role === "SUB") {
        return callback(null, {});
      }

      // Step 3: If SENIOR → fetch presale slots
      if (role === "SENIOR") {
        const slotQuery = `
          SELECT * FROM tbl_consultant_presaleslots
          WHERE user_id = ?
          ORDER BY id DESC
          LIMIT 1
        `;

        db.query(slotQuery, [consultantId], (slotErr, slotResults) => {
          if (slotErr) {
            console.error("Error fetching presale slots:", slotErr);
            return callback(slotErr);
          }

          if (!slotResults.length) {
            return callback(null, {}); // No slots found
          }

          return callback(null, slotResults[0]); // Return the row
        });
      } else {
        // Other roles (if any)
        return callback(null, {});
      }
    });
  } catch (err) {
    console.error("Unexpected error (getConsultantPresaleSlots):", err);
    return callback(err);
  }
};


const getUsersByRole = (role, status, callback) => {


  let query = "SELECT id, fld_name FROM tbl_admin WHERE fld_admin_type = ?";
  const params = [role];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  db.query(query, params, (err, results) => {

    if (err) {
      console.error("Query error:", err);
      return callback(err);
    }

    callback(null, results);
  });

};

const fetchTimezones = (viewtype = "", callback) => {
  try {
    const tzList = moment.tz.names();
    let formattedList = {};
    let index = 1;

    tzList.forEach((tz) => {
      const now = moment().tz(tz);

      if (viewtype === "show_custom_booking") {
        formattedList[index] = tz;
      } else {
        const abbr = now.zoneAbbr(); // e.g., IST
        const offset = now.format("Z"); // e.g., +05:30
        const time = now.format("hh:mm A"); // e.g., 02:25 PM
        formattedList[index] = `${tz}  ${abbr} ${offset}  ${time}`;
      }

      index++;
    });

    callback(null, formattedList);
  } catch (error) {
    callback(error, null);
  }
};

const getBookingData = (params, callback) => {
  try {


    const {
      bookingId = "",
      consultantId = "",
      userId = "",
      selectedDate = "",
      status = "",
      orderBy = "DESC",
      addedBy = "",
      checkType = "",
      selectedSlot = "",
      callExternalAssign = "",
      showAcceptedCall = "",
      verifyOtpUrl = "",
      hideSubOption = "",
      clientId = "",
      disabledBookingId = "",
    } = params;

    let sql = `
        SELECT 
          b.*, 
          a.fld_client_code AS admin_code, a.fld_name AS admin_name, a.fld_email AS admin_email, a.fld_profile_image, 
          a.fld_client_code AS consultant_code, 
          u.fld_user_code AS user_code, u.fld_name AS user_name, u.fld_email AS user_email, 
          u.fld_decrypt_password AS user_pass, u.fld_country_code AS user_country_code, u.fld_phone AS user_phone, 
          u.fld_address, u.fld_city, u.fld_pincode, u.fld_country
        FROM tbl_booking b
        LEFT JOIN tbl_admin a ON b.fld_consultantid = a.id
        LEFT JOIN tbl_user u ON b.fld_userid = u.id
        WHERE b.callDisabled IS NULL
      `;

    const values = [];

    if (bookingId) {
      sql += " AND b.id = ?";
      values.push(bookingId);
    }

    if (consultantId && checkType !== "CHECK_BOTH") {
      sql += " AND b.fld_consultantid = ?";
      values.push(consultantId);
    }

    if (checkType === "CHECK_BOTH") {
      sql +=
        " AND (b.fld_consultantid = ? OR b.fld_secondary_consultant_id = ? OR b.fld_third_consultantid = ?)";
      values.push(consultantId, consultantId, consultantId);
    }

    if (addedBy) {
      sql += " AND b.fld_addedby = ?";
      values.push(addedBy);
    }

    if (userId) {
      sql += " AND b.fld_userid = ?";
      values.push(userId);
    }

    if (clientId) {
      sql += " AND b.fld_client_id = ? AND b.id != ?";
      values.push(clientId, disabledBookingId || 0);
    }

    if (status == "Reject") {
      sql +=
        " AND b.fld_consultation_sts != 'Reject' AND b.fld_consultation_sts != 'Rescheduled'";
    }

    if (showAcceptedCall === "Yes") {
      sql += " AND b.fld_consultation_sts = 'Accept'";
    }

    if (verifyOtpUrl) {
      sql += " AND b.fld_verify_otp_url = ?";
      values.push(verifyOtpUrl);
    }

    if (status === "Completed") {
      sql += " AND b.fld_consultation_sts = 'Completed'";
    }

    if (selectedDate) {
      sql += " AND b.fld_booking_date = ?";
      values.push(selectedDate);
    }

    if (selectedSlot) {
      sql += " AND b.fld_booking_slot = ?";
      values.push(selectedSlot);
    }

    if (callExternalAssign) {
      sql += " AND b.fld_call_external_assign = ?";
      values.push(callExternalAssign);
    }

    if (hideSubOption) {
      sql +=
        " AND (b.fld_consultant_another_option = 'CONSULTANT' OR b.fld_consultant_another_option IS NULL)";
    }

    sql += ` ORDER BY b.id ${orderBy}`;

    db.query(sql, values, (err, results) => {
      if (err) return callback(err, null);
      return callback(null, bookingId ? results[0] : results);
    });

  } catch (error) {
    return callback(error, null);
  }
};

const getRcCallBookingRequest = (params, callback) => {
  try {


    const {
      id = "",
      crmId = "",
      consultantId = "",
      selectedDate = "",
      selectedSlot = "",
      status = "",
    } = params;

    let sql = `
        SELECT 
          r.*, 
          b.id AS bookingid, 
          crm.fld_name 
        FROM tbl_rc_call_booking_request r 
        LEFT JOIN tbl_booking b ON r.id = b.fld_call_request_id 
        LEFT JOIN tbl_admin crm ON r.crmid = crm.id 
        WHERE r.reqFrom = 'RC'
      `;

    const values = [];

    if (crmId) {
      sql += " AND r.crmid = ?";
      values.push(crmId);
    }

    if (id) {
      sql += " AND r.id = ?";
      values.push(id);
    }

    if (selectedDate) {
      sql += " AND r.booking_date = ?";
      values.push(selectedDate);
    }

    if (selectedSlot) {
      sql += " AND r.slot_time = ?";
      values.push(selectedSlot);
    }

    if (consultantId) {
      sql += " AND r.consultantid = ?";
      values.push(consultantId);
    }

    if (status) {
      sql += " AND r.call_request_sts = ?";
      values.push(status);
    }

    sql += " ORDER BY r.id DESC";

    db.query(sql, values, (err, results) => {
      if (err) return callback(err, null);
      return callback(null, id ? results[0] : results);
    });

  } catch (error) {
    return callback(error, null);
  }
};

const getAdminById = (adminId, callback) => {


  db.query(
    "SELECT * FROM tbl_admin WHERE id = ?",
    [adminId],
    (error, results) => {
      callback(error, results[0]);
    }
  );

};

const getMessagesByBookingId = (bookingId, callback) => {


  const query = `
        SELECT tbl_booking_chat.* , tbl_admin.fld_name as sender_name 
        FROM tbl_booking_chat
        LEFT JOIN tbl_admin ON tbl_booking_chat.fld_sender_id = tbl_admin.id
        WHERE tbl_booking_chat.fld_bookingid = ?
        ORDER BY tbl_booking_chat.fld_addedon ASC
      `;

  db.query(query, [bookingId], (queryErr, results) => {


    if (queryErr) {
      console.error("Query error:", queryErr);
      return callback(queryErr, null);
    }

    return callback(null, results);
  });

};

const getMessageCount = (bookingid, callback) => {
  try {


    const query = `SELECT COUNT(*) AS count FROM tbl_booking_chat WHERE fld_bookingid = ?`;
    db.query(query, [bookingid], (err, results) => {

      callback(err, results);
    });

  } catch (error) {
    callback(error);
  }
};

const insertChatMessage = (data, callback) => {
  try {


    const query = `INSERT INTO tbl_booking_chat SET ?`;
    db.query(query, data, (err, results) => {
      callback(err, results);
    });

  } catch (error) {
    callback(error);
  }
};

const getFollowerData = (filters, callback) => {


  let query = "SELECT * FROM tbl_follower WHERE 1=1";
  const params = [];

  if (filters.id) {
    query += " AND id = ?";
    params.push(filters.id);
  }
  if (filters.follower_consultant_id) {
    query += " AND follower_consultant_id = ?";
    params.push(filters.follower_consultant_id);
  }
  if (filters.bookingid) {
    query += " AND bookingid = ?";
    params.push(filters.bookingid);
  }
  if (filters.consultantid) {
    query += " AND consultantid = ?";
    params.push(filters.consultantid);
  }
  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  db.query(query, params, (err, results) => {

    if (err) {
      return callback(err);
    }


    if (filters.id) {
      return callback(null, results[0] || null);
    } else {
      return callback(null, results);
    }
  });

};

const checkFollowerExists = (bookingId, followerId, callback) => {

  const sql = `SELECT id FROM tbl_follower WHERE bookingid = ? AND follower_consultant_id = ?`;
  db.query(sql, [bookingId, followerId], (err, results) => {

    if (err) return callback(err);
    callback(null, results.length > 0);
  });

};

const insertFollower = (data, callback) => {

  const sql = `
      INSERT INTO tbl_follower (bookingid, follower_consultant_id, consultantid, addedon)
      VALUES (?, ?, ?, ?)
    `;
  const values = [data.bookingid, data.follower_consultant_id, data.consultantid, data.addedon];
  db.query(sql, values, (err, result) => {

    if (err) return callback(err);
    callback(null, result.insertId);
  });

};

const getNotifications = (user, callback) => {

  let sql;
  let params = [];
  if (user.fld_admin_type.toUpperCase() === 'SUPERADMIN') {
    sql = `
          SELECT id, fld_bookingid, fld_sender_id, fld_receiver_id, fld_message, fld_postedby, fld_view_status,
                 fld_read_status, fld_read_time, fld_addedon
          FROM tbl_booking_chat
          WHERE  fld_read_status = 'UNREAD'
          ORDER BY fld_addedon DESC
          
          LIMIT 50
        `;
  } else {
    sql = `
          SELECT id, fld_bookingid, fld_sender_id, fld_receiver_id, fld_message, fld_postedby, fld_view_status,
                 fld_read_status, fld_read_time, fld_addedon
          FROM tbl_booking_chat
          WHERE fld_receiver_id = ? AND fld_read_status = 'UNREAD'
          ORDER BY fld_addedon DESC
          LIMIT 50
        `;
    params = [user.id];
  }



  db.query(sql, params, (queryErr, results) => {

    if (queryErr) return callback(queryErr);

    callback(null, results);
  });

};

const markAsRead = (id, callback) => {

  const readTime = getCurrentDate("YYYY-MM-DD HH:mm:ss");
  const query = `
      UPDATE tbl_booking_chat 
      SET fld_read_status = "READ", fld_read_time = ? 
      WHERE id = ?
    `;

  db.query(query, [readTime, id], (err, result) => {


    if (err) {
      console.error("Query error:", err);
      return callback(err);
    }

    return callback(null, result);
  });

};

const getSubjectAreasByConsultantName = (consultantName, callback) => {
  const query = `
    SELECT domain 
    FROM tbl_domain_pref
    WHERE status = 'Active'
      AND FIND_IN_SET(?, REPLACE(cosultantId, ' ', '')) > 0
  `;
  db.query(query, [consultantName.replace(/\s+/g, '')], callback);
};

const getFollowerByID = (followerId, callback) => {


  let sql = `
      SELECT 
        tbl_follower.id as followerid, 
        tbl_follower.bookingid,
        tbl_follower.follower_consultant_id,
        tbl_follower.consultantid,
        tbl_follower.addedon, 
        tbl_follower.status as followstatus, 
        tbl_booking.*, 
        addedby.fld_name as admin_name, 
        addedby.fld_email as admin_email, 
        consultant.fld_name as consultant_name, 
        tbl_user.fld_user_code as user_code, 
        tbl_user.fld_name as user_name, 
        tbl_user.fld_email as user_email, 
        tbl_user.fld_decrypt_password as user_pass, 
        tbl_user.fld_country_code as user_country_code, 
        tbl_user.fld_phone as user_phone, 
        tbl_user.fld_address, 
        tbl_user.fld_city, 
        tbl_user.fld_pincode, 
        tbl_user.fld_country 
      FROM tbl_follower 
      JOIN tbl_booking ON tbl_booking.id = tbl_follower.bookingid 
      LEFT JOIN tbl_admin as addedby ON tbl_booking.fld_addedby = addedby.id 
      LEFT JOIN tbl_admin as consultant ON tbl_booking.fld_consultantid = consultant.id 
      JOIN tbl_user ON tbl_booking.fld_userid = tbl_user.id
      WHERE tbl_follower.id = ?
    `;

  db.query(sql, [followerId], (queryErr, results) => {

    if (queryErr) return callback(queryErr, null);
    return callback(null, results[0] || null);
  });

};

const getAddCallRequestByBookingId = (bookingId, callback) => {

  const sql = `
      SELECT 
        tbl_approve_addcall_request.*, 
        tbl_booking.fld_name AS client_name, 
        tbl_booking.fld_client_id AS client_code, 
        tbl_plan.plan AS planName, 
        addedby.id AS crm_id, 
        addedby.fld_name AS crm_name, 
        tbl_admin.fld_name AS admin_name, 
        tbl_admin.fld_email AS admin_email
      FROM tbl_approve_addcall_request
      JOIN tbl_booking 
        ON tbl_approve_addcall_request.bookingId = tbl_booking.id
      JOIN tbl_plan 
        ON tbl_approve_addcall_request.planId = tbl_plan.id
      LEFT JOIN tbl_admin 
        ON tbl_booking.fld_consultantid = tbl_admin.id
      LEFT JOIN tbl_admin AS addedby 
        ON tbl_booking.fld_addedby = addedby.id
      WHERE tbl_approve_addcall_request.bookingId = ?
      ORDER BY tbl_approve_addcall_request.id DESC
      LIMIT 1
    `;

  db.query(sql, [bookingId], (queryErr, results) => {

    if (queryErr) return callback(queryErr, null);
    return callback(null, results.length > 0 ? results[0] : null);
  });

};

module.exports = {
  getAllTeams,
  getAllActiveTeams,
  addTeam,
  updateTeam,
  updateTeamStatus,
  getAllDomains,
  getAllActiveConsultants,
  getAllSubjectAreas,
  getPlanDetails,
  getBookingDetailsWithRc,
  getConsultantSettingData,
  getUsersByRole,
  fetchTimezones,
  getBookingData,
  getRcCallBookingRequest,

  getAdmin,
  getSuperConsultants,
  getAdminById,
  getMessagesByBookingId,
  getMessageCount,
  insertChatMessage,
  getFollowerData,
  getAllActiveBothConsultants,
  insertFollower,
  checkFollowerExists,
  getNotifications,
  markAsRead,
  getSubjectAreasByConsultantName,
  getTeamById,
  getFollowerByID,
  getAddCallRequestByBookingId,
  getConsultantPresaleSlots
};
