// routes/helperRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/getAllActiveTeams', dashboardController.getAllActiveTeams);
router.post('/getcall_statistics', dashboardController.getCallStatistics);
router.post('/getparticularstatuscalls', dashboardController.getParticularStatusCallsOfCrm);
router.post('/getconsultantsettings', dashboardController.getConsultantSettingData);
router.post('/saveconsultantsettings', dashboardController.saveConsultantSettings);

router.post('/getconsultantpresalesettings', dashboardController.getConsultantPresaleSettings);
router.post('/saveconsultantpresalesettings', dashboardController.updatePresaleBookingSlots);

router.post('/updateBlockSlots', dashboardController.updateBlockSlots);

module.exports = router