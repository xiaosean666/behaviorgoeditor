(function() {
  'use strict';

  angular
    .module('app')
    .controller('NodespanelController', NodespanelController);

  NodespanelController.$inject = [
    '$scope',
    '$window',
    'dialogService',
    'notificationService'
  ];

  function NodespanelController($scope, 
                                $window,
                                dialogService,
                                notificationService) {
    
    // HEAD //
    var vm = this;
    vm.nodes = null;
    vm.newTree = newTree;
    vm.newFolder = newFolder;
    vm.select  = select;
    vm.remove  = remove;
    vm.search  = search;
    vm.filter  = "";

    vm.treeOptions = {
       nodeChildren: "children",
       dirSelectable: false,
       allowDeselect: false,
       isSelectable: function(node) {
         return node.type == 'tree';
       },
       injectClasses: {
         "li": "c-li",
         "label": "c-label",
         "labelSelected": "c-labelSelected"
       },
    };
    vm.selectedNode = null;
    vm.expandedNodes = [];
    vm.parentPath = [];
    vm.parentNode = [];
    vm.tempExpand = [];

    _create();
    _activate();
    vm.expandedNodes = vm.tempExpand;
    $scope.$on('$destroy', _destroy);

    // BODY //
    function _activate() {
      vm.trees = [];
      vm.nodes = {
        composite : [],
        decorator : [],
        action    : [],
        condition : [],
      };

      vm.folders = {
        tree      : [],
        composite : [],
        decorator : [],
        action    : [],
        condition : [],
      };

      var p = $window.editor.project.get();
      var selected = p.trees.getSelected();
      p.trees.each(function(tree) {
        var root = tree.blocks.getRoot();
        if (_serachFilter(root)) return;
        var index = vm.trees.push({
          name       : tree._id,
          title     : root.title || 'A behavior tree',
          active   : tree===selected,
          category : 'tree',
          parent   : root._parent,
          type     : 'tree',
          index    : vm.trees.length,
        });
        if (vm.trees[index - 1].active) {
          vm.selectedNode = vm.trees[index - 1];
        }
      });
      vm.trees.sort(function(a, b)
      {
        return a.name.toLowerCase().charCodeAt(0) - b.name.toLowerCase().charCodeAt(0);
      });

      p.nodes.each(function(node) {
        if (node.category === 'tree' || _serachFilter(node)) return;

        var list = vm.nodes[node.category];
        if (!list) return;
        list.push({
          name: node.name,
          title: _getTitle(node),
          category : node.category,
          parent   : node.parent,
          type     : 'node',
          index    : list.length,
          isDefault: node.isDefault,
        });
      });

      p.folders.each(function(folder) {
        if (_serachFilter(folder)) return;

        var list = vm.folders[folder.category];
        if (!list) return;
        list.push({
          name: folder.name,
          title: _getTitle(folder),
          category : folder.category,
          parent   : folder.parent,
          type     : 'folder',
          index: list.length,
          isDefault: folder.isDefault,
        });
      });

      var tempDataTree = {
        tree      : [],
        composite : [],
        decorator : [],
        action    : [],
        condition : [],
      };

      vm.dataForTree = {
        tree      : [],
        composite : [],
        decorator : [],
        action    : [],
        condition : [],
      };

      for(var key in vm.folders){
        var list = tempDataTree[key];
        if (key == 'tree') {
          list = list.concat(vm.trees, vm.folders[key]);
        } else {
          list = list.concat(vm.nodes[key], vm.folders[key]);
        }
        tempDataTree[key] = list;
      }

      for(var dataKey in tempDataTree){
        var dataValue = tempDataTree[dataKey];
        dataValue.sort(_sortDataValue);
        var dataList = vm.dataForTree[dataKey];
        var expandedNodes = [];
        for(var i = 0; i < dataValue.length; i++) {
          var value = dataValue[i];
          if (_checkIsNullOrUndefined(value.parent)) {
            dataList.push(value);
          } else {
            vm.tempSearchData = null;
            var nodeData = _serachTarget(dataList, value.parent);
            if (nodeData != null) {
              nodeData.children = nodeData.children || [];
              nodeData.children.push(value);
            }else{
              dataList.push(value);
            }
          }
        }
        for(var j = 0; j < dataList.length; j++) {
          vm.parentPath = [];
          vm.parentNode = [];
          _setParentPath(dataList[j]);
        }
      }
      tempDataTree = [];
    }

    function _event(e) {
      setTimeout(function() {$scope.$apply(function() { _activate(); });}, 0);
    }

    function _create() {
      $window.editor.on('treenodechanged', _event);
      $window.editor.on('nodechanged', _event);
      $window.editor.on('noderemoved', _event);
      $window.editor.on('nodeadded', _event);
      $window.editor.on('treeadded', _event);
      // $window.editor.on('blockchanged', _event);
      // $window.editor.on('treeselected', _event);
      $window.editor.on('treeremoved', _event);
      $window.editor.on('treeimported', _event);

      $window.editor.on('folderremoved', _event);
      $window.editor.on('folderadded', _event);
      $window.editor.on('folderchanged', _event);
    }

    function _destroy() {
      $window.editor.off('treenodechanged', _event);
      $window.editor.off('nodechanged', _event);
      $window.editor.off('noderemoved', _event);
      $window.editor.off('nodeadded', _event);
      $window.editor.off('treeadded', _event);
      // $window.editor.off('blockchanged', _event);
      // $window.editor.off('treeselected', _event);
      $window.editor.off('treeremoved', _event);
      $window.editor.off('treeimported', _event);

      $window.editor.off('folderremoved', _event);
      $window.editor.off('folderadded', _event);
      $window.editor.off('folderchanged', _event);
    }

    function _getTitle(node) {
      var title = node.title || node.name;
      title = title.replace(/(<\w+>)/g, function(match, key) { return '@'; });
      return title;
    }

    function newTree() {
      var p = $window.editor.project.get();
      p.trees.add();
    }

    function newFolder(category) {
      var p = $window.editor.project.get();
      p.folders.add(category);
    }

    function select(id) {
      var p = $window.editor.project.get();
      p.trees.select(id);
    }

    function remove(id) {
      dialogService.
        confirm(
          'Remove tree?', 
          'Are you sure you want to remove this tree?\n\nNote: all blocks using this tree will be removed.'
        ).then(function() {
          var p = $window.editor.project.get();
          p.trees.remove(id);
          notificationService.success(
            'Tree removed',
            'The tree has been removed from this project.'
          );
        });
    }

    function search(){
      _activate();
    }

    function _serachFilter(node){
      if (vm.filter !== null || vm.filter !== undefined ||
        vm.filter.replace(/(^s*)|(s*$)/g, "").length ==0)
      {
        var reg = new RegExp(vm.filter, "i");
        return _getTitle(node).search(reg) == -1;
      }
      return true;
    }

    function _checkIsNullOrUndefined(a) {
      return a == '' || (!a && typeof(a)!='undefined' && a!=0) || typeof(a) === 'undefined';
    }

    function _serachTarget(serachData, parent) {
      for(var i = 0,len=serachData.length; i < len; i++) {
        var serachDataValue = serachData[i];

        if (serachDataValue.name == parent) {
          vm.tempSearchData = serachDataValue;
          break;
        } else if (serachDataValue.type == 'folder' &&
         !_checkIsNullOrUndefined(serachDataValue.children)){
          vm.tempSearchData = null;
          vm.tempSearchData = _serachTarget(serachDataValue.children, parent);
          if (vm.tempSearchData != null) {
            break;
          }
        }
      }
      return vm.tempSearchData;
    }

    function _sortDataValue(a, b) {
      if (a.isDefault == true && b.isDefault == true) {
        return a.index - b.index;
      }else if (a.isDefault) {
        return -1;
      }else if (b.isDefault) {
        return 1;
      }else{
        if (a.type == 'folder' && b.type == 'folder') {
          if (_checkIsNullOrUndefined(a.parent) && _checkIsNullOrUndefined(b.parent)) {
            // return a.index - b.index;
          }else if (_checkIsNullOrUndefined(a.parent)) {
            return -1;
          }else if (_checkIsNullOrUndefined(b.parent)) {
            return 1;
          } else {
            if (b.parent == a.name) {
              return -1;
            } else if (a.parent == b.name) {
              return 1;
            }
            // return a.index - b.index;
          }
        }else if (a.type == 'folder') {
          return -1;
        }else if (b.type == 'folder') {
          return 1;
        }
      }
      return a.title.localeCompare(b.title,'zh-CN');
    }

    function _setParentPath(data) {
      if (data.children != null) {
        vm.parentPath.push(data.name);
        vm.parentNode.push(data);
        if (vm.tempExpand.length == 0 && vm.selectedNode.parent == data.name) {
            vm.parentNode.forEach(function(value) {
              vm.tempExpand.push(value);
            });
        }
        data.children.forEach(function(value) {
          value.parentPath = vm.parentPath.join(',');
          _setParentPath(value);
        });
      }
    }
  }
})();