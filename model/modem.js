
var mongoose = require('mongoose');

module.exports = mongoose.model('modem',{
    imei : String,
    phoneNo :String,
    isAttached : Boolean,
    response : String
});
