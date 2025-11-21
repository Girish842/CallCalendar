// models/helperModel.js
const db = require("../config/db"); // Update path if needed
const moment = require("moment-timezone");

const checkIfDomainExists = (domain, callback) => {
  const query = "SELECT COUNT(*) AS cnt FROM tbl_domain_pref WHERE domain = ?";
  

    db.query(query, [domain], (error, results) => {
      if (error) return callback(error);
      const exists = results[0]?.cnt > 0;
      callback(null, exists);
    });
  
};

const insertDomainPref = (data, callback) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map(() => "?").join(", ");
  const query = `INSERT INTO tbl_domain_pref (${fields.join(", ")}) VALUES (${placeholders})`;


    db.query(query, values, (error, result) => {
      
      if (error) return callback(error);
      callback(null, result.insertId);
    });
  
};

const checkIfDomainExistsForUpdate = (domain, id, callback) => {
  const query = "SELECT COUNT(*) AS cnt FROM tbl_domain_pref WHERE domain = ? AND id != ?";
  

    db.query(query, [domain, id], (error, results) => {
      
      if (error) return callback(error);
      const exists = results[0]?.cnt > 0;
      callback(null, exists);
    });
  
};

const updateDomainPref = (id, data, callback) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const updates = fields.map(field => `${field} = ?`).join(", ");
  const query = `UPDATE tbl_domain_pref SET ${updates} WHERE id = ?`;


    db.query(query, [...values, id], (error, result) => {
      
      if (error) return callback(error);
      callback(null, result.affectedRows);
    });
  
};

const deleteDomainById = (id, callback) => {
 
    const query = "DELETE FROM tbl_domain_pref WHERE id = ?";
    db.query(query, [id], (error, result) => {
      

      if (error) {
        console.error("Query error:", error);
        return callback(error, null);
      }

      callback(null, result);
    });
  
};

const updateDomainStatus = (domainId, status, callback) => {
  

    const sql = `UPDATE tbl_domain_pref SET status = ? WHERE id = ?`;

    db.query(sql, [status, domainId], (queryErr, result) => {
      
      if (queryErr) return callback(queryErr);
      return callback(null, result);
    });
  
};

const getDomainbyId = (domainId, callback) => {
  if (!domainId) return callback(new Error("Domain ID is required"));

  const query = 'SELECT * FROM tbl_domain_pref WHERE id = ?';



    db.query(query, [domainId], (error, results) => {
      
      if (error) return callback(error);

      if (results.length > 0) {
        callback(null, results[0]);
      } else {
        callback(null, null); 
      }
    });
  
};

module.exports = {
    checkIfDomainExists,
 insertDomainPref,
 checkIfDomainExistsForUpdate,
 updateDomainPref,
 deleteDomainById,
 updateDomainStatus,
 getDomainbyId,
};
