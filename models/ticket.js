const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TicketSchema = Schema({
    TicketId: {type: String, required: true, unique: [ true, 'Faculty ID already exist' ]},
    image: {type: String, default: null},
    ticketName: {type: String},
    ticketDescription: {type: String},
    tickeTypes: {type: Object},
}, { timestamps: true });

const ticket = mongoose.model('ticket', TicketSchema)
module.exports = ticket;