const mongoose = require('mongoose');

const UserDataSchema = new mongoose.Schema({
    email:String,
    name:String,
    token:Number
})

module.exports = mongoose.model('User', UserDataSchema)