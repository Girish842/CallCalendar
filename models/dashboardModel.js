// models/dashboardModel.js
const db = require("../config/db"); // Update path if needed
const moment = require('moment-timezone');



const getAllActiveTeams = (callback) => {
  const sql = `
    SELECT * FROM tbl_team
    WHERE status = 'Active'
    ORDER BY fld_addedon DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

function getCurrentISTDate(format = "YYYY-MM-DD HH:mm:ss") {
  return moment().tz("Asia/Kolkata").format(format);
}

// Main function
const getTotalData = async ({
  filter_type = '',
  consultantid = '',
  crm_id = '',
  sale_type = '',
  converted_sts = '',
  session_user_type = '',
  session_user_id = '',
  team_id = ''
}) => {
  let query = `SELECT id FROM tbl_booking b`;
  let conditions = [];
  let params = [];

  const consultantIdInt = consultantid && !isNaN(consultantid) ? parseInt(consultantid, 10) : null;
  const crmIdInt = crm_id && !isNaN(crm_id) ? parseInt(crm_id, 10) : null;
  const sessionUserIdInt = session_user_id && !isNaN(session_user_id) ? parseInt(session_user_id, 10) : null;

  const hasConsultant = consultantIdInt !== null;
  const hasCrm = crmIdInt !== null;

  // Consultant & CRM filters
  if (hasConsultant && hasCrm) {
    conditions.push(`(fld_consultantid = ? OR fld_secondary_consultant_id = ? OR fld_third_consultantid = ?) AND fld_addedby = ?`);
    params.push(consultantIdInt, consultantIdInt, consultantIdInt, crmIdInt);
  } else if (hasConsultant) {
    conditions.push(`(fld_consultantid = ? OR fld_secondary_consultant_id = ? OR fld_third_consultantid = ?)`);
    params.push(consultantIdInt, consultantIdInt, consultantIdInt);
  } else if (hasCrm) {
    conditions.push(`fld_addedby = ?`);
    params.push(crmIdInt);
  } else {
    // Session user filters
    if (session_user_type === 'EXECUTIVE' && sessionUserIdInt !== null) {
      conditions.push(`fld_addedby = ?`);
      params.push(sessionUserIdInt);
    } else if (session_user_type === 'CONSULTANT' && sessionUserIdInt !== null) {
      conditions.push(`(fld_consultantid = ? OR fld_secondary_consultant_id = ? OR fld_third_consultantid = ?)`);
      params.push(sessionUserIdInt, sessionUserIdInt, sessionUserIdInt);
    } else if (session_user_type === 'SUBADMIN' && sessionUserIdInt !== null) {
      if (team_id) {
        // team_id can be comma separated
        const teamIds = team_id.split(",").map(id => id.trim()).filter(Boolean);
        const findInSet = teamIds.map(() => "FIND_IN_SET(?, b.fld_teamid)").join(" OR ");
        conditions.push(`(fld_consultantid = ? OR ${findInSet})`);
        params.push(sessionUserIdInt, ...teamIds);
      } else {
        conditions.push(`fld_consultantid = ?`);
        params.push(sessionUserIdInt);
      }
    }
  }

  // Sale type filter
  if (sale_type) {
    conditions.push(`fld_sale_type = ?`);
    params.push(sale_type);
  }

  // Converted status
  if (converted_sts === 'Converted') {
    conditions.push(`LOWER(TRIM(fld_converted_sts)) = 'yes'`);
  }

  // Date filters
  if (filter_type) {
    let startDate = null;
    let endDate = null;

    switch (filter_type) {
      case 'Today':
        startDate = moment().tz("Asia/Kolkata").startOf('day').format('YYYY-MM-DD HH:mm:ss');
        endDate = moment().tz("Asia/Kolkata").endOf('day').format('YYYY-MM-DD HH:mm:ss');
        break;

      case 'Week':
        startDate = moment().tz("Asia/Kolkata").startOf('week').format('YYYY-MM-DD HH:mm:ss');
        endDate = moment().tz("Asia/Kolkata").endOf('week').format('YYYY-MM-DD HH:mm:ss');
        break;

      case 'Month':
        startDate = moment().tz("Asia/Kolkata").startOf('month').format('YYYY-MM-DD HH:mm:ss');
        endDate = moment().tz("Asia/Kolkata").endOf('day').format('YYYY-MM-DD HH:mm:ss');
        break;

      case 'Last':
        startDate = moment().tz("Asia/Kolkata").subtract(1, 'months').startOf('month').format('YYYY-MM-DD HH:mm:ss');
        endDate = moment().tz("Asia/Kolkata").subtract(1, 'months').endOf('month').format('YYYY-MM-DD HH:mm:ss');
        break;

      default:
        break;
    }

    if (startDate && endDate) {
      conditions.push(`fld_addedon BETWEEN ? AND ?`);
      params.push(startDate, endDate);
    }
  }

  // Final query
  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  console.log('Final Query:', query);
  console.log('Params:', params);

  return new Promise((resolve, reject) => {
    

      db.query(query, params, (error, results) => {
        if (error) return reject(error);

        resolve(results.length || 0);
      });
    
  });
};

const getParticularStatusCallsOfCrm = (crm_id, status, callback) => {

  const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

  let sql = `
    SELECT * FROM tbl_booking
    WHERE fld_call_request_sts = ?
      AND fld_consultation_sts = ?
      AND fld_booking_date = ?
      AND callDisabled IS NULL
  `;

  const params = [status, status, today];

  if (crm_id) {
    sql += ` AND fld_addedby = ?`;
    params.push(crm_id);
  }

  db.query(sql, params, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};


const getConsultantSettingData = (consultantid = "", callback) => {
  

    let sql = `SELECT * FROM tbl_consultant_setting`;
    const params = [];

    if (consultantid && Number(consultantid) > 0) {
      sql += ` WHERE fld_consultantid = ?`;
      params.push(consultantid);
    }

    sql += ` ORDER BY id DESC LIMIT 1`;

    db.query(sql, params, (error, results) => {
      
      if (error) return callback(error, null);
      return callback(null, results[0] || null);
    });
  
};

const getConsultantPresaleSettingData = (consultantid = "", callback) => {
  

    let sql = `SELECT * FROM tbl_consultant_presaleslots`;
    const params = [];

    if (consultantid && Number(consultantid) > 0) {
      sql += ` WHERE user_id = ?`;
      params.push(consultantid);
    }

    sql += ` ORDER BY id DESC LIMIT 1`;

    db.query(sql, params, (error, results) => {
      
      if (error) return callback(error, null);
      return callback(null, results[0] || null);
    });
  
};

const updateConsultantSettings = (consultantid, data, callback) => {
  

    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ');

    const values = Object.values(data);
    values.push(consultantid); // For WHERE clause

    const sql = `
      UPDATE tbl_consultant_setting
      SET ${fields}
      WHERE fld_consultantid = ?
    `;

    db.query(sql, values, (error, result) => {
     
      if (error) return callback(error);
      return callback(null, result);
    });
  
};

const updatePresaleBookingSlots = (data, callback) => {
  try {
    const { user_id } = data;
    if (!user_id) {
      return callback(new Error("user_id is required"));
    }

    // First delete existing slots for the user
    const deleteQuery = `DELETE FROM tbl_consultant_presaleslots WHERE user_id = ?`;

    db.query(deleteQuery, [user_id], (deleteErr) => {
      if (deleteErr) {
        console.error("Error deleting existing slots:", deleteErr);
        return callback(deleteErr);
      }

      // Then insert the new slots
      const insertQuery = `
        INSERT INTO tbl_consultant_presaleslots 
        (user_id, sun_time, mon_time, tue_time, wed_time, thu_time, fri_time, sat_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        user_id,
        data.sun_time ?? null,
        data.mon_time ?? null,
        data.tue_time ?? null,
        data.wed_time ?? null,
        data.thu_time ?? null,
        data.fri_time ?? null,
        data.sat_time ?? null,
      ];

      db.query(insertQuery, values, (insertErr, result) => {
        if (insertErr) {
          console.error("Error inserting slots:", insertErr);
          return callback(insertErr);
        }
        return callback(null, result);
      });
    });
  } catch (err) {
    console.error("Model exception (updatePresaleBookingSlots):", err);
    return callback(err);
  }
};


module.exports = {
  getAllActiveTeams,
  getTotalData,
  getParticularStatusCallsOfCrm,
  getConsultantSettingData,
  getConsultantPresaleSettingData,
  updateConsultantSettings,
  updatePresaleBookingSlots
}