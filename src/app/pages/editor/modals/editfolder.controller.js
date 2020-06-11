(function() {
  'use strict';

  angular
    .module('app')
    .controller('EditFolderController', EditFolderController);

  EditFolderController.$inject = [
    '$scope',
    '$window',
    '$state',
    '$stateParams',
    'dialogService',
    'notificationService'
  ];

  function EditFolderController($scope,
                              $window,
                              $state,
                              $stateParams,
                              dialogService,
                              notificationService) {
    var vm = this;
    vm.action = 'New';
    vm.folder = null;
    vm.blacklist = null;
    vm.folderList = null;
    vm.original = null;
    vm.save = save;
    vm.remove = remove;

    _active();

    function _active() {
      var p = $window.editor.project.get();

      if ($stateParams.name) {
        var folder = p.folders.get($stateParams.name);
        vm.folder = folder.copy();
        vm.original = folder;
        vm.action = 'Update';
      } else {
        vm.folder = new b3e.Folder();
        vm.folder.category = 'tree';
      }

      var blacklist = [];
      var folderList = [];
      p.folders.each(function(folder) {
        if (folder.name !== vm.folder.name) {
          blacklist.push(folder.name);
          if (vm.original != null &&
            folder.category == vm.folder.category &&
            folder.parent != vm.folder.name) {
            folderList.push(folder);
          }
        }
      });
      vm.blacklist = blacklist.join(',');
      vm.folderList = folderList;
    }

    function save() {
      var p = $window.editor.project.get();

      if (vm.original) {
        p.folders.update(vm.original, vm.folder);

        notificationService
          .success('folder update', 'folder has been update successfully.');
      } else {
        p.folders.add(vm.folder);
        notificationService
          .success('folder created', 'folder has been created successfully.');
      }

      $state.go('editor');
    }

    function remove() {
      dialogService.
        confirm(
          'Remove folder?', 
          'Are you sure you want to remove this folder?\n\nNote: all blocks using this folder will be removed.'
        ).then(function() {
          var p = $window.editor.project.get();
          p.folders.remove(vm.original);
          notificationService.success(
            'folder removed',
            'The folder has been removed from this project.'
          );
          $state.go('editor');
        });
    }
  }

})();