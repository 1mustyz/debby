const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VoucherSchema = Schema({
    CustomerName: {type: String},
    ticketType: {type: String},
    numberOfTicket: {type: String},
    ticketPrice: {type: String},
}, { timestamps: true });

const voucher = mongoose.model('voucher', VoucherSchema)
module.exports = voucher;