const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema({
    text: String,
    createdOn: Date,
    lastModifiedOn: Date,
    isActive: Boolean,
    createdBy:String
});

module.exports = mongoose.model('Note', noteSchema);