/** @module b3e */
(function() {
  'use strict';

  /**
   * A node specification.
   *
   * @class Folder
   * @param {Boolean} isDefault Whether the node is provided by default or not.
   * @constructor
   */
  b3e.Folder = function(isDefault) {
    this.spec = null;
    this.name = b3.createUUID();
    this.title = null;
    this.category = null;
    this.description = null;
    this.parent = null;
    this.isDefault = !!isDefault;

    /**
     * Copy this node.
     *
     * @method copy
     * @returns {b3e.Folder} A copy of this node
     */
    this.copy = function() {
      var n         = new b3e.Folder(this.isDefault);
      n.spec        = this.spec;
      n.name        = this.name;
      n.title       = this.title;
      n.category    = this.category;
      n.parent      = this.parent;
      
      return n;
    };
  };
})();