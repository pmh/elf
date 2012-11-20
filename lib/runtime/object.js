module.exports = {
  clone: function (init) {
    var obj = Object.create(this, { 
      parent   : {value: this,          enumerable: false}, 
      keywords : {value: this.keywords, enumerable: false} });

    if (this.init) this.init.call(obj);
    if (init) {
      if (typeof init === "function")
        init.call(obj, obj);
      else
        for (var slot in init) if (init.hasOwnProperty(slot)) obj[slot] = init[slot];
    }

    if (this.hasOwnProperty("cloned")) this.cloned(obj);

    return obj;
  },
  
  keywords: ["cloned", "extended", "init", "keywords"],

  extend: function () {
    var args = Array.prototype.slice.call(arguments);
    var self = this;

    args.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && self.keywords && self.keywords.indexOf(prop) === -1)
            self[prop] = obj[prop];
      }

      if (obj.extended) obj.extended(self);
    });

    return this;
  },

  wrap: function (name, fn) {
    this[name] = fn.call(this, this[name]);
  },

  slots: function () {
    var slots = [];
    for (var slot in this)
      if (this.hasOwnProperty(slot)) slots.push(slot);

    return slots;
  }
};