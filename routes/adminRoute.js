var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController')
const passport = require('passport');


/** All post request *//////////////////////////////////////////////

// register staff route
router.post('/register-staff',  adminController.registerStaff)

// create client from a file
// router.post('/create-client-from-file', adminController.registerClientFromAfile)

// create ticket
router.post('/add-ticket', adminController.addTicket)

// create voucher
router.post('/add-voucher', adminController.addVoucher)

// create ticket
router.put('/edit-ticket', adminController.editTicket)

// upload an image
router.put('/upload-an-image', adminController.addAnImageToEvent)

// get all ticket
router.get('/get-all-ticket', adminController.getAllTicket)

// get all voucher
router.get('/get-all-voucher', adminController.getAllVoucher)

// delete ticket
router.delete('/delete-ticket', adminController.deleteTicket)

// delete voucher
router.delete('/delete-voucher', adminController.deleteVoucher)


module.exports = router;