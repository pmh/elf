module.exports = {
  clone: function (init) {
    var obj = Object.create(this);
    if (this.init) this.init.call(obj);
    if (init) init.call(obj, obj);

    return obj;
  },
  
  keywords: ["extended", "init"],

  extend: function () {
    var args = Array.prototype.slice.call(arguments);
    var self = this;

    args.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && self.keywords.indexOf(prop) === -1)
            self[prop] = obj[prop];
      }

      if (obj.extended) obj.extended(self);
    });

    return this;
  },

  slots: function () {
    var slots = [];
    for (var slot in this)
      if (this.hasOwnProperty(slot)) slots.push(slot);

    return slots;
  }
};