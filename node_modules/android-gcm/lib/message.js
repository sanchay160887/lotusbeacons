var _ = require('lodash');

function Message(msg) {

    if(!msg)
        msg = {};

    if(!(this instanceof Message))
        return new Message(msg);

    this.data = msg.data || {};
    this.notification = msg.notification || undefined;
    this.registration_ids = msg.registration_ids || [];
    this.collapse_key = msg.collapse_key || undefined;
    this.delay_while_idle = msg.delay_while_idle || undefined;
    this.time_to_live = msg.time_to_live || undefined;
    this.dry_run = msg.dry_run || undefined;
}


Message.prototype.addNew_Data = function(key, val) {
    this.data[key] = val;
};


Message.prototype.addNew_DataObject = function(dataObj) {
    if(_.isObject(dataObj))
        this.data = _.assign(this.data, dataObj);
};


Message.prototype.addNew_RegistrationId = function(newId) {
    if(_.indexOf(this.registration_ids, newId) < 0)
        this.registration_ids.push(newId);
};


Message.prototype.addNew_RegistrationIdArray = function(newIds) {
    if(_.isArray(newIds))
        this.registration_ids = _.union(this.registration_ids, newIds);
};


module.exports = Message;
