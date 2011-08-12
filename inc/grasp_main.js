function GRASPDiagramDescriptior(){}

GRASPDiagramDescriptior.prototype = {

    exportToXML: function(){
        var options = {
            formatOutput: true,
            rootTagName: 'GRASPDiagram',
        };

        return $.json2xml(this.diagram, options);

    }

}

function InventoryDisplay(){}

InventoryDisplay.prototype = {
    items: {},

    render: function(){

        if (this.items){

            for (var i in this.items){
                var list = list || $("<ul/>", {
                    "id": "inventoryContent",
                }).appendTo("#inventory");

                list.append($("<li/>", {
                    "title": this.items[i].description,
                    "mousedown": window.player.inventoryDisplay.on_mousedown
                }).append($("<img/>", {
                    "src": this.items[i].iconURL,
                    "id": i,

                }).draggable({
                    helper: function(){
                        var instance = window.player.libraryManager.createNewDummyComponentInstanceFromType($(this).attr('id'));
                        window.dropMode = "NEW_COMPONENT";
                        window.beingDraggedComponent = instance;
                        instance.addTo(window.player.mainCanvas);
                        instance._skinInstance.addClass("draggedComponent");
                        return instance._skinInstance;
                    },
                    zIndex: 100000,
                    cursorAt: {
                        left: 0,
                        top: 0
                    },
                    stop: function(event, ui){
                        if (window.beingDraggedComponent.isDummy) window.beingDraggedComponent.destruct();
                        delete window.beingDraggedComponent
                        delete window.dropMode;
						window.lastTap = null;
                    },
					
                }).addTouch().after("<p>" + this.items[i].label + "</p>")));

            }

            //	return itemsHTML = "<img id='inventoryVisibilityControl' src='assets/hide_off.png'><ul id='inventoryContent'>" + itemsHTML + "</ul>";
            return true;
        } else{
            return false
        }


    },

    clear: function(){

        },

    on_mousedown: function(e){
        //var id = $(e.currentTarget).attr('id');
        /*		$("body").append($("<img>", {
			"src": window.player.inventoryDisplay.items[id].iconURL,
			"id": "draggedComponent"
		} ).draggable());*/

    }

}


function Clock(availableTime){
    this.availableTime = availableTime;
    this.currentTime = availableTime;
    this.refresh();
}

Clock.prototype = {
    id: guid(),
    stopped: true,
    _availableTime: null,
    currentTime: null,
    displayValue: null,
    displayUnit: null,
    on_over: null,
    intervalId: null,
    startDate: null,
    mainCanvas: null,
    getHTML: function(){
        return "<div id='clock_" + this.id + "' class='clock'><span class='clock_1'>TIME LEFT</span><span class='clock_2 " + this.stage + "'>" + this.displayValue + "</span><span class='clock_3'>" + this.displayUnit + "</span></div>";
    },

    stop: function(){
        clearInterval(this.intervalId);
        this.stopped = true;
        this.startDate = null;
    },

    start: function(){
        if (this.stopped && this.currentTime > 0){
            this.stopped = false;
            this.startDate = new Date();
            this.refresh();
            this.intervalId = setInterval(this.refresh, 1000);
        }

    },

    refresh: function(){
        if (this.stopped !== true){
            this.currentTime = _availableTime - (new Date - this.startDate);
        }

        if (this.currentTime > 0){
            if (this.currentTime <= 60){
                this.displayValue = this.currentTime;
                this.displayUnit = "SEC";
                if (this.currentTime <= 10){
                    this.stage = "alert";
                } else{
                    this.stage = "warning";
                }
            } else{
                this.stage = "normal";
                this.displayValue = Math.round(this.currentTime / 60);
                this.displayUnit = "MIN";
            }
        } else{
            if (this.stopped !== true && jQuery.isFunction(this.on_over)){
                this.on_over.call();
                this.stop();
            }
        }
    },

    set availableTime(value){
        _availableTime = value;
        this.refresh();
    }
}

/**
 *
 * Main class implementing player functions
 *
 * Version 1.0
 * 
 */
GRASPPlayer.STATE_INITIALIZING = "STATE_INITIALIZING";

function GRASPPlayer(initObj){
    $.extend(this, new HoloComponentManager());

    window.holoComponentManager = this;

      if (window.operationManager) {
        window.operationManager.registerAction("ComponentSelection", ComponentSelection);
        window.operationManager.registerAction("ComponentDeselection", ComponentDeselection);
      }

    this.libraryManager = new GRASPLibraryManager();

    trace("GRASPPlayer " + this.version + " created.");
}

GRASPPlayer.prototype = {

    version: "1.0",
    _state: null,
    _diagramDescriptor: null,
    _canvas: null,
    _diagramDescriptorURL: null,
    _mode: "MODE_COMPOSE",
    rootComponent: null,
    inventoryDisplay: null,

    allowSelecting: true,
    selectedComponents: null,

    // UI
    clock: null,

    testBState: 0,
    saveBState: 0,
    undoBState: 0,
    redoBState: 0,
    settingsBState: 0,
    helpBState: 1,
    exitBState: 1,


    showMessage: function(msg){
        trace(msg);
    },

    parseDiagramDescriptor: function(xml){

        var _diagramDescriptor_JSON = $.xmlToJSON(xml);
        this._diagramDescriptor = new GRASPDiagramDescriptior;

        this._diagramDescriptor.libraryLocation = _diagramDescriptor_JSON["@libraryLocation"];
        this._diagramDescriptor.isTimed = _diagramDescriptor_JSON["@isTimed"];
        this._diagramDescriptor.availableTime = _diagramDescriptor_JSON["@availableTime"];
        this._diagramDescriptor.title = _diagramDescriptor_JSON["@title"];
        this._diagramDescriptor.description = _diagramDescriptor_JSON["description"][0]["Text"];
        this._diagramDescriptor.showGrid = _diagramDescriptor_JSON["@showGrid"];
        this._diagramDescriptor.showInventory = _diagramDescriptor_JSON["@showInventory"];

        if (_diagramDescriptor_JSON["inventory"] && _diagramDescriptor_JSON["inventory"][0] && _diagramDescriptor_JSON["inventory"][0]["item"] && _diagramDescriptor_JSON["inventory"][0]["item"].length){
            this._diagramDescriptor.inventory = [];
            for (var i = 0; i < _diagramDescriptor_JSON["inventory"][0]["item"].length; i++){
                this._diagramDescriptor.inventory.push(_diagramDescriptor_JSON["inventory"][0]["item"][i]["@componentType"]);
            }
        }

        return true;
    },

    halt: function(){
        trace("Player halts here. By..e.e.!");
    },

    exportDiagramAsXML: function(){
        if (this._diagramDescriptor){
            return this._diagramDescriptor.exportToXML();
        }
    },

    loadDiagramDescriptorFromURL: function(url){
        this._diagramDescriptorURL = url;
        this.state = GRASPPlayer.STATE_INITIALIZING

        trace("GRASPPlayer initializing with [" + this._diagramDescriptorURL + "]...");

        var _config = new ProcessableXML();

        _config.processor = this.parseDiagramDescriptor;
        _config.postLoading = this.on_configLoaded;
        _config.context = this;
        _config.loadContent(this._diagramDescriptorURL);
    },

    loadDiagramDescriptorFromXMLText: function(xmlText){
        this._diagramDescriptorURL = null;
        this.state = GRASPPlayer.STATE_INITIALIZING

        trace("GRASPPlayer initializing from an XML");

        var _config = new ProcessableXML();

        _config.processor = this.parseDiagramDescriptor;
        _config.postLoading = this.on_configLoaded;
        _config.context = this;
        _config.setContent($.textToXML(xmlText));
    },


    test1: function(){
        trace("--> Running test 1..........................................................................");

        var v1 = this.libraryManager.createNewComponentInstanceFromType("VectorType");
		v1.moveTo(100,100);
		
		var rootChildrenSet = this.rootComponent.getProperty("children");
	   trace(rootChildrenSet.addMemberForValue(v1.id));
    },

    refreshmenu: function(){
        var menuHolder = $("[id='menuHolder']");
        menuHolder.empty();
        menu = $("<ul id='menu'>");
        menuHolder.append(menu);

        if (this._mode == "MODE_COMPOSE"){
            this.testBState = 1;
            this.saveBState = 1;
            this.undoBState = (window.player.operationManager.lastDoneOperationIndex > -1) ? 1: 2;
            this.redoBState = (window.player.operationManager.lastDoneOperationIndex < window.player.operationManager.journal.length - 1) ? 1: 2;
            this.settingsBState = 1;
        }
        if (this.testBState == 1){
            menu.append("<li id='previewButton'><a href='javascript:window.player.on_previewButton_click();' title='Preview'>Preview</a></li>")
        }
        if (this.saveBState == 1){
            menu.append("<li id='saveButton'><a href='javascript:window.player.on_saveButton_click();' title='Save'>Save</a></li>")
        }
        if (this.undoBState == 1){
            menu.append("<li id='undoButton'><a href='javascript:window.player.on_undoButton_click();' title='Undo \""+window.player.operationManager.journal[window.player.operationManager.lastDoneOperationIndex].label+"\"'>Undo</a></li>")
        }
        if (this.undoBState == 2){
            menu.append("<li id='undoButton' class='disabled' title='Undo'>Undo</a></li>")
        }
        if (this.redoBState == 1){
            menu.append("<li id='redoButton'><a href='javascript:window.player.on_redoButton_click();' title='Redo \""+window.player.operationManager.journal[window.player.operationManager.lastDoneOperationIndex+1].label+"\"'>Redo</a></li>")
        }
        if (this.redoBState == 2){
            menu.append("<li id='redoButton' class='disabled' title='Redo'>Redo</a></li>")
        }
        if (this.settingsBState == 1){
            menu.append("<li id='settingsButton'><a href='javascript:window.player.on_settingsButton_click();' title='Settings'>Config</a></li>")
        }
        if (this.helpBState == 1){
            menu.append("<li id='helpButton'><a href='javascript:window.player.on_helpButton_click();' title='Help'>Help</a></li>")
        }
        if (this.exitBState == 1){
            menu.append("<li id='exitButton'><a href='javascript:window.player.on_exitButton_click();' title='Exit'>Exit</a></li>")
        }
        if (this._diagramDescriptor.isTimed == "true"){
            menu.append("<li class='clock'>" + this.clock.getHTML() + "</li>");
        }
    },

    refreshUndoRedo: function(){
        window.player.refreshmenu.call(window.player);



    },

    initClock: function(){
        if (this._diagramDescriptor.isTimed == "true" && isSet(this._diagramDescriptor.availableTime)){
            this.clock = new Clock(this._diagramDescriptor.availableTime);
        }
    },

    refreshTitle: function(){
        $("#title").empty();
        $("#title").append(this._diagramDescriptor.title);
        //$("#title").disableSelection();	
    },

    refreshDescription: function(){
        $("#description").empty();
        if (this._diagramDescriptor.description != undefined){
            $("#description").append(this._diagramDescriptor.description);
        }

        //$("#description").disableSelection();
    },

    toggleInventory: function(visibility){
        if (visibility){

            var inventory = $("#inventory");
            var inventoryContent = $("#inventoryContent");
            var control = $("#inventoryVisibilityControl");

            inventoryContent.show();
            control.hide();

            control.click(function(e){

                window.player.toggleInventory(false);
            });

            inventory.mouseover(function(e){
                //	control.show();
                });

            inventory.mouseout(function(e){
                //	control.hide();			
                });

            control.mouseover(function(e){
                control.attr("src", "assets/hide_on.png");
            });

            control.mouseout(function(e){
                control.attr("src", "assets/hide_off.png");
            });

            window.player._diagramDescriptor.showInventory == "true";

        } else{
            var inventory = $("#inventory");
            var inventoryContent = $("#inventoryContent");
            var control = $("#inventoryVisibilityControl");

            inventory.unbind("mouseover");
            inventory.unbind("mouseout");
            inventoryContent.hide();

            control.click(function(e){
                window.player.toggleInventory(true);
            });

            //control.show();
            control.mouseover(function(e){
                control.attr("src", "assets/show_on.png");
            });

            control.mouseout(function(e){
                control.attr("src", "assets/show_off.png");
            });

            window.player._diagramDescriptor.showInventory == "false";
        }
    },

    refreshInventory: function(){
        if (!this.inventoryDisplay){
            this.inventoryDisplay = new InventoryDisplay;
        } else{
            this.inventoryDisplay.clear();
        }

        switch (this._mode){
        case "MODE_COMPOSE":

            if (this.libraryManager.componentTypes){
                for (var i in this.libraryManager.componentTypes){
                    if (!this.libraryManager.componentTypes[i].internal){
                        this.inventoryDisplay.items[i] = this.libraryManager.componentTypes[i];
                    }
                }
            }

            break;

        case "MODE_PLAYBACK":

            break;
        }

        var hasInventory = this.inventoryDisplay.render();

        /*		if (inventoryHTML) {
			if (this._diagramDescriptor.showInventory == "true") {
				this.toggleInventory(true);			
			} else {
				this.toggleInventory(false);
			}
		} else {
			this.toggleInventory(false);				
		}
*/
    },

    setupUI: function(){
        this.refreshTitle();
        this.refreshDescription();
        this.refreshInventory();
        this.initClock();
        this.refreshmenu();
        $('#mousePosDisplay').disableSelection();
        $('#mainContent').disableSelection();
        window.player.operationManager.addEventListener("OPERATION_ACCESSED", this.refreshUndoRedo);
    },

    setSelection: function(ids, addToExistingSelection){

        if (addToExistingSelection !== true && window.player.selectedComponents && window.player.selectedComponents.length){
            this.clearSelection();
        }
        
        for (var i in ids) {

            var id = ids[i];
            var c = window.holoComponentManager.getComponentById(id);
            
            if (c && c.getPropertyValue("selectable") != "false" && (!(window.player.selectedComponents && window.player.selectedComponents.length) || window.player.selectedComponents && window.player.selectedComponents.length && window.player.selectedComponents.indexOf(c) == -1)){
    
                c.select();
    
                window.player.selectedComponents = window.player.selectedComponents || [];
                window.player.selectedComponents.push(c);
                
                window.player.selectedComponentIds = window.player.selectedComponentIds || [];
                window.player.selectedComponentIds.push(c.id);
                
            }
         }

        if (window.holoComponentManager.operationManager.beingRecordedOperation){
            window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("ComponentSelection", [window.player.selectedComponentIds.join(",")], addToExistingSelection));
        }

    },

    clearSelection: function(){

        if (window.holoComponentManager.operationManager.beingRecordedOperation){
            window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("ClearSelection", [window.player.selectedComponentIds.join(",")]));
        }

        for (var i in window.player.selectedComponents){
            window.player.selectedComponents[i].deselect();
        }
        window.player.selectedComponents = [];
        window.player.selectedComponentIds = [];
    },

    // event handlers/callbacks
    on_configLoaded: function(loaded, processed){

        if (loaded && processed){

            window.player.libraryManager.addEventListener("LIBRARIES_INITIALIZED", this.on_librariesInitialized);

            var library = new GRASPComponentLibrary();
            library.libraryManager = this.libraryManager;
            library.loadFromURL(this._diagramDescriptor.libraryLocation);

        } else{
            this.halt();
        }

    },

    on_saveButton_click: function(){


        },

    on_undoButton_click: function(){
        window.player.operationManager.undo.call(window.player.operationManager);
    },

    on_redoButton_click: function(){
        window.player.operationManager.redo.call(window.player.operationManager);
    },

    on_settingsButton_click: function(){
        $('#settingsPanel').fadeIn();
    },

    on_helpButton_click: function(){
        switch (this._mode){
        case "MODE_COMPOSE":
            $("[id='helpFrame']").attr('src', 'compose_help.html');
            break;

        case "MODE_PLAYBACK":
            $("[id='helpFrame']").attr('src', 'playback_help.html');
            break;
        }
        $("#helpPanel").fadeIn();
    },

    on_exitButton_click: function(){

        },

    on_settingsPanel_close: function(){
        $("[id='settingsPanel']").hide();
    },

    on_helpPanel_close: function(){
        $("[id='helpPanel']").hide();
    },

    on_librariesInitialized: function(){

        window.player.rootComponent = window.player.libraryManager.createNewRootComponent();

        window.player.rootComponent.addTo(window.player._canvas);

        window.player.setupUI.call(window.player);

        $('#pleaseWaitPanel').fadeOut();

        window.player.test1.call(window.player);
    },

    on_clock_over: function(){

        },

    on_component_mousedown: function(e){
        e.stopPropagation();
        if (window.player.allowSelecting){
            var id = $(e.currentTarget).attr('id');
            window.player.selectedComponentIds = window.player.selectedComponentIds || [];
			if (window.player.selectedComponentIds.indexOf(id) == -1) {
              window.holoComponentManager.operationManager.recordOperation("Change selection");
              window.player.setSelection([id], e.shiftKey );
              window.holoComponentManager.operationManager.finishRecording(true);
            }            
        }
    },

    // getters/setters
    set contentHolder(val){
        if (val){
            this._canvas = $.extend(val, new GRASPCanvas());
        }
    },

    set state(val){

        if (this._state != val){
            this._state = val;

            trace("GRASPPlayer changing state to [" + this._state + "]");
        }
    }
}


/*
 *
 * GRASPCanvas
 *
 */
function GRASPCanvas(){
    trace("GRASPCanvas instance created.");
}

GRASPCanvas.prototype = {

    player: null,

    _render: function(){

        }
}

function ComponentControl(component){
    this.attachToComponent(component);
}

ComponentControl.prototype = {

    x: 0,
    y: 0,
    width: 0,
    height: 0,
    host: null,

    attachToComponent: function(component){
        var offset = component.skinInstance.offset();
        this.x = offset.x;
        this.y = offset.y;
        this.width = component.skinInstance.outerWidth();
        this.height = component.skinInstance.outerHeight();
        this.host = component;
        this.render();
        var target = $(".content", this.host.skinInstance);
        if (target[0]){
            target.addClass("selectedComponent");
        } 
      
	    this.host.skinInstance.addClass("selectedComponent");
	    
		if (jQuery.isFunction(this.host.onSelect)) {
            this.host.onSelect.call(this.host);
		}

      
    },

    detachFromComponent: function(){
        var target = $(".content", this.host.skinInstance);
        if (target[0]){
            target.removeClass("selectedComponent");
        } 
		
		this.host.skinInstance.removeClass("selectedComponent");
		
        if (jQuery.isFunction(this.host.onDeselect)) {
            this.host.onDeselect.call(this.host);
        }
		
    },

    render: function(){
        /*		alert(this.host.skinInstance.css("z-index")-1);
		$("<div/>", {
			  	id: this.host.id+"_control",
				"class": "componentControl",
				width: this.width,
				height: this.height
		}).prependTo(this.host.skinInstance);
*/
    }
}


/**
 *
 * GRASPComponent
 *
 */
function GRASPComponent(id){}

GRASPComponent.prototype = {
    control: null,

    select: function(){
        if (!this.control){
            this.control = new ComponentControl(this);
        }
    },

    deselect: function(){
        if (this.control){
            this.control.detachFromComponent();
            delete this.control;
        }
    }
}


/**
 *
 * GRASPComponentLibrary
 *
 */
function GRASPComponentLibrary(){}

GRASPComponentLibrary.prototype = {

    }

$.extend(GRASPComponentLibrary.prototype, new HoloComponentLibrary());

GRASPComponentLibrary.prototype.createNewComponentInstanceFromType = function(typeId, id){
    trace("------------------------------createNewComponentInstanceFromType> "+id);
    var component = HoloComponentLibrary.prototype.createNewComponentInstanceFromType.call(this, typeId, id);
    $.extend(component, new GRASPComponent());
    return component;
}

GRASPComponentLibrary.prototype.createNewDummyComponentInstanceFromType = function(typeId, id){
    var component = HoloComponentLibrary.prototype.createNewDummyComponentInstanceFromType.call(this, typeId, id);
    $.extend(component, new GRASPComponent());
    return component;
}


/*
 * 
 * GRASPLibraryManager
 * 
 */
function GRASPLibraryManager(){

    }

GRASPLibraryManager.prototype = {
    }


$.extend(GRASPLibraryManager.prototype, new LibraryManager());


GRASPLibraryManager.prototype.createNewComponentInstanceFromType = function(typeId, id){
    var component = LibraryManager.prototype.createNewComponentInstanceFromType.call(this, typeId, id);
    $.extend(component, new GRASPComponent());
    return component;
}

GRASPLibraryManager.prototype.createNewDummyComponentInstanceFromType = function(typeId, id){
    var component = LibraryManager.prototype.createNewDummyComponentInstanceFromType.call(this, typeId, id);
    $.extend(component, new GRASPComponent());
    return component;
}


////// ACTIONS //////////////////////////////////////////////////////////////////////////
/*
 * 
 * ComponentSelection
 * 
 */
function ComponentSelection(){}

ComponentSelection.prototype = {
  
  doIt: function(targetIdsString, addToExistingSelection) {
    window.player.setSelection(targetIdsString.split(","), addToExistingSelection);
    return new Response(true);
  },
  
  undo: function(targetIdsString, addToExistingSelection) {
    var c = window.player.getComponentById(targetIdsString.split(","));
    window.player.clearSelection();
  }
}


/*
 * 
 * ClearSelection
 * 
 */
function ClearSelection(){}

ClearSelection.prototype = {
  
  doIt: function(targetIdsString) {
    window.player.clearSelection();
    return new Response(true);    
  },
  
  undo: function(targetIdsString) {
    window.player.setSelection(targetIdsString.split(","));
  }
}

