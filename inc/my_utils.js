/**
 * Utility functions
 * @author naba
 */

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
