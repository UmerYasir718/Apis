const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    title: String,
    post: String,
    description: String,
    email:String
})

module.exports = mongoose.model('Post', UserSchema)