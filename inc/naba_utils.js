// Utility functions
/*
 * 
 * Loading CSS document and instert it as a link 
 * 
 */
function getCSS(url) {
  $("head").append("<link>");
    css = $("head").children(":last");
    css.attr({
      rel:  "stylesheet",
      type: "text/css",
      href: url
    });
}
 
/*
 * 
 * Disabling selection on element
 * 
 */
jQuery.fn.extend({ 
        disableSelection : function() { 
                this.each(function() { 
                        this.onselectstart = function() { return false; }; 
                        this.unselectable = "on"; 
                        jQuery(this).css('-moz-user-select', 'none'); 
                }); 
        } 
});


/*
 *
 * Getting textwidth
 *
 */
$.fn.textWidth = function(){
  var html_org = $(this).html();
  var html_calc = '<span>' + html_org + '</span>'
  $(this).html(html_calc);
  var width = $(this).find('span:first').width();
  $(this).html(html_org);
  return width;
};



/**
 *
 * GUID generation
 * 
 */
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

/**
 *
 *	Checks if a variable is set
 *
 */
function isSet( variable ) {
	return( typeof( variable ) != 'undefined' );
}

/**
 *
 *	Traces a msg on the console if available
 *
 */
function trace( msg, mode ) {

    if (isSet(window.DEBUG) && window.DEBUG==true) {
        if (isSet(window["console"])) {
            
            switch (mode) {
                case "error":

                    if (isSet(console.error)) {
                        var today=new Date();
                    
                        var h=today.getHours();
                        var m=today.getMinutes();
                        var s=today.getSeconds();
                        var ms=today.getMilliseconds();
                        
                        console.error("["+h+":"+m+":"+s+"."+ms+"] "+msg);
                        
                        break;
                    }
                    
                default:
                    
                    if (isSet(console.log)) {
                        var today=new Date();
                    
                        var h=today.getHours();
                        var m=today.getMinutes();
                        var s=today.getSeconds();
                        var ms=today.getMilliseconds();
                        
                        console.log("["+h+":"+m+":"+s+"."+ms+"] "+msg);
                    }
            }
        }
    }
}

/**
 *
 * Loads an XML document a processes it with a processor function
 *
 */
function ProcessableXML() {
 
}

ProcessableXML.prototype = {
	
	contentLoaded: false,
	contentProcessed: false,
	contentXML: null,
	url: null,
	context: this,
	
	processor: null,
	postLoading: null,
	
	_processLoadedContent: function(xml) {
		
		this.contentXML = xml;
		trace("Content loaded from ["+this.url+"]");
		this.contentLoaded = true;
		
		if (jQuery.isFunction(this.processor)) {
			this.contentProcessed = this.processor.call(this.context, this.contentXML);			
		} else {
			this.contentProcessed = true;
		}
		trace("Content from ["+this.url+"] process result is "+this.contentProcessed);
		
		if (jQuery.isFunction(this.postLoading)) {
			this.postLoading.call(this.context, this.contentLoaded, this.contentProcessed);
		}
	},
	
	_loadError: function(XMLHttpRequest, textStatus, errorThrown) {
		trace("Content from ["+this.url+"] could not be loaded. Error msg: "+textStatus+" "+errorThrown, "error");
		if (jQuery.isFunction(this.postLoading)) {
			this.postLoading.call(this.context, this.contentLoaded, this.contentProcessed);
		}
	},
	
	loadContent: function (location) {
		
		this.url = location;
		trace("Loading content from ["+this.url+"]");
		this.contentLoaded = false;
		this.contentProcessed = false;

        $.ajax({  
            type: 'GET',  
            url: this.url,  
			dataType: ($.browser.msie) ? "text" : "xml",
            success: this._processLoadedContent,
			error: this._loadError,
			context: this,
			global: false
         });

	},
	
	setContent: function (xml) {
	
		this.url = "INTERNALLY_SPECIFIED";
		
		
		if (xml != null) {
			this.contentXML = xml;
			trace("Processable XML content set");
			contentLoaded = true;
			if (jQuery.isFunction(this.processor)) {
				this.contentProcessed = this.processor(this.contentXML);			
			} else {
				this.contentProcessed = true;
			}
			trace("Content of ["+this.url+"] processing result is "+this.contentProcessed);
			
			if (jQuery.isFunction(this.postLoading)) {
				this.postLoading.call(this.context, this.contentLoaded, this.contentProcessed);
			}
		} else {
			// this is just for clearing and reseting the object
			
			delete contentXML;
			
			contentLoaded = false;
			contentProcessed = false;

		}
			
	}
}


// Canvas drawing extension
if (!!document.createElement('canvas').getContext) {
    $.extend(CanvasRenderingContext2D.prototype, { 
        
        ellipse: function (aX, aY, r1, r2, fillIt) {
            aX = aX - r1;
            aY = aY - r2;
            
            var aWidth = r1*2;
            var aHeight = r2*2;
            
            var hB = (aWidth / 2) * .5522848,
                vB = (aHeight / 2) * .5522848,
                eX = aX + aWidth,
                eY = aY + aHeight,
                mX = aX + aWidth / 2,
                mY = aY + aHeight / 2;
            this.beginPath();
            this.moveTo(aX, mY);
            this.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
            this.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
            this.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
            this.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
            this.closePath();
            if (fillIt) this.fill(); 
            this.stroke();
        },
        
        circle: function(aX, aY, aDiameter, fillIt) { 
           this.ellipse(aX, aY, aDiameter, aDiameter, fillIt)
        }
    });
}

/*
 * 
 * EventDispatcher
 * 
 */
function EventDispatcher(){
    this._eventList = {};
};
EventDispatcher.prototype = {
    _eventList: null,
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
    removeAllEventListeners: function(eventName) {
                // Get the Array of Event Handlers
        var evt = this._getEvent(eventName);

        if (!evt){
            return;
        }
        
        evt.splice(0, evt.length);
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

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};

if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++){
            if(this[i]==obj){
                return i;
            }
        }
        return -1;
    }
}

Array.prototype.removeElement = function (e) {
    var idx = this.indexOf(e);
    while (idx > -1) {
     this.splice(idx, 1); // Remove it if really found!
     var idx = this.indexOf(e);
  }
}
 

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}; 


function IsIE8Browser() {
    var rv = -1;
    var ua = navigator.userAgent;
    var re = new RegExp("Trident\/([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null) {
        rv = parseFloat(RegExp.$1);
    }
    return (rv == 4);
}
