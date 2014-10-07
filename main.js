/** Vagrant control */
define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus          = brackets.getModule("command/Menus");
    
	var ProjectManager = brackets.getModule("project/ProjectManager");
    
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain");
	
	var StatusBar = brackets.getModule("widgets/StatusBar");
    var Dialog = brackets.getModule("widgets/Dialogs");
    var DefaultDialogs = brackets.getModule("widgets/DefaultDialogs");
    
    var vagrantCtrlDomain = new NodeDomain("vagrantCtrl", ExtensionUtils.getModulePath(module, "node/vagrantCtrlDomain"));
  
	var topMenu = Menus.addMenu('Vagrant', 'vagrant-menu', Menus.BEFORE, Menus.AppMenuBar.HELP_MENU);
        
    var VagrantCurrentStatus;
    var idHandleInterval;
    var lastVagrantPath;
  
    function handleExe(command){
      //console.log('vagrant '+command);
      StatusBar.showBusyIndicator(false);
      StatusBar.updateIndicator("vagrantCrtlUp", false);
      StatusBar.updateIndicator("vagrantCrtlHalt", false);
      
      var result = vagrantCtrlDomain.exec("nodeVagrantExec", ProjectManager.getProjectRoot().fullPath, command).then(
			function (data){
				//console.log("DATA: " + data);
				StatusBar.hideBusyIndicator();
				checkStatus(function(status){
                  setStatus(status);
                });
                Dialog.showModalDialog(
                    DefaultDialogs.DIALOG_ID_EXT_DELETED,
                    "Vagrant "+command,
                    data.replace(/\n/g, "<br />")
                );
                              
			},
			function (error){
				alert("ERROR: " + error);
				console.log("ERROR: " + error);
			}
		);
      
    }

    function handleVagrantUp() {
        handleExe('up');
    }

	function handleVagrantSuspend() {
		 handleExe('suspend');
    }


    function handleVagrantHalt() {
		 handleExe('halt');
    }
  
 	function checkStatus(cb){
		/*
			running
			saved
			poweroff
			not created
		*/
		
        console.log("checkStatus "+ ProjectManager.getProjectRoot().fullPath);
			
		var result = vagrantCtrlDomain.exec("nodeVagrantExec", ProjectManager.getProjectRoot().fullPath, 'status').then(
			function (data){
			
				if(data.indexOf("ERR_VAGRANT_RESP") > 0){
					cb("NotAvailable");
				}else if(data.indexOf("saved") > 0){
					cb("Saved");
				}else if(data.indexOf("poweroff") > 0){
					cb("Poweroff");
				}else if(data.indexOf("not created") > 0){
					cb("NotAvailable");
                }else if(data.indexOf("running") > 0){
					cb("Running");  
				}
				//console.log("NODE RESPONSE: " + data);
			},
			function (error){
				console.log("ERROR: " + error);
			}
		);
				
	}
  
  
    function updateStatus(){
      checkStatus(function(status){
        setStatus(status);
      });
    }

	function setStatus(status){
        //console.log("SET STATUS: "+ status);
        StatusBar.updateIndicator("vagrantCrtl"+VagrantCurrentStatus, false);
        VagrantCurrentStatus = status;
		StatusBar.updateIndicator("vagrantCrtl"+status, true);
	}
	
    var path = ExtensionUtils.getModulePath(module);
  
	StatusBar.addIndicator("vagrantCrtlRunning", $('<div>Vagrant <img src="'+path+'running.png" width="16" style="padding-bottom: 2px;padding-left: 2px;" /></div>'), false, "", "Status: running");
	StatusBar.addIndicator("vagrantCrtlSaved", $('<div>Vagrant <img src="'+path+'saved.png" width="16" style="padding-bottom: 2px;padding-left: 2px;" /></div>'), false, "", "Status: saved");
	StatusBar.addIndicator("vagrantCrtlPoweroff", $('<div>Vagrant <img src="'+path+'poweroff.png" width="16" style="padding-bottom: 2px;padding-left: 2px;" /></div>'), false, "", "Status: poweroff"); 
	
    StatusBar.addIndicator("vagrantCrtlNotAvailable", $("<div>Vagrant  ---</div>"), false, "", "Status: not available");
    
    CommandManager.register("Vagrant up", 'vagrantcontrol.up', handleVagrantUp);
	CommandManager.register("Vagrant suspend", 'vagrantcontrol.suspend', handleVagrantSuspend);
    CommandManager.register("Vagrant halt", 'vagrantcontrol.halt', handleVagrantHalt);

    var vup = topMenu.addMenuItem('vagrantcontrol.up');
    topMenu.addMenuItem('vagrantcontrol.suspend');
    topMenu.addMenuItem('vagrantcontrol.halt');
  
      
     $(ProjectManager).on("beforeProjectClose", function(event){
       window.clearInterval(idHandleInterval);
       lastVagrantPath = ProjectManager.getProjectRoot().fullPath;
       
        if(VagrantCurrentStatus == 'Running'){
           Dialog.showModalDialog(
              DefaultDialogs.DIALOG_ID_EXT_DELETED,
              "Vagrant running",
              "VM Still running",
               [
                {
                className: Dialog.DIALOG_BTN_CLASS_NORMAL,
                id: "ignore",
                text: "Ignore"
                },
                {
                className: Dialog.DIALOG_BTN_CLASS_PRIMARY,
                id: "turnoff",
                text: "Vagrant halt"
                }
                ]
          ).getPromise().then(function(btnid){
            if(btnid == 'turnoff'){
              handleVagrantHalt(lastVagrantPath);
            }
          });;
          
        }
        
     });
  
     $(ProjectManager).on("projectOpen", function(){
     
        checkStatus(function(status){
          setStatus(status);
          if(status != 'NotAvailable'){
            idHandleInterval = setInterval(function(){
                checkStatus(function(status){
                  setStatus(status);
                });
            }, 120000);  // Checks every 120 seconds 
          }
        });
     });
  
});

