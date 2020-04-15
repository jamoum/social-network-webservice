/**
 * Notification Model
 */

const mongoose = require('mongoose')

const notification = {
    'message':{
        type: String,
        required: true
    },
    'messageType': {
        type: String,
        required: true
    },

    'createdDate':{
        type: Date,
        default: Date.now
    },

    'topic':{
        type: String,
        required: true
    }
}

const notificationSchema = new mongoose.Schema(notification);
const notificationModel = mongoose.model('notification',notificationSchema);

const notificationDomain = {
    'notificationSchema': notificationSchema,
    'notificationModel': notificationModel
}

module.exports = notificationDomain;