/*
 * LibraryManager
 * 
 */
function LibraryManager(){
    $.extend(this, new EventDispatcher());
}

LibraryManager.prototype = {
    _libraries: null,
    componentTypes: null,
    rootComponentType: null,

    registerLibrary: function(library){
        this._libraries = this._libraries || {};
        this._libraries[library.id] = library;

        this.componentTypes = this.componentTypes || {};
        for (var i in library.componentTypes){
            this.componentTypes[i] = library.componentTypes[i];
        }

        if (library.rootComponentType) this.rootComponentType = library.rootComponentType

        //this.dispatchEvent("LIBRARY_REGISTERED", this._value);
    },

    unregisterLibrary: function(library){
        this.componentTypes = this.componentTypes || {};
        for (var i in library.componentTypes){
            delete this.componentTypes[i];
        }

        delete this._libraries[library.id];
    },

    createNewComponentInstanceFromType: function(typeId, id){

        if (this.componentTypes[typeId]){
            var cT = this.componentTypes[typeId];

            return cT.getInstance(id);
        }

    },


    createNewDummyComponentInstanceFromType: function(typeId, id){

        if (this.componentTypes[typeId]){
            var cT = this.componentTypes[typeId];

            return cT.getDummyInstance(id);
        }

    },

    createNewRootComponent: function(){
        return this.createNewComponentInstanceFromType(this.rootComponentType);
    },

    // event Handlers
    on_library_initialized: function(library){
        this.registerLibrary(library);

        if (this._libraries){
            var allLibrariesInitialized = true;
            for (var i in this._libraries){
                if (this._libraries[i].initialized === false) allLibrariesInitialized = false;
            }

            if (allLibrariesInitialized){
                this.dispatchEvent("LIBRARIES_INITIALIZED");
            }
        }
    }
}

/*
 * HoloComponentManager
 * 
 */
function HoloComponentManager(){

    //loading core css
    getCSS("css/holo_core.css");

    window.holoComponentManager = this;

    this.operationManager = new OperationManager();

    this.libraryManager = new LibraryManager();

    this.propertyManager = new HoloPropertyManager();


    // registering actions this class implements
    this.operationManager.registerAction("ComponentCreation", ComponentCreation);
    this.operationManager.registerAction("ComponentDeletion", ComponentDeletion);

    trace("holoComponentManager created");
}

HoloComponentManager.prototype = {
    _components: null,
    _maxCountByType: [],
    operationManager: null,
    libraryManager: null,

    registerComponent: function(component){
        this._components = this._components || {};
        this._components[component.id] = component;
        if (component.type && !component.isDummy){
            if (isNaN(this._maxCountByType[component.type.id])){
                this._maxCountByType[component.type.id] = 0;
            }
            this._maxCountByType[component.type.id]++;
        }

        if (this.operationManager.beingRecordedOperation){
            this.operationManager.beingRecordedOperation.addAction(new ActionFootprint("ComponentCreation", [component.id, component.type.id]));
        }
    },

    unregisterComponent: function(component){

        if (this._components && this._components[component.id]){
            delete this._components[component.id];

            if (component.type && !component.isDummy && this.operationManager.beingRecordedOperation){
                this.operationManager.beingRecordedOperation.addAction(new ActionFootprint("ComponentDeletion", [component.id, component.type.id]));
            }

            if (!component.isDummy) {
                this._maxCountByType[component.type.id]--;
            }

        }
    },


    getComponentById: function(id){
        if (this._components && this._components[id]){
            return this._components[id];
        } else{
            return null;
        }
    },

    getComponentMaxCountByType: function(typeId){
        return this._maxCountByType[typeId];
    },

    // Event handlers
}

/*
 * 
 * HoloComponentLibrary
 *
 */
function HoloComponentLibrary(){
    // it's a singleton
    //window.holoComponentManager.library = this;
    }

HoloComponentLibrary.prototype = {
    id: null,
    version: null,
    description: null,
    baseURL: null,
    cssURL: null,
    jsURL: null,
    rootComponentType: null,
    dictionary: null,

    // associative array for component types
    componentTypes: null,
    // associative arry of quantities
    quantities: null,

    loaded: false,
    initialized: false,

    // parent object managing the library
    libraryManager: null,

    initFromJSONObj: function(jsonObj){
        this.loaded = false;
        this.initialized = false;
        this.id = jsonObj["@id"];
        this.version = jsonObj["@version"];
        this.cssURL = jsonObj["@cssURL"];
        this.jsURL = jsonObj["@jsURL"];
        this.rootComponentType = jsonObj["@rootComponentType"];

        this.description = jsonObj.description[0];

        if (jsonObj["dictionary"] && jsonObj["dictionary"].length){
            this.dictionary = new Dictionary();
            this.dictionary.initFromJSONObj(jsonObj["dictionary"][0]);
        }

        if (this.cssURL){
            getCSS(this.baseURL + "/" + this.cssURL);
        }

        if (this.jsURL){
            jQuery.getScript(this.baseURL + "/" + this.jsURL);
        }

        this.quantities = {};

        for (var i = 0; i < jsonObj.quantities[0].quantity.length; i++){
            var quantity = new Quantity();
            quantity.initFromJSONObj(jsonObj.quantities[0].quantity[i]);
            this.quantities[quantity.id] = quantity;
        }

        this.componentTypes = {};

        for (i = 0; i < jsonObj.componentTypes[0].componentType.length; i++){
            var hct = new HoloComponentType();
            hct.parentLibrary = this;
            hct.initFromJSONObj(jsonObj.componentTypes[0].componentType[i]);
            this.componentTypes[hct.id] = hct;
        }

        this.loaded = true;
        this.on_componentInitialized();
    },

    initFromXML: function(xml){
        this.initFromJSONObj($.xmlToJSON(xml));
        return true;
    },

    loadFromURL: function(url){
        this.baseURL = url;

        trace("HoloComponentLibrary initializing with [" + this._deliveryDescriptorURL + "]...");

        var _config = new ProcessableXML();

        _config.processor = this.initFromXML;
        _config.context = this;
        _config.loadContent(this.baseURL + "/descriptor.xml");
    },

    createNewComponentInstanceFromType: function(typeId, id){

        if (this.componentTypes[typeId]){
            var cT = this.componentTypes[typeId];

            return cT.getInstance(id);
        }

    },


    createNewDummyComponentInstanceFromType: function(typeId){

        if (this.componentTypes[typeId]){
            var cT = this.componentTypes[typeId];

            return cT.getDummyInstance(id);
        }

    },


    // Event handlers

    on_componentInitialized: function(){
        if (this.loaded){
            var allCTsInitialized = true;
            for (var key in this.componentTypes){
                if (this.componentTypes.hasOwnProperty(key)){
                    if (!this.componentTypes[key].initialized){
                        allCTsInitialized = false;
                    }
                }
            }

            if (allCTsInitialized){
                this.initialized = true;
                if (this.libraryManager && jQuery.isFunction(this.libraryManager.on_library_initialized)){
                    this.libraryManager.on_library_initialized.call(this.libraryManager, this);
                }
                trace("HoloComponentLibrary initialized.");
            }
        }
    }
}

/*
 * PropertyType
 * 
 */
function PropertyType(){}

PropertyType.prototype = {
    id: null,
    label: null,
    controlType: null,
    description: null,
    content: null,
    parentComponentType: null,
    parentPropertyType: null,
    customConstrainResolver: null,
    defaultValue: null,
    constraints: null,
    dictionary: null,
    group: null,

    initFromJSONObj: function(jsonObj){
        this.id = jsonObj["@id"];
        this.label = jsonObj["@label"];
        this.controlType = jsonObj["@controlType"];
        this.customConstrainResolver = jsonObj["@customConstrainResolver"];
        if (jsonObj["description"] && jsonObj["description"].length){
            this.description = jsonObj["description"][0];
        }
        this.dictionary = new Dictionary();
        if (jsonObj["dictionary"] && jsonObj["dictionary"].length){
            this.dictionary.initFromJSONObj(jsonObj["dictionary"][0]);
        }
        this.constraints = new Constraints();
        if (jsonObj["constraints"] && jsonObj["constraints"].length){
            this.constraints.initFromJSONObj(jsonObj["constraints"][0]);
        }

        if (this.parentComponentType && this.id){
            this.parentComponentType.registerPropertyType(this);
        }
    },

    createInstance: function(id){
        var instance = new PropertyInstance(this, id);
        return instance;
    }
}

/*
 * PropertInstance
 * 
 */
function PropertyInstance(propertyType, id){

    if (!isSet(id)) {
      this.id = guid();
    } else {
      this.id = id;
    }

    if (isSet(propertyType)){
        this.type = propertyType;
        this._value = this.type.defaultValue;
    }

    if (window.holoComponentManager){
        window.holoComponentManager.propertyManager.registerProperty(this);
    }

    if (window.holoComponentManager){
        window.holoComponentManager.operationManager.registerAction("PropertyValueSet", PropertyValueSet);
    }

    $.extend(this, new EventDispatcher());
}

PropertyInstance.prototype = {
    id: null,
    type: null,
    _value: null,
    _oldValue: null,
    _presetValue: null,
    _parentComponent: null,

    testPresetValue: function(){
        return this.type.constraints.checkOn(this);
    },

    usePresetValue: function(){

        this._oldValue = this.value;
        this._value = this.presetValue;

        if (window.holoComponentManager.operationManager.beingRecordedOperation){
            window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("PropertyValueSet", [this.id, this._oldValue, this._value]));
        }
        
        if (this._parentComponent && !this._parentComponent.ignoreBindings && this.type.bindToSkinAttribute) {
            switch (this.type.bindToSkinAttribute) {
                case "positionX":
                    this._parentComponent._setX(this._value);
                    
                    break;
                
                case "positionY":
                    this._parentComponent._setY(this._value);
                                    
                    break;

                default:

                    var attributeDescriptor = this._parentComponent.skinAttributes[this.type.bindToSkinAttribute];

                    if (attributeDescriptor && $.isFunction(attributeDescriptor.setValue)) {
                        attributeDescriptor.setValue.call(this._parentComponent, this._value);
                    }

                    break;
            }
        }

        this.dispatchEvent("VALUE_CHANGED", this._value);
    },

    setValue: function(presetValue, ignoreConstraints){
        this.presetValue = presetValue;
        var testResponse = null;
        if (ignoreConstraints !== true){
            testResponse = this.testPresetValue();
        }
        if (ignoreConstraints || (!ignoreConstraints && testResponse.result === true)){
            this.usePresetValue();
            return new Response(true);
        } else{
            return testResponse;
        }
    },

    tryValue: function(presetValue){
        this.presetValue = presetValue;
        var testResponse = null;
        testResponse = this.testPresetValue();
        if (testResponse.result === true){
            return new Response(true);
        } else{
            return testResponse;
        }
    },

    destruct: function(){
        if (window.holoComponentManager.propertyManager){
            window.holoComponentManager.propertyManager.unregisterProperty(this);
        }
    },


    // Getters/setters
    get value(){
        return this._value;
    },

    get presetValue(){
        return this._presetValue;
    },

    get oldValue(){
        return this._oldValue;
    },

    set presetValue(v){
        this._presetValue = v;
    },
    
    get parentComponent() {
        return this._parentComponent;
    },
    
    set parentComponent(_value) {
        this._parentComponent = _value;
    }
    
}


/*
 * PropertyGroup
 * 
 */

function PropertyGroup(){
    }

PropertyGroup.prototype = {
    protoName: "PropertyGroup",
    members: null,
}

$.extend(PropertyGroup.prototype, new PropertyType());

PropertyGroup.prototype.initFromJSONObj = function(jsonObj){
    PropertyType.prototype.initFromJSONObj.call(this, jsonObj);

    types = initPropertyTypesFromJSONObj(jsonObj["members"][0], this.parentComponentType, this, true);

    this.members = this.members || [];
    for (var i = 0; i < types.length; i++){
        types[i].group = this;
        this.members.push(types[i]);
    }

    this.parentComponentType.propertyGroups = this.parentComponentType.propertyGroups || {};
    this.parentComponentType.propertyGroups[this.id] = this;
}

PropertyGroup.prototype.createInstance = null;



/*
 * SetType
 * 
 */
function SetType(defaultValue){
    this.defaultValue = {};
}

SetType.prototype = {
    maxSize: Infinity,
    memberType: null,
    protoName: "SetType"
}

$.extend(SetType.prototype, new PropertyType());

SetType.prototype.initFromJSONObj = function(jsonObj){
    PropertyType.prototype.initFromJSONObj.call(this, jsonObj);
    if (jsonObj["@maxSize"]){
        this.maxSize = jsonObj["@maxSize"];
        if (this.maxSize == "*") this.maxSize = Infinity;
    }

    this.memberType = initPropertyTypesFromJSONObj(jsonObj["memberType"][0], this.parentComponentType, this, true)[0];
    if (this.memberType) {
        this.memberType.id = this.id + ":|:memberType";
        this.parentComponentType.registerPropertyType(this.memberType);
    }
}

SetType.prototype.createInstance = function(id){
    var instance = new SetInstance(this, id);
    return instance;
}


/*
 * SetInstance
 * 
 */
function SetInstance(propertyType, id){
    PropertyInstance.call(this, propertyType, id);

    window.holoComponentManager.operationManager.registerAction("AddMemberProperty", AddMemberProperty);
    window.holoComponentManager.operationManager.registerAction("RemoveMemberProperty", RemoveMemberProperty);
        
}

SetInstance.prototype = {
    size: 0,

    addMemberProperty: function(memberProperty){
        if (memberProperty.type.protoName == this.type.memberType.protoName && this.size < this.type.maxSize){
            this._value[memberProperty.id] = memberProperty;
            memberProperty.parentComponent = this.parentComponent;
            this.size++;
            this.dispatchEvent("MEMBERPROPERTY_ADDED", memberProperty);

            if (window.holoComponentManager.operationManager.beingRecordedOperation){
                window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("AddMemberProperty", [this.id, memberProperty.id]));
            }

            return new Response(true);
        } else{
            return new Response(false, "SET_SIZE_EXCEEDED", this);
        }
    },
    
    removeMemberProperty: function(memberProperty) {
      if (this._value[memberProperty.id] == memberProperty) {
          delete this._value[memberProperty.id];
          memberProperty.parentComponent = null;
          this.size--;
          this.dispatchEvent("MEMBERPROPERTY_REMOVED", memberProperty);
          if (window.holoComponentManager.operationManager.beingRecordedOperation){
              window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("RemoveMemberProperty", [this.id, memberProperty.id]));
          }
      }
    },

    addMemberForValue: function(aValue){
        var memberProperty = this.type.memberType.createInstance();
        memberProperty.parentComponent = this.parentComponent;
        var response = this.testMemberProperty(memberProperty);
        if (response.result === true){
            response = memberProperty.setValue(aValue);
            if (response.result){
                return this.addMemberProperty(memberProperty);
            }
            else{
                return response;
            }
        } else return response;
    },

    testMemberProperty: function(memberProperty){
        if (memberProperty.type.protoName == this.type.memberType.protoName && this.size < this.type.maxSize){
            return new Response(true);
        } else{
            return new Response(false, "SET_SIZE_EXCEEDED", this);
        }
    },

    testMemberForValue: function(aValue){
        var memberProperty = this.type.memberType.createInstance();
        var response = memberProperty.setValue(aValue);
        if (response.result){
            return this.testMemberProperty(memberProperty);
        } else{
            return response;
        }
    },

}

$.extend(SetInstance.prototype, new PropertyInstance());


SetInstance.prototype.testPresetValue = function(){
    return this.type.constraints.checkOn(this);
}



/*
 * VariableType 
 * 
 */
function VariableType(defaultValue){
    if (defaultValue){
        this.defaultValue = defaultValue;
    }
}

VariableType.prototype = {
    protoName: "VariableType",
    quantity: null,
    bindToSkinAttribute: null,
    valueType: null,
}

$.extend(VariableType.prototype, PropertyType.prototype);

VariableType.prototype.initFromJSONObj = function(jsonObj){
    PropertyType.prototype.initFromJSONObj.call(this, jsonObj);

    this.bindToSkinAttribute = jsonObj["@bindToSkinAttribute"];
    this.valueType = jsonObj["@valueType"];
    if (jsonObj["@defaultValue"]){
        this.defaultValue = jsonObj["@defaultValue"];
    }
    
    this.parentComponentType.propertyBindingsToSkinAttributes = this.parentComponentType.propertyBindingsToSkinAttributes || {};
    
    this.parentComponentType.propertyBindingsToSkinAttributes[this.bindToSkinAttribute] = this.id;
}

/*
 * ReferenceType 
 * 
 */
function ReferenceType(){}

ReferenceType.prototype = {
    protoName: "ReferenceType",
    quantity: null,
    targetType: null,
    visualizedAs: null,
}

$.extend(ReferenceType.prototype, new PropertyType());

ReferenceType.prototype.initFromJSONObj = function(jsonObj){
    PropertyType.prototype.initFromJSONObj.call(this, jsonObj);

    this.targetType = jsonObj["@targetType"];
    this.visualizedAs = jsonObj["@visualizedAs"];

}

ReferenceType.prototype.createInstance = function(id){
    var instance = new ReferenceInstance(this, id);
    return instance;
}


/*
 * ReferenceInstance
 * 
 */
function ReferenceInstance(propertyType, id){
    PropertyInstance.call(this, propertyType, id);
}

ReferenceInstance.prototype = {
    _oldParentComponent: null,
    
    visualize: function() {
        
        if (window.holoComponentManager) {
            var referencedInstance = window.holoComponentManager.getComponentById(this._value);
            
            if (referencedInstance) {
                switch (this.type.visualizedAs){
                    case "CONTAINMENT":
                        
                        if (this._oldParentComponent) this._oldParentComponent.removeChild(referencedInstance);
                        if (this.parentComponent) this.parentComponent.addChild(referencedInstance);
                
                        break;
                }
            }
        }
    },
    
    parentComponentIsChanging: function (newValue) {
        trace("parentComponent is changing");  
    },
    
    set parentComponent(value) {

        if (this.parentComponent != value) {
            this._oldParentComponent = this._parentComponent;    
        }
        
        this._parentComponent = value;
        this.visualize();
    },
    
    get parentComponent() {
        return this._parentComponent;
    }    
}

$.extend(ReferenceInstance.prototype, new PropertyInstance());

ReferenceInstance.prototype.testPresetValue = function(){

    var presetInstance = window.holoComponentManager.getComponentById(this.presetValue);

    if (this.type.targetType == "*" || this.type.targetType == presetInstance.type.id){
        return PropertyInstance.prototype.testPresetValue.call(this, this.presetValue);
    } else{
        return new Response(false, "TYPE_MISMATCH", this);
    }
}

ReferenceInstance.prototype.usePresetValue = function(){
    PropertyInstance.prototype.usePresetValue.call(this);

    this.visualize();
}


/*
 * initPropertyTypesFromJSONObj
 */

function initPropertyTypesFromJSONObj(jsonObj, parentComponentType, parentPropertyType, simpleOnly){

    var types = new Array();

    for (var key in jsonObj){
        if (key == "set" || key == "group" || key == "variable" || key == "reference"){
            if (jsonObj[key].length){

                if (jsonObj[key].length){
                    for (var i = 0; i < jsonObj[key].length; i++){
                        var t = initPropertyTypesFromJSONObjHelper(key, jsonObj[key][i], parentComponentType, parentPropertyType, simpleOnly);
                        if (t && key != "group") types.push(t);
                    }
                }
            }
        }
    }

    return types;
}

/*
 * initPropertyTypesFromJSONObjHelper
 * 
 */
function initPropertyTypesFromJSONObjHelper(type, c_jsonObj, parentComponentType, parentPropertyType, simpleOnly){
    switch (type){
    case "set":
        if (!simpleOnly === true){
            var t = new SetType();
        }
        break;

    case "group":
        if (!simpleOnly === true){
            var t = new PropertyGroup();
        }
        break;

    case "variable":
        var t = new VariableType();
        break;

    case "reference":
        var t = new ReferenceType();
        break;
    }
    if (t){
        t.parentPropertyType = parentPropertyType;
        t.parentComponentType = parentComponentType;
        t.initFromJSONObj(c_jsonObj);
    }
    return t;
}

/*
 * HoloSkinPropertyDescriptor 
 * 
 */
function HoloSkinProperty() {};

HoloSkinProperty.prototype = {
    parent: null,
	value: null,
    transformator: function (value, dir) {return value},
    on_changed:null,

	setValue: function(newValue) {
		
        if (isFunction(this.on_changed)) {
			on_changed.call(this.parent, this.value);
		}		
	},
	
	setValueFromHost: function(newValue) {
		
	}
}


/*
 * HoloComponentSkin
 *
 */
function HoloSkin(url, host){
    if (url){

        this.host = host;

        this.url = url;
        this.load(this.url);
    }
}


HoloSkin.prototype = {
    loaded: false,
    url: null,
    content: null,
    host: null,
	properties:null,
  
	
	registerProperty: function(propertyName, skinAttribute, transformator) {
		var properties = this.properties || {};
	
	},
	
	unregisterPropery: function(propertyName) {
		
		
	},

    _contentLoaded: function(data){

        this.content = data;

        this.loaded = true;

        trace("HoloSkin loaded from [" + this.url + "]");

        if (this.host && jQuery.isFunction(this.host.on_skinLoaded)){
            this.host.on_skinLoaded.call(this.host);
        }

    },

    _loadError: function(XMLHttpRequest, textStatus, errorThrown){
        trace("HoloSkin from [" + this.url + "] could not be loaded. Error msg: " + textStatus + " " + errorThrown, "error");
    },

    load: function(){

        trace("Loading HoloSkin from [" + this.url + "]");
        this.contentLoaded = false;


        $.ajax({
            type: 'GET',
            url: this.url,
            success: this._contentLoaded,
            error: this._loadError,
            context: this,
            global: false,
            dataType: 'html'
        });

    },

}

/*
 * 
 * HoloComponentIcon
 * 
 */
function HoloComponentIcon(iconURL){
    if (isSet(iconURL)){

        }
}

HoloComponentIcon.prototype = {
    load: function(){

        }

}


/*
 * HoloComponentType
 *
 */
function HoloComponentType(){}

HoloComponentType.prototype = {
    id: null,
    label: null,
    symbol: null,
    description: null,
    propertyGroups: null,
    skinURL: null,
    iconURL: null,
    internal: false,
    skin: null,
    parentLibrary: null,
    initialized: false,
    _propertyTypes: null,
    propertyBindingsToSkinAttributes:null,
    constraints: null,
    dictionary: null,

    on_creation: null,

    registerPropertyType: function(propertyType){
        this._propertyTypes = this._propertyTypes || {};
        this._propertyTypes[propertyType.id] = propertyType;
    },

    initFromJSONObj: function(jsonObj){
        this.id = jsonObj["@id"];
        this.label = jsonObj["@label"];
        this.symbol = jsonObj["@symbol"];
        if (jsonObj["description"] && jsonObj["description"].length){
            this.description = jsonObj["description"][0]["Text"];
        }

        if (jsonObj["@internal"] && jsonObj["@internal"] == "true") this.internal = true;
        this.skinURL = this.parentLibrary.baseURL + "/" + jsonObj["@skinURL"];
        if (jsonObj["@iconURL"]) this.iconURL = this.parentLibrary.baseURL + "/" + jsonObj["@iconURL"];
        this.initialized = false;

        this.dictionary = new Dictionary();
        if (jsonObj["dictionary"] && jsonObj["dictionary"].length){
            this.dictionary.initFromJSONObj(jsonObj["dictionary"][0]);
        }

        if (jsonObj.properties && jsonObj.properties.length){
            var types = initPropertyTypesFromJSONObj(jsonObj.properties[0], this, null);
            for (var i = 0; i < types.length; i++){
                this._propertyTypes[types[i].id] = types[i];
            }
        }

        if (this.skinURL){
            this.skin = new HoloSkin(this.skinURL, this);
        } else{
            this.initialized = true;
            trace("Skinless HoloComponentType [" + this.id + "] is initialized.");
        }

        this.constraints = new Constraints();
        if (jsonObj["constraints"] && jsonObj["constraints"].length){
            this.constraints.initFromJSONObj(jsonObj["constraints"][0]);
        }

        if (jsonObj["onCreation"] && jsonObj["onCreation"].length){
            eval("var __onCreation__ = function () {" + jsonObj["onCreation"][0]["Text"] + "}");

            this.on_creation = __onCreation__;
        }


    },

    initFromXML: function(xml){
        this.initFromJSONObj($.xmlToJSON(xml));
    },

    getInstance: function(id){
        if (this.initialized){

            var instance = new HoloComponent(this.id, id);

            if (this.skin){
                // then we overrride the default skin
                instance.skinInstanceFromTemplate = this.skin.content;
            }

            return instance;
        }
    },

    getDummyInstance: function(id){
        if (this.initialized){

            var instance = new HoloComponent(this.id, id, true);

            if (this.skin){
                // then we overrride the default skin
                instance.skinInstanceFromTemplate = this.skin.content;
            }

            return instance;
        }
    },

    getDefaultValueForProperty: function(propertyId){
        if (this._propertyTypes && this._propertyTypes[propertyId]){
            return this._propertyTypes[propertyId].defaultValue;
        } else{
            return null;
        }
    },

    addConstraint: function(constraint){
        this.constraints = this.constraints || [];

        this.constraints.push(constraint);
    },

    createPropertyInstanceForTypeId: function(typeId, id){
        if (isSet(this._propertyTypes[typeId])){
            return this._propertyTypes[typeId].createInstance(id);
        } else{
            return null;
        }
    },

    // Event Hamdlers
    on_skinLoaded: function(){
        this.initialized = true;

        trace("HoloComponentType [" + this.id + "] is initialized.");

        if (this.parentLibrary && jQuery.isFunction(this.parentLibrary.on_componentInitialized)){
            this.parentLibrary.on_componentInitialized.call(this.parentLibrary, this);
        }
    }

}

/*
 * Quantity
 *
 */
function Quantity(){}

Quantity.prototype = {
    id: null,
    possibleUnits: null,
    baseUnit: null,
    symbol: null,

    initFromJSONObj: function(jsonObj){
        this.id = jsonObj["@id"];
        this.symbol = jsonObj["@symbol"];

        this.possibleUnits = {};

        for (var i = 0; i < jsonObj.units[0].unit.length; i++){
            var unit = new Unit();
            unit.initFromJSONObj(jsonObj.units[0].unit[i]);
            this.possibleUnits[unit.id] = unit;

            if (unit.isBase) this.baseUnit = unit;
        }

        trace("Quantity [" + this.id + "] is initialized.");
    },

    initFromXML: function(xml){
        this.initFromJSONObj($.xmlToJSON(xml));
    }


}

/*
 * Unit
 *
 */
function Unit(){}

Unit.prototype = {
    id: null,
    symbol: null,
    isBase: false,
    factor: null,

    initFromJSONObj: function(jsonObj){
        this.id = jsonObj["@id"];
        this.symbol = jsonObj["@symbol"];
        this.isBase = jsonObj["@isBase"];
        this.factor = jsonObj["@factor"];

        trace("Unit [" + this.id + "] is initialized.");

    },

    initFromXML: function(xml){
        this.initFromJSONObj($.xmlToJSON(xml));
    }
}


/*
 * HoloComponent
 *
 */
function HoloComponent(typeId, id, isDummy){

    $.extend(this, new EventDispatcher());

    if (isSet(id)){
        this.id = id;
    } else{
        this.id = guid();
    }

    trace("HoloComponent with id:[" + this.id + "] created.");
    this.skinInstanceFromTemplate = "";

    this.type = window.holoComponentManager.libraryManager.componentTypes[typeId];

    this.isDummy = (isDummy === true) ? true: false;

    window.holoComponentManager.registerComponent(this);

    window.holoComponentManager.operationManager.registerAction("PropertyAssignment", PropertyAssignment);
    window.holoComponentManager.operationManager.registerAction("PropertyUnassignment", PropertyUnassignment);    

    if ($.isFunction(this.type.on_creation)){
        this.type.on_creation.call(this);
    }
}

HoloComponent.prototype = {
    id: null,
    type: null,

    parentComponent: null,
    // Array, containing the children
    _childComponents: null,
    // index for children
    _childComponentIndexForId: null,

    _properties: null,
    presetPropertyValues: null,
    _oldPropertyValues: null,

    skinAttributeBindingsToProperties:null,

    _skinInstance: null,
    _containerElement: null,
    _childContainerElement: null,
    skinParts: null,
    skinAttributes: null,

    on_render: null,
    on_addTo: null,
    on_drop: null,
    on_afterAdded: null,

    isDummy: false,
    
    ignoreBindings: false,

    markupTemplate: "<div id=\"__hostID__\" class='skinInstance'><div class='skinWrapper'>__skinContent__</div></div>",

    createProperty: function(propertyId){
        var property = this.type.createPropertyInstanceForTypeId(propertyId);
        this._properties = this._properties || {};

        this.assignInstanceToProperty(propertyId, property);

        return new Response(true);
    },

    getPropertyValue: function(propertyId){
        if (this._properties && isSet(this._properties[propertyId])){
            return this._properties[propertyId].value;
        } else{
            if (this.type)
            return this.type.getDefaultValueForProperty(propertyId);
            else
            return null;
        }
    },

    getProperty: function(propertyId){
        if (this._properties && isSet(this._properties[propertyId])){
            return this._properties[propertyId]
        } else{
            var response = this.createProperty(propertyId);
            if (response.result !== true){
                return response;
            } else{
                return this._properties[propertyId];
            }
        }
    },

    assignInstanceToProperty: function(propertyId, instance){
        if (this._properties[propertyId]) this.unassignInstanceToProperty(propertyId, instance);
        this._properties[propertyId] = instance;
        instance.parentComponent = this;

        if (window.holoComponentManager.operationManager.beingRecordedOperation){
            window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("PropertyAssignment", [this.id, propertyId, instance.id]));
        }

    },

    unassignInstanceToProperty: function(propertyId, instance){

        if (this._properties[propertyId]) {
            var property = this._properties[propertyId];
            property.parentComponent = null;
            
            delete this._properties[propertyId];
            
            if (window.holoComponentManager.operationManager.beingRecordedOperation){
                window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("PropertyUnassignment", [this.id, propertyId, instance.id]));
            }
         }
    },

    setPropertyValue: function(propertyId, presetValue, ignoreConstraints){

        this._properties = this._properties || {};

        if (!isSet(this._properties[propertyId])){
            var createResponse = this.createProperty(propertyId);
            if (!createResponse.result){
                return createResponse;
            }
        }

        this.presetPropertyValues = this.presetPropertyValues || {};
        this.presetPropertyValues[propertyId] = presetValue;

        if (!ignoreConstraints){

            var testResponse = this.testPresetPropertyValues();

            if (testResponse.result === true){
                var response2 = this.usePresetProperyValues();
                delete this.presetPropertyValues[propertyId];
                return response2;
            }
            else{
              
                delete this.presetPropertyValues[propertyId];
                return testResponse;
            }

        } else{
            this.usePresetProperyValues();
            delete this.presetPropertyValues[propertyId];
            return new Response(true);
        }

    },

    testPropertyValue: function(propertyId, presetValue){

        this._properties = this._properties || {};

        if (!isSet(this._properties[propertyId])){
            var createResponse = this.createProperty(propertyId);
            if (!createResponse.result){
                return createResponse;
            }
        }

        this.presetPropertyValues = this.presetPropertyValues || {};
        this.presetPropertyValues[propertyId] = presetValue;


        var testResponse = this.testPresetPropertyValues();

        if (testResponse.result === true){
             var response2 = this.tryToUsePresetProperyValues();
             return response2;
        } else{
           
           delete this.presetPropertyValues[propertyId];
           return testResponse;
        }

        return new Response(true);

    },
    

    setPropertyValues: function(presetValues, ignoreConstraints){

        this._properties = this._properties || {};

        for (var propertyId in presetValues){
            if (!isSet(this._properties[propertyId])){
                var createResponse = this.createProperty(propertyId);
                if (!createResponse.result){

                    this.presetPropertyValues = {};
                    return createResponse;
                }
            }
        }

        if (!ignoreConstraints){
            this.presetPropertyValues = presetValues;

            var testResponse = this.testPresetPropertyValues();
            if (testResponse.result === true){
                var response2 = this.usePresetProperyValues();

                this.presetPropertyValues = {};

                return response2;
            }
            else{
                this.presetPropertyValues = {};

                return testResponse;
            }

        } else{
            for (var propertyId in presetValues){
                var property = this.getProperty(propertyId);
                property.setValue(presetValues[propertyId], true);
            }

        }

    },

    testPropertyValues: function(presetValues){

        this._properties = this._properties || {};

        for (var propertyId in presetValues){
            if (!isSet(this._properties[propertyId])){
                var createResponse = this.createProperty(propertyId);
                if (!createResponse.result){

                    this.presetPropertyValues = {};
                    return createResponse;
                }
            }
        }

       this.presetPropertyValues = presetValues;

       var testResponse = this.testPresetPropertyValues(); // HERE
       if (testResponse.result === true){
            var response2 = this.tryToUsePresetProperyValues();

            this.presetPropertyValues = {};

            return response2;
       } else {
            this.presetPropertyValues = {};
            return testResponse;
        }
        

        return new Response(true);
    },


    testPresetPropertyValues: function(){
        return this.type.constraints.checkOn(this);
    },

    tryToUsePresetProperyValues: function(){
        this._oldPropertyValues = {};

        var changedPropertyIds = [];

        for (var key in this.presetPropertyValues){
            this._oldPropertyValues[key] = this.getPropertyValue(key);
            var property = this.getProperty(key);

            changedPropertyIds.push(property.id);
            var response = property.tryValue(this.presetPropertyValues[key]);
            if (response.result == false){
                this.presetPropertyValues = {};                
                return response;
            }
        }

        this.presetPropertyValues = {};
        this.dispatchEvent("PROPERTYVALUES_CHANGED", this.id, changedPropertyIds);
        return response;        
    },

    usePresetProperyValues: function(){
        this._oldPropertyValues = {};

        var changedPropertyIds = [];

        for (var key in this.presetPropertyValues){
            this._oldPropertyValues[key] = this.getPropertyValue(key);
            var property = this.getProperty(key);

            changedPropertyIds.push(property.id);
            var response = property.setValue(this.presetPropertyValues[key]);
            if (response.result == false){
                // rollingback
                for (var key2 in this._oldPropertyValues){
                    var property2 = this.getProperty(key2);
                    property.setValue(this._oldPropertyValues[key2], true);
                }
                
                this.presetPropertyValues = {};                
                return response;
            }
        }

        this.presetPropertyValues = {};
        this.dispatchEvent("PROPERTYVALUES_CHANGED", this.id, changedPropertyIds);
        return response;        
    },

    setPropertyValueForSkinAttributeInOperation: function(skinAttributId, operationId) {
        var bindedPropertyId = this.skinAttributeBindingsToProperties[skinAttributId];

        if (bindedPropertyId) {
            try {
                window.holoComponentManager.operationManager.recordOperation(operationId); 

                this.ignoreBindings = true; 

                var response = this.setPropertyValue(bindedPropertyId, this.skinAttributes[skinAttributId].getValue.call(this), false);
                window.holoComponentManager.operationManager.finishRecording(response.result);                        
            } catch(e) {
                var response = new Response(false);
            }

            this.ignoreBindings = false;
            return response;
        } else {
            return new Response(true);
        }
        
    },

    testPropertyValueForSkinAttribute: function(skinAttributeId) {
        var bindedPropertyId = this.skinAttributeBindingsToProperties[skinAttributeId];

        if (bindedPropertyId) {
            return this.testPropertyValue(bindedPropertyId, this.skinAttributes[skinAttributeId].getValue.call(this));
        } else {
            return new Response(true);
        }
    },

    getPropertyValueForSkinAttribue: function(skinAttributeId) {
         var bindedPropertyId = this.skinAttributeBindingsToProperties[skinAttributId];

        if (bindedPropertyId) {
           this.getPropertyValue(bindedPropertyId);
        } else {
            return undefined;
        }

    },

    refreshSkinAttribute: function(skinAttribute) {
        var attributeDescriptor = this.skinAttributes[skinAttribute];

        if (attributeDescriptor && $.isFunction(attributeDescriptor.setValue)) {
            attributeDescriptor.setValue.call(this, this.getPropertyValue(this.type.propertyBindingsToSkinAttributes[skinAttribute]));
        }

    },

    deleteProperty: function(propertyId){

    },

    getChild: function(id){
        var index = this._childComponentIndexForId = this._childComponentIndexForId || {};
        if (index.hasOwnProperty(id)){
            return this._childComponents[index[id]];
        }
    },

    addChild: function(child){
        var index = this._childComponentIndexForId = this._childComponentIndexForId || {};

        if (!index.hasOwnProperty(child.id)){
            var children = this._childComponents = this._childComponents || [];
            index[child.id] = children.push(child) - 1;
            child.parentComponent = this;
            if (this._childContainerElement){
                child.addTo(this._childContainerElement);
            }
        }
    },

    removeChild: function(child){
        var index = this._childComponentIndexForId;

        if (index.hasOwnProperty(child.id)){
            
            var removed = child.remove();
            
            var children = this._childComponents = this._childComponents || [];
            var i = index[child.id];
            children.splice(i, 1);

            delete index;
            delete this._childComponentIndexForId;

            index = this._childComponentIndexForId = {};

            // re-building the index
            for (i = 0; i < children.length; i++){
                index[children[i].id] = i;
            }

            child.parentComponent = null;
            
            return removed;
        }
        
        return null;
    },

    render: function(refreshSkin, noContainer){
        if (this._containerElement || noContainer){

            if (this._skinInstance){

                if (refreshSkin === true){
                    if (this.type && this.type.skin){
                        this.skinInstanceFromTemplate = this.type.skin.content;
                    } else{
                        this.skinInstanceFromTemplate = "";
                    }
                }

                if ($.isFunction(this.on_render)) this.on_render.call(this);

                if (!this.isDummy && this.type.propertyBindingsToSkinAttributes) {
                    for (var skinAttribute in this.type.propertyBindingsToSkinAttributes) {
                        switch (skinAttribute) {
                            case "positionX":
                                this._setX(isSet(this.skinXCenter) ? this.getPropertyValue(this.type.propertyBindingsToSkinAttributes[skinAttribute]) - this.skinXCenter : this.getPropertyValue(this.type.propertyBindingsToSkinAttributes[skinAttribute]));
                                break;
                            case "positionY":
                                this._setY(isSet(this.skinYCenter) ? this.getPropertyValue(this.type.propertyBindingsToSkinAttributes[skinAttribute]) - this.skinYCenter : this.getPropertyValue(this.type.propertyBindingsToSkinAttributes[skinAttribute]));
                                break;								

                            default: 
                                    
                                if (this.skinAttributes) {
                                    var attributeDescriptor = this.skinAttributes[skinAttribute];

                                    if (attributeDescriptor && $.isFunction(attributeDescriptor.setValue)) {
                                        var reverseBindings = this.skinAttributeBindingsToProperties = this.skinAttributeBindingsToProperties || {};
                                        reverseBindings[skinAttribute] = this.type.propertyBindingsToSkinAttributes[skinAttribute];
                                        attributeDescriptor.setValue.call(this, this.getPropertyValue(this.type.propertyBindingsToSkinAttributes[skinAttribute]));
                                    }
                                }

                                break;
                        }  
                    }
                }


                if (this._childComponents && this._childContainerElement){
                    for (var i = 0; i < this._childComponents.length; i++){
                        this._childComponents[i].render(refreshSkin);
                    }
                }
            }

        }
    },

    addTo: function(cElement){

        if (this._containerElement != cElement){

            if (this._containerElement){
                this._skinInstance.remove();
            }

            this._containerElement = cElement;

            if (this._skinInstance){
                this._skinInstance.appendTo(this._containerElement);
                if ($.isFunction(this.on_addTo)) this.on_addTo.call(this);
                this._skinInstance.css("z-index", this._containerElement.css("z-index"));
                if (this._childContainerElement){
                    if (this._childContainerElement.css("z-index") == "auto"){
                        this._childContainerElement.css("z-index", this.skinInstance.css("z-index"));
                    }
                }
                

            }

            trace("HoloComponent with id:[" + this.id + "] added.");


            this.render();

            if ($.isFunction(this.on_afterAdded)) this.on_afterAdded.call(this);

        }

    },

    remove: function() {
        this._containerElement = null;
        return $("#"+this.id).detach();
    },

    _initFromXML: function(xml){
        },

    exportAsXML: function(){
        var xml = null;

        return xml;
    },

    destruct: function(){
        window.holoComponentManager.unregisterComponent(this);
    },

    // visual operations
    
    moveTo: function(xC, yC, ignoreConstraints, ignoreCenter) {
      
      if (this.skinInstance) {
        
        var presetValues = {};
        
        
        if (!this.isDummy && isSet(this.type.propertyBindingsToSkinAttributes["positionX"])) {
          presetValues[this.type.propertyBindingsToSkinAttributes["positionX"]] = (isSet(this.skinXCenter) && !ignoreCenter) ? this.skinXCenter+xC : xC; 
        }
        
        if (!this.isDummy && isSet(this.type.propertyBindingsToSkinAttributes["positionY"])) {
          presetValues[this.type.propertyBindingsToSkinAttributes["positionY"]] = (isSet(this.skinYCenter) && !ignoreCenter) ? this.skinYCenter+yC : yC;
        }        
       
        this.ignoreBindings = true; 
        var response = this.setPropertyValues(presetValues, ignoreConstraints);
        this.ignoreBindings = false;
                
        if (response.result) {
		  this.skinInstance.css("left", xC);
          this.skinInstance.css("top", yC);
        } else {
          var p = this.skinInstance.data("originalPos");
          if (isSet(p)) {
    		  this.skinInstance.css("left", p.left);
              this.skinInstance.css("top", p.top);
          } else {
              var left = this.type.getDefaultValueForProperty(this.type.propertyBindingsToSkinAttributes["positionX"]);
              var top = this.type.getDefaultValueForProperty(this.type.propertyBindingsToSkinAttributes["positionX"]);
    		  this.skinInstance.css("left", left);
              this.skinInstance.css("top", top);
//                defaultValue
          }
        }
        
        return response; 
                
      }
      
    },
    
    testMoveTo: function(xC, yC) {
      
      if (this.skinInstance) {
        
        var presetValues = {};
        var ignoreCenter = false;
        
        if (!this.isDummy && isSet(this.type.propertyBindingsToSkinAttributes["positionX"])) {
          presetValues[this.type.propertyBindingsToSkinAttributes["positionX"]] = (isSet(this.skinXCenter) && !ignoreCenter) ? this.skinXCenter+xC : xC; 
        }
        
        if (!this.isDummy && isSet(this.type.propertyBindingsToSkinAttributes["positionY"])) {
          presetValues[this.type.propertyBindingsToSkinAttributes["positionY"]] = (isSet(this.skinYCenter) && !ignoreCenter) ? this.skinYCenter+yC : yC;
        }        

        var response = this.testPropertyValues(presetValues, false);
             
        if (response.result) {
            if (this.skinInstance.data('forbiddenPosition')) {
    		    this.skinInstance.removeClass("forbiddenPosition");
                this.skinInstance.data('forbiddenPosition', false);
            }
        } else {
            if (this.skinInstance.data('forbiddenPosition') != true) {
                this.skinInstance.addClass("forbiddenPosition");
                this.skinInstance.data('forbiddenPosition', true);
            }
        }
        
        return response; 
                
      }
      
    },
    
    getX: function() {
        return (this.skinInstance) ? this.skinInstance.position().left : null; 	
    },
    
    getY: function() {
        return (this.skinInstance) ? this.skinInstance.position().top : null;		
    },
    
    _setX: function(value) {
        if (this.skinInstance) this.skinInstance.css("left", value);
    },
    
    _setY: function(value) {
        if (this.skinInstance) this.skinInstance.css("top", value);		
    },
    
    // Event handlers
    
    _on_drop: function(e, ui){

        var component = window.holoComponentManager.getComponentById($(this).attr('id'));

        if (component._skinInstance){
            if ($.isFunction(component.on_drop)) component.on_drop.call(component, e, ui);
        }

    },
    

    // Getters/setters


    get skinInstance(){
        return this._skinInstance;
    },

    set skinInstanceFromTemplate(skinString){

        if (skinString == "") skinString = "<div id='" + this.id + "-childContainer' class='defaultSkin-childContainer'></div>";

        if (this._skinInstance){
            this._skinInstance.unbind('click', window.player.on_component_mousedown);
            delete this._skinInstance;
        }


        //var markup = "<div id="+this.id+" class='skinInstance'><div class='skinWrapper'>"+skinString+"</div></div>";
        var markup = this.markupTemplate.replace(/__skinContent__/ig, skinString);

        if (this.type){
            markup = markup.replace(/__libraryURL__/ig, this.type.parentLibrary.baseURL);
        }

        markup = markup.replace(/__host__/ig, "window.holoComponentManager.getComponentById(\"__hostID__\")");
        markup = markup.replace(/id="(?!__hostID__)/ig, "id=\"__hostID__-");
        markup = markup.replace(/id="(?!__hostID__)/ig, "id=\'__hostID__-");
        markup = markup.replace(/__hostID__/ig, this.id);

        this._skinInstance = $(markup);

        if (this.getPropertyValue("droppable") == "true"){
            this._skinInstance.droppable({
                drop: this._on_drop
            });
        }

        if (this.getPropertyValue("selectable") != "false"){
            //	this._skinInstance.selectable();
            }

        this._skinInstance.bind('mousedown', window.player.on_component_mousedown);

        if (this.getPropertyValue("draggable") == "true"){
            this.skinInstance.css("cursor", "move");
            this.skinInstance.disableSelection();
            if (isSet(this.type.propertyBindingsToSkinAttributes["positionX"]) ||
                isSet(this.type.propertyBindingsToSkinAttributes["positionY"]) ) { 
                this.skinInstance.draggable({
                    zIndex: 100000,
                    containment: $(".mainCanvas"),
					drag: function(event, ui) {
                        var c = window.holoComponentManager.getComponentById(this.id);
                        c.testMoveTo(c.getX(), c.getY());
                    },
                    start: function(event, ui){
                    },
                    start: function(event, ui) {
                        var me = $(this);
                        me.data("originalPos", me.position());
                    },
                    stop: function(event, ui){
                        window.holoComponentManager.operationManager.recordOperation("Move component"); 

                        var c = window.holoComponentManager.getComponentById(this.id);
                        var response = c.moveTo(c.getX(), c.getY());

                        $(this).removeClass("forbiddenPosition");

                        window.holoComponentManager.operationManager.finishRecording(response.result);
                    },
                    
                }).addTouch();
            } else {
                this.skinInstance.draggable({
                    zIndex: 100000,
                    containment: $(".mainCanvas"),					
                }).addTouch();
            }
        }

        this._skinInstance.data("hostComponent",this);

        this._childContainerElement = this._skinInstance.find("[id='" + this.id + "-childContainer']");

        if (this._childContainerElement){
            if (this._childComponents){
                for (var i = 0; i < this._childComponents.length; i++){
                    this._childComponents[i].addTo(this._childContainerElement);
                }
            }
        }

    }

}

/*
 * 
 * Dictionary
 * 
 */

function Dictionary(){}

Dictionary.prototype = {
    terms: {},

    initFromJSONObj: function(jsonObj){
        if (jsonObj.term && jsonObj.term.length){
            for (var i = 0; i < jsonObj.term.length; i++){
                this.terms[jsonObj.term[i]["@id"]] = jsonObj.term[i]["Text"];
            }
        }
    },

    initFromXML: function(xml){
        this.initFromJSONObj($.xmlToJSON(xml));
    },

    translate: function(term_id){
        if (isSet(this.terms[term_id])){
            return this.terms[term_id];
        } else if (player._library.dictionary && isSet(player._library.dictionary.terms[term_id])){
            return player._library.dictionary.terms[term_id];
        } else{
            return term_id;
        }
    }
}

/*
 * 
 * Constraints
 * 
 */

function Constraints(){}

Constraints.prototype = {
    list: null,

    initFromJSONObj: function(jsonObj){
        if (jsonObj.constraint && jsonObj.constraint.length){
            this.list = [];
            for (var i = 0; i < jsonObj.constraint.length; i++){
                this.list.push("var __constraint__= function() {" + jsonObj.constraint[i]["Text"] + "};");
            }
        }
    },

    initFromXML: function(xml){
        this.initFromJSONObj($.xmlToJSON(xml));
    },

    checkOn: function(target){
        var result;
        var response;
        if (this.list){
            var stop = false;
            for (var i = 0; i < this.list.length && (stop !== true); i++){
                eval(this.list[i]);
                response = __constraint__.call(target);
                if (response) stop = response.result;
            }
        }
        if (isSet(response)) {
            if (isSet(response.code)) {
                window.holoComponentManager.showMessage(response.toString());
            }
            return response;
        } else {
            return new Response(true);
        }
    },
}

/*
 * 
 * OperationManager
 * 
 */
function OperationManager(){
    this.journalMaxLength = Infinity;
    this.journal = [];
    $.extend(this, new EventDispatcher());
}

OperationManager.prototype = {
    journal: null,
    beingRecordedOperation: null,
    lastDoneOperationIndex: -1,
    actions: null,
    busy: false,

    log: function(operation){
        if (this.lastDoneOperationIndex && this.lastDoneOperationIndex < this.journal.length - 1){
            // we walked back in the journal, before logging tail of the journal should be erased
            this.journal = this.journal.slice(0, this.lastDoneOperationIndex + 1);
        }
        if (this.journal.length > this.journalMaxLength){
            // if size is greater than max size, we just remove the 1st element
            this.journal.shift();
        }
        this.journal.push(operation);
        this.lastDoneOperationIndex = this.journal.length - 1;

        this.dispatchEvent("OPERATION_ACCESSED", this.lastDoneOperationIndex);

        return this.journal.length;
    },

    redo: function(ingnoreConstraints){
        if (this.lastDoneOperationIndex < this.journal.length - 1 && !this.busy){
            this.busy = true;
            this.journal[++this.lastDoneOperationIndex].doIt(true);
            this.busy = false;
            this.dispatchEvent("OPERATION_ACCESSED", this.lastDoneOperationIndex);

        }

    },

    undo: function(){

        if (this.lastDoneOperationIndex != null && !this.busy){
            this.busy = true;
            this.journal[this.lastDoneOperationIndex--].rollBack();
            this.busy = false;
            this.dispatchEvent("OPERATION_ACCESSED", this.lastDoneOperationIndex);
        }

    },

    recordOperation: function(label){
        if (!this.beingRecordedOperation){
            this.beingRecordedOperation = new Operation(label);
            return this.beingRecordedOperation;
        } else{
            throw ("Multiple operation recording exception.");
        }
    },

    finishRecording: function(logRecorded){
        if (logRecorded == true){
            this.log(this.beingRecordedOperation);
            trace("LOGGING");
        } else {
            this.beingRecordedOperation.rollBack();
            trace("ROLLING BACK");
        }

        trace($.toJSON(this.beingRecordedOperation));

        this.beingRecordedOperation = null;

    },

    registerAction: function(actionId, actionClass){
        this.actions = this.actions || {};
        this.actions[actionId] = actionClass;
    }

}

/*
 * 
 * ActionFootprint
 * 
 */
function ActionFootprint(actionType, parameters){
    this.actionType = actionType;
    this.parameters = parameters;
}

ActionFootprint.prototype = {
    actionType: null,
    parameters: null,
    
    undo: function() {
      //trace(this.actionType+".prototype.undo.apply({}, "+$.toJSON(this.parameters)+");");
	  eval (this.actionType+".prototype.undo.apply({}, "+$.toJSON(this.parameters)+");");
    },
    
    doIt: function(ignoreConstraints) {
      //trace(this.actionType+".prototype.doIt.apply({}, "+$.toJSON(this.parameters.concat([ignoreConstraints]))+");");
      eval (this.actionType+".prototype.doIt.apply({}, "+$.toJSON(this.parameters.concat([ignoreConstraints]))+");");

    }
    
}


/*
 * 
 * Operation 
 *   
 */
function Operation(label){
    this.label = label;
    this.id = guid();
}

Operation.prototype = {

    id: null,
    label: null,
    footprint: null,

    addAction: function(actionFootprint){
        this.footprint = this.footprint || [];

        this.footprint.push(actionFootprint);
    },

    rollBack: function() {
      
      if (this.footprint) {
        for (var i = this.footprint.length-1; i >= 0; i--) {
          this.footprint[i].undo();
        }
      }
      
    },
    
    doIt: function(ignoreConstraints) {
      
      // TODO:  What if not ignore constraints

      if (this.footprint) {
        for (var i = 0; i < this.footprint.length; i++) {
          this.footprint[i].doIt(ignoreConstraints);
        }
      }
      
    },
        
    /*	// Presets all then testPresets	
    test: function() {
        
        if (this.changes) {
            
        } else {
            return new Response(true);			
        }

    },
    
    // commits all presets	
    commit: function() {
        this.test();
        return new Response(true);		
    },
    
    rollback: function() {
        
    }*/

}



/*
 * 
 * Response
 * 
 */
function Response(result, code, source){
    this.result = result;
    this.code = code;
    this.source = source;
}

Response.prototype = {
    toString: function(){
        if (isSet(this.code)){
            if (this.source && this.source.type && this.source.type.dictionary){
                return this.source.type.dictionary.translate(this.code);
            }
            else{
                return this.code;
            }
        } else{
            return this.result;
        }
    }
}


/*
 * 
 * EventDispatcher
 * 
 */
function EventDispatcher(){};
EventDispatcher.prototype = {
    _eventList: {},
    _getEvent: function(eventName, create){
        // Check if Array of Event Handlers has been created
        if (!this._eventList[eventName]){

            // Check if the calling method wants to create the Array
            // if not created. This reduces unneeded memory usage.
            if (!create){
                return null;
            }

            // Create the Array of Event Handlers
            this._eventList[eventName] = [];
            // new Array
        }

        // return the Array of Event Handlers already added
        return this._eventList[eventName];
    },
    addEventListener: function(eventName, handler){
        // Get the Array of Event Handlers
        var evt = this._getEvent(eventName, true);

        // Add the new Event Handler to the Array
        evt.push(handler);
    },
    removeEventListener: function(eventName, handler){
        // Get the Array of Event Handlers
        var evt = this._getEvent(eventName);

        if (!evt){
            return;
        }

        // Helper Method - an Array.indexOf equivalent
        var getArrayIndex = function(array, item){
            for (var i = array.length; i < array.length; i++){
                if (array[i] && array[i] === item){
                    return i;
                }
            }
            return - 1;
        };

        // Get the Array index of the Event Handler
        var index = getArrayIndex(evt, handler);

        if (index > -1){
            // Remove Event Handler from Array
            evt.splice(index, 1);
        }
    },
    dispatchEvent: function(eventName, eventArgs){
        // Get a function that will call all the Event Handlers internally
        var handler = this._getEventHandler(eventName);
        if (handler){
            // call the handler function
            // Pass in "sender" and "eventArgs" parameters
            handler(this, eventArgs);
        }
    },
    _getEventHandler: function(eventName){
        // Get Event Handler Array for this Event
        var evt = this._getEvent(eventName, false);
        if (!evt || evt.length === 0){
            return null;
        }

        // Create the Handler method that will use currying to
        // call all the Events Handlers internally
        var h = function(sender, args){
            for (var i = 0; i < evt.length; i++){
                evt[i](sender, args);
            }
        };

        // Return this new Handler method
        return h;
    }
};

/*
 * 
 * HoloPropertyManager
 * 
 */
function HoloPropertyManager(){

    window.holoComponentManager.operationManager.registerAction("PropertyInstanceCreation", PropertyInstanceCreation);
    window.holoComponentManager.operationManager.registerAction("PropertyInstanceDeletion", PropertyInstanceDeletion);
}

HoloPropertyManager.prototype = {

    _properties: null,

    registerProperty: function(property){
        this._properties = this._properties || {};
        this._properties[property.id] = property;

        if (window.holoComponentManager.operationManager.beingRecordedOperation){
            window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("PropertyInstanceCreation", [property.id, property.type.parentComponentType.id, property.type.id]));
        }


    },

    unregisterProperty: function(property){
        this._properties = this._properties || {};
        delete this._properties[property.id];

        if (window.holoComponentManager.operationManager.beingRecordedOperation){
            window.holoComponentManager.operationManager.beingRecordedOperation.addAction(new ActionFootprint("PropertyInstanceDeletion", [property.id, property.type.parentComponentType.id, property.type.id]));
        }

    },
    
    getPropertyById: function(id) {
        if (this._properties && this._properties[id]){
            return this._properties[id];
        } else{
            return null;
        }
    }

}

////// ACTIONS //////////////////////////////////////////////////////////////////////////

/*
 * 
 * ComponentCreation
 * 
 */
function ComponentCreation(){
}

ComponentCreation.prototype = {
  
  doIt: function(componentId, typeId, ignoreConstraints) {
    var c = window.holoComponentManager.libraryManager.createNewComponentInstanceFromType(typeId, componentId);
    return c;
  },
  
  undo: function(componentId, typeId) {
    window.holoComponentManager.getComponentById(componentId).destruct(); 
  }
}


/*
 * ComponentDeletion 
 * 
 */
function ComponentDeletion(){
}

ComponentDeletion.prototype = {
  
  doIt: function(componentId, typeId, ignoreConstraints) {
    window.holoComponentManager.getComponentById(componentId).destruct();
  },
  
  undo: function(componentId, typeId) {
    var c = window.holoComponentManager.libraryManager.createNewComponentInstanceFromType(typeId, componentId);
    return c;    
  }
}


/*
 * 
 * PropertyInstanceCreation
 * 
 */
function PropertyInstanceCreation(){
}

PropertyInstanceCreation.prototype = {
  
  doIt: function(propertyId, componentTypeId, typeId, ignoreConstraints) {
    var property = window.holoComponentManager.libraryManager.componentTypes[componentTypeId].createPropertyInstanceForTypeId(typeId, propertyId);
    return property;
  },
  
  undo: function(propertyId, componentTypeId, typeId) {
    var property = window.holoComponentManager.propertyManager.getPropertyById(propertyId);
    property.destruct();    
  }
}


/*
 * PropertyInstanceDeletion 
 * 
 */
function PropertyInstanceDeletion(){
}

PropertyInstanceDeletion.prototype = {
  
  doIt: function(propertyId, componentTypeId, typeId, ignoreConstraints) {
    var property = window.holoComponentManager.propertyManager.getPropertyById(propertyId);
    property.destruct();    
  },
  
  undo: function(propertyId, componentTypeId, typeId) {
    var property = window.holoComponentManager.libraryManager.componentTypes[componentTypeId].createPropertyInstanceForTypeId(typeId, propertyId);
    return property;
  }

}


/*
 * PropertyAssignment 
 * 
 */
function PropertyAssignment(){
}

PropertyAssignment.prototype = {
  
  doIt: function(componentId, propertyId, propertyInstanceId,ignoreConstraints) {
    var component = window.holoComponentManager.getComponentById(componentId);
    var instance = window.holoComponentManager.propertyManager.getPropertyById(propertyInstanceId);
    
    if (component) component.assignInstanceToProperty(propertyId, instance);        
  },
  
  undo: function(componentId, propertyId, propertyInstanceId) {
    var component = window.holoComponentManager.getComponentById(componentId);
    var instance = window.holoComponentManager.propertyManager.getPropertyById(propertyInstanceId);
    
    if (component) component.unassignInstanceToProperty(propertyId, instance)    
  }
}


/*
 * PropertyUnassignment 
 * 
 */
function PropertyUnassignment(){
}

PropertyUnassignment.prototype = {
  
  doIt: function(componentId, propertyId, propertyInstanceId,ignoreConstraints) {
    var component = window.holoComponentManager.getComponentById(componentId);
    var instance = window.holoComponentManager.propertyManager.getPropertyById(propertyInstanceId);
    
    if (component) component.unassignInstanceToProperty(propertyId, instance);    
    
  },
  
  undo: function(componentId, propertyId, propertyInstanceId) {
    var component = window.holoComponentManager.getComponentById(componentId);
    var instance = window.holoComponentManager.propertyManager.getPropertyById(propertyInstanceId);
    
    if (component) component.assignInstanceToProperty(propertyId, instance);        
  }
}


/*
 * AddMemberProperty 
 * 
 */
function AddMemberProperty(){}

AddMemberProperty.prototype = {
  
  doIt: function(setPropertyId, memberPropertyId, ignoreConstraints) { 

    var setProperty = window.holoComponentManager.propertyManager.getPropertyById(setPropertyId);
    var memberProperty = window.holoComponentManager.propertyManager.getPropertyById(memberPropertyId);

    if (!setProperty) return Response(false);

    if (ignoreConstraints) {
      setProperty.addMemberProperty(memberProperty);
    } else {
      var response = setProperty.testMemberProperty(memberProperty);
      if (response.result) {
        setProperty.addMemberProperty(memberProperty);        
      } else {
        return response;
      }
    }  
  },
  
  undo: function(setPropertyId, memberPropertyId) {

    var setProperty = window.holoComponentManager.propertyManager.getPropertyById(setPropertyId);
    var memberProperty = window.holoComponentManager.propertyManager.getPropertyById(memberPropertyId);

    if (setProperty && memberProperty) {
		setProperty.removeMemberProperty(memberProperty);
	}
  }
}

/*
 * RemoveMemberProperty 
 * 
 */
function RemoveMemberProperty(setPropertyId, memberPropertyId){}

RemoveMemberProperty.prototype = {
  
  doIt: function(setPropertyId, memberPropertyId, ignoreConstraints) {
    
    var setProperty = window.holoComponentManager.propertyManager.getPropertyById(setPropertyId);
    var memberProperty = window.holoComponentManager.propertyManager.getPropertyById(memberPropertyId);

    if (!setProperty) return Response(false);

    setProperty.removeMemberProperty(memberProperty);
    
    return new Response(true);

  },
  
  undo: function(setPropertyId, memberPropertyId) {
    var setProperty = window.holoComponentManager.propertyManager.getPropertyById(setPropertyId);
    var memberProperty = window.holoComponentManager.propertyManager.getPropertyById(memberPropertyId);

    if (!setProperty) return;

    setProperty.addMemberProperty(memberProperty);
  }
}


/*
 * PropertyValueSet 
 * 
 */
function PropertyValueSet(){
}

PropertyValueSet.prototype = {
  
  doIt: function(propertyId, oldValue, newValue, ignoreConstraints) {
    var property = window.holoComponentManager.propertyManager.getPropertyById(propertyId);
    property.setValue(newValue, ignoreConstraints);    
  },
  
  undo: function(propertyId, oldValue, newValue) {
    var property = window.holoComponentManager.propertyManager.getPropertyById(propertyId);
    property.setValue(oldValue, true);        
  }
}

