b3e.project.FolderManager = function(editor, project) {
  "use strict";

  /**
   * Register a folder to the folder list. You can provide:
   * 
   * - a `b3.BaseFolder` instance.
   * - a `b3e.Folder` instance.
   * - a generic object containing the folder prototype.
   */
  this.add = function(folder, isDefault) {
    if (folder.prototype) folder = folder.prototype;

    if (project._folders[folder.name]) {
      return false;
    }

    if (!(folder instanceof b3e.Folder)) {
      var n         = new b3e.Folder(isDefault);
      n.name        = folder.name;
      n.category    = folder.category;
      n.title       = folder.title;
      n.description = folder.description;
      n.parent      = folder.parent;

      folder = n;
    }

    project._folders[folder.name] = folder;
    if (isDefault !== true) editor.trigger('folderadded', folder);

    var _old = [this, this.remove, [folder]];
    var _new = [this, this.add, [folder]];
    project.history._add(new b3e.Command(_old, _new));

    return folder;
  };

  /**
   * 
   */
  this.get = function(folder) {
    if (typeof folder !== 'string') return folder;
    return project._folders[folder];
  };

  /**
   * 
   */
  this.changeParent = function(folder) {
    var tempFolder = (typeof folder !== 'string') ? folder : project._folders[folder];
    // if (tempFolder != null) {
    //   tempFolder.parent
    // }
    return ;
  };

  /**
   * 
   */
  this.update = function(folder, template) {
    folder = this.get(folder);
    var oldName = folder.name;

    delete project._folders[folder.name];

    if (folder.name !== template.name && this.get(template.name)) return false;


    var _oldValues = {
      name        : folder.name,
      title       : folder.title,
      description : folder.description,
      category    : folder.category,
      parent      : folder.parent,
    };

    if (typeof template.name !== 'undefined') {
      folder.name = template.name;
    }
    if (typeof template.title !== 'undefined') {
      folder.title = template.title;
    }
    if (typeof template.category !== 'undefined') {
      folder.category = template.category;
    }
    if (typeof template.description !== 'undefined') {
      folder.description = template.description;
    }
    if (typeof template.parent !== 'undefined') {
      folder.parent = template.parent;
    }

    var _newValues = {
      name        : folder.name,
      title       : folder.title,
      description : folder.description,
      category    : folder.category,
      parent      : folder.parent,
    };

    project.history._beginBatch();

    project.trees.each(function(tree) {
      var blocks = tree.blocks.getAll();
      for (var i=blocks.length-1; i>=0; i--) {
        if (blocks[i].name === oldName) {
          tree.blocks.update(blocks[i]);
        }
      }
    });

    project._folders[folder.name] = folder;

    var _old = [this, this.update, [folder, _oldValues]];
    var _new = [this, this.update, [folder, _newValues]];
    project.history._add(new b3e.Command(_old, _new));
    project.history._endBatch();

    editor.trigger('folderchanged', folder);
  };

  /**
   * 
   */
  this.remove = function(folder) {
    project.history._beginBatch();

    var name = folder.name||folder;
    delete project._folders[name];

    project.trees.each(function(tree) {
      var blocks = tree.blocks.getAll();
      for (var i=blocks.length-1; i>=0; i--) {
        if (blocks[i].name === name) {
          tree.blocks.remove(blocks[i]);
        }
      }
    });

    var _old = [this, this.add, [folder]];
    var _new = [this, this.remove, [folder]];
    project.history._add(new b3e.Command(_old, _new));

    project.history._endBatch();

    editor.trigger('folderremoved', folder);
  };

  /**
   * Iterates over folder list.
   */
  this.each = function(callback, thisarg) {
    Object.keys(project._folders).forEach(function(key) {
      callback.call(thisarg, project._folders[key]);
    });
  };

  this._applySettings = function(settings) {};
};