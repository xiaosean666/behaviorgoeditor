(function() {
  'use strict';

  angular
    .module('app')
    .directive('b3DropNode', dropNode);

  dropNode.$inject = [
    '$window'
  ];

  function dropNode($window) {
    var directive = {
      restrict    : 'A',
      link        : link,
    };
    return directive;

    function link(scope, element, attrs) {
      element.bind('dragover', function(e) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        return false;
      });
      element.bind('drop', function(e) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        if (e.stopPropagation) {
          e.stopPropagation();
        }

        var name = e.dataTransfer.getData('name');
        var type = e.dataTransfer.getData('type');
        var category = e.dataTransfer.getData('category');
        var isDefault = e.dataTransfer.getData('default');
        var p = $window.editor.project.get();
        if (attrs.name != name && attrs.category == category) {
          if (attrs.type == 'folder' && isDefault != 'true') {
            var block = {};
            if (type == 'tree') {
                var t = p.trees.get(name);
                var root = t.blocks.getRoot();
                block = {
                  title       : root.title,
                  description : root.description,
                  parent      : attrs.name || null,
                };
                t.blocks.update(root, block);
            } else if (type == 'node') {
              var node = p.nodes.get(name);
              block = node.copy();
              block.parent = attrs.name || null;
              p.nodes.update(node, block);
            } else if (type == 'folder') {
              var sourcePath = e.dataTransfer.getData('path');
              if (attrs.name != null && sourcePath.indexOf(attrs.name) != -1) return false;
              var folder = p.folders.get(name);
              block = folder.copy();
              block.parent = attrs.name || null;
              p.folders.update(folder, block);
            }
          }
        } else if (attrs.name == null){
            if (type != 'folder') {
              var tree = p.trees.getSelected();
              var point = tree.view.getLocalPoint(e.clientX, e.clientY);
              tree.blocks.add(name, point.x, point.y);

              $window.editor._game.canvas.focus();  
            }
        }
      });
    }
  }

})();
