/**
 * @author naba
 */

 /*
 * 
 * Rotation with setting centerpoint
 * 
 */
jQuery.fn.extend({
    rotateAround: function(centerX, centerY, angle){
       // this is needed for proper working in webkit
       this.css('rotate', 0);
       var position = this.position();
	   this.css('position', "absolute");
	   //trace("rotation Center> "+centerX+" "+centerY);
	   this.css('rotate', angle);
       var width = this.width();
       var height = this.height();
	   var angleRad = angle*Math.PI/180;
       // the location of the rotation center (RC) in the geometric center-based (GCS) system 
       var x = centerX-width/2;
       var y = centerY-height/2;
	   // the new coordinates
	   var cosA =  Math.cos(angleRad);
	   var sinA =  Math.sin(angleRad);
	   var x_ = x*cosA - y*sinA;
       var y_ = x*sinA + y*cosA;
	   //trace("GCS based coordinates> "+x+" "+y+" "+x_+" "+y_);
       // deltas
	   var dx = Math.round(x_-x);
	   var dy = Math.round(y_-y);
	   //trace("translation> "+dx+" "+dy);
	   // we make the inverse translation to move RC back
	   //trace("Old position> "+(position.left)+" "+(position.top));
       if (prevTranslation = $(this).data('rotationTranslation')) {
           this.css('left', position.left-dx+prevTranslation[0]);
           this.css('top', position.top-dy+prevTranslation[1]);
       } else {
           this.css('left', position.left-dx);
           this.css('top', position.top-dy);
	   }
	   // saving the value of the correction for using it in subsequent rotations
	   this.data('rotationTranslation', [dx,dy]);
       var rotateControl = this.data("rotateControl");
       if (rotateControl) {
           rotateControl.data("followHost").call(rotateControl);
       }
       var resizeControl = this.data("resizeControl");
       if (resizeControl) {
           resizeControl.data("followHost").call(resizeControl);
       }
    },
    
	resizeAround: function (centerX, centerY, newWidth, newHeight) {
        // dimensions are always positive
        if (newWidth >= 0 && newHeight >= 0) {
            this.css('position', "absolute"); // just in case
            // removing current rotation control
            if (this.data("rotateControl")) {
                this.detachRotateControl();
                var hadRotateControl = true;
            }
            // reseting rotation for resize
            var angle = this.css("rotate");
            var position = this.position();
            // calculating ratios
			var scales = [newWidth/this.width(), newHeight/this.height()];
            //setting new size
            this.width(newWidth);
            this.height(newHeight);
            // calculating and storing the transitions from the old and new position of the resizeCenter
			this.data('resizeCenter', [centerX*scales[0], centerY*scales[1]]);
            dx = centerX*(scales[0]-1);
            dy = centerY*(scales[1]-1);
			// the rotationCenter also should be corrected
            var rotationCenter = this.data('rotationCenter');
            if (rotationCenter) {
                var rotationCenter = [rotationCenter[0]*scales[0], rotationCenter[1]*scales[1]];
                this.data('rotationCenter', rotationCenter);
            }
            // saving the value of the correction for using it in subsequent rotations
            var prevTranslation = $(this).data('resizeTranslation')
			if (prevTranslation) {
				var cumulatedTranslation = [dx+prevTranslation[0], dy+prevTranslation[1]];
			} else {
				var cumulatedTranslation = [dx, dy];
			} 
            this.data('resizeTranslation', cumulatedTranslation);           
            //trace("New translation> " + dx + " " + dy);
            //trace("Cumulated translation> " + cumulatedTranslation[0] + " " + cumulatedTranslation[1]);			
            this.css('left', -cumulatedTranslation[0]);
            this.css('top', -cumulatedTranslation[1]);
            // restoring rotateControl
            if (hadRotateControl) {
                this.attachRotateControl(this.data("rotateControlOptions"));
            }
            
			var resizeControl = this.data("resizeControl");
            if (resizeControl) {
               resizeControl.data("arrange").call(resizeControl);
               resizeControl.data("followHost").call(resizeControl);			   
            }
			
			// we return the scales
			return scales;
        }
	},
	
	/*localToGlobal: function(position) {
		var rotation = this.css('rotate');
        if (!(rotationCenter = this.data('rotationCenter'))) {
           var rotationCenter = [this.width()/2, this.height()/2];  
           this.data('rotationCenter',rotationCenter);
        }	
	   // the location of the position (P) in the rotation center-based (RCS) 
       var x = position.left-width/2;
       var y = centerY-height/2;
       // the new coordinates
       var x_ = x*Math.cos(angleRad) - y*Math.sin(angleRad);
       var y_ = x*Math.sin(angleRad) + y*Math.cos(angleRad);
       //trace("GCS based coordinates> "+x+" "+y+" "+x_+" "+y_);
       var x = centerX-width/2;
       var y = centerY-height/2;
       // the new coordinates
       var x_ = x*Math.cos(angleRad) - y*Math.sin(angleRad);
       var y_ = x*Math.sin(angleRad) + y*Math.cos(angleRad);

		var baseOffset = this.offset();
	},*/
	
    rotate: function(angle){
	   angle%=360;
       var rotationCenter = this.data('rotationCenter');
	   if (!(rotationCenter)) {
	       var rotationCenter = [this.width()/2, this.height()/2]; 	
	       this.data('rotationCenter',rotationCenter);
		   this.css("position", "absolute");
	   }
       this.rotateAround(rotationCenter[0], rotationCenter[1], angle);
    },

    resize: function(newWidth, newHeight) {
       if (!isNaN(newWidth) && !isNaN(newHeight) && newWidth > 1 && newHeight > 1) {
	   	var resizeCenter = this.data('resizeCenter');
	   	if (!(resizeCenter)) {
	   		var resizeCenter = [this.width() / 2, this.height() / 2];
	   		this.data('resizeCenter', resizeCenter);
	   		this.css("position", "absolute");
	   	}
	   	this.resizeAround(resizeCenter[0], resizeCenter[1], newWidth, newHeight);
	   }
		
	},
	
    setRotationCenter: function(xC, yC) {
       this.data('rotationCenter', [xC,yC]);
    },
        
    setResizeCenter: function(xC, yC) {
       this.data('resizeCenter', [xC,yC]);
    },
    
	attachRotateControl: function (options) {
        // preserve options for refreshing
        this.data("rotateControlOptions", options);
        if (!this.data("rotateControl")) {
            this.css("position", "absolute")
            var options = options || {};
            // length of the stick 
            var stickLength = (isNaN(options.stickLength)) ? 10 : options.stickLength;
            // size of the knob
            var knobSize = (isNaN(options.knobSize)) ? 10 : options.knobSize;
            // to which side the control is attached to
            var orientation = (!options.orientation) ? "rigth" : options.orientation;
            
            if (!(rotationCenter = this.data('rotationCenter'))) {
                var rotationCenter = [this.width() / 2, this.height() / 2];
                this.data('rotationCenter', rotationCenter);
            }
            
            switch (orientation) {
                case "top":
                    var angleOffset = -90;
                    var distance = rotationCenter[1];
                    
                    break;
                case "left":
                    var angleOffset = 180;
                    var distance = rotationCenter[0];
                    
                    break;
                case "bottom":
                    var angleOffset = 90;
                    var distance = this.height() - rotationCenter[1];
                    
                    break;
                case "right":
                default:
                    var angleOffset = 0;
                    var distance = this.width() - rotationCenter[0];
            }
            
            switch (options.color) {
                case "blue":
                    var fillColor = "#bbf";
                    var strokeColor = "#00f";
                    break;
                case "red":
                    var fillColor = "#fbb";
                    var strokeColor = "#f00";
                    break;
                case "orange":
                    var fillColor = "#ffb";
                    var strokeColor = "#ff6600";
                    break;
                default:
                    var fillColor = "#3f6";
                    var strokeColor = "#090";
            }
            
            // creating control widget elements
            var rotateControlKnob = $("<canvas/>", {
				"title": "Grab to rotate",
                "style": "position:absolute; cursor: crosshair;",
                "mousedown": function(e){
                    var target = $(this);
                    window.beingRotated = target;
                    e.stopPropagation();
                    //trace("Rotation started...");
                    host = target.data("host");
                    var angle =  host.css("rotate");
                    
                    if (angle < 0) angle = 360+angle;
                    
                    target.data("startAngle", angle);

			        var rotateStart = target.data("rotateStart"); 
			        if (rotateStart) {
			            rotateStart.call(host, angle);
			        }
                    
                },
            
            });
            
            var rotateControlStick = $("<canvas/>", {
                "style": "position:absolute;",
            
            });
            var rotateControlWrapper = $("<div/>", {
                "class": "control rotate",
                "style": "position:absolute;"
            });
            
            // setting up control knob
            rotateControlKnob[0].height = knobSize;
            rotateControlKnob[0].width = knobSize;
            
            if (rotateControlKnob[0].getContext) {
                var cxt = rotateControlKnob[0].getContext('2d');
                cxt.fillStyle = fillColor;
                cxt.strokeStyle = strokeColor;
                cxt.circle(knobSize/2, knobSize/2, knobSize/2 - 1, true);
                cxt.stroke();
                cxt.fill();
            }
            
            // setting up control "stick"
            
            rotateControlStick[0].height = knobSize;
            rotateControlStick[0].width = stickLength + distance;
            
            if (rotateControlStick[0].getContext) {
                var cxt = rotateControlStick[0].getContext('2d');
                cxt.strokeStyle = strokeColor;
                cxt.moveTo(0, knobSize/2);
                cxt.lineTo(distance + stickLength, knobSize/2);
                cxt.stroke();
            }
            
            // adding elements to wrapper
            
            rotateControlKnob.css("top", -knobSize/2);
            rotateControlKnob.css("left", distance + stickLength);
            rotateControlStick.css("top", -knobSize/2);
            rotateControlStick.css("left", 0);
            
            rotateControlStick.appendTo(rotateControlWrapper);
            rotateControlKnob.appendTo(rotateControlWrapper);
                       
            rotateControlWrapper.setRotationCenter(0, 0);
            
            this.before(rotateControlWrapper);
            
            var followHost = function(){
                var host = this.data("host");
                var rotationCenter = host.data('rotationCenter');
                var resizeTranslation = host.data('resizeTranslation');
				if (!resizeTranslation) resizeTranslation = [0,0];
				//trace("resizeTranslation> "+resizeTranslation[0]+" "+resizeTranslation[1]);
                this.css("left", rotationCenter[0]-resizeTranslation[0]);
                this.css("top", rotationCenter[1]-resizeTranslation[1]);
                var angle = Number(host.css('rotate')) + this.data("angleOffset");
                this.rotate(angle);
            }
            
            rotateControlKnob.data({
                "wrapper": rotateControlWrapper,
                "host": this,
                "rotateStart": options.rotateStart,
                "rotateStop": options.rotateStop,
                "rotateChange": options.rotateChange,
            });
            rotateControlWrapper.data({
                "host": this,
                "angleOffset": angleOffset,
                "followHost": followHost
            });
            
            this.data("rotateControl", rotateControlWrapper);
            
            followHost.call(rotateControlWrapper);
        }
    },
	
    attachResizeControl: function (options) {
        // preserve options for refreshing
        this.data("resizeControlOptions", options);
        if (!this.data("resizeControl")) {
            this.css("position", "absolute")
            var options = options || {};
            // size of the knob
            var knobSize = (isNaN(options.knobSize)) ? 10 : options.knobSize;
				
            switch (options.color) {
                case "blue":
                    var fillColor = "#bbf";
                    var strokeColor = "#00f";
                    break;
                case "red":
                    var fillColor = "#fbb";
                    var strokeColor = "#f00";
                    break;
                case "orange":
                    var fillColor = "#ffb";
                    var strokeColor = "#ff6600";
                    break;
                default:
                    var fillColor = "#3f6";
                    var strokeColor = "#090";
            }
            			
            // creating control widget elements
            var resizeControlKnob0 = $("<canvas/>", {
                "title": "Grab to resize",
                "style": "position:absolute; cursor: crosshair;",
                
            });
			
            resizeControlKnob0[0].height = knobSize;
            resizeControlKnob0[0].width = knobSize;
           
		    resizeControlKnob1 = resizeControlKnob0.clone();
            resizeControlKnob2 = resizeControlKnob0.clone();
		    resizeControlKnob3 = resizeControlKnob0.clone();
			
            var resizeControlWrapper = $("<div/>", {
                "class": "control resize",
                "style": "position:absolute;"
            });
			
            // drawing control knobs            
            // topright
            if (resizeControlKnob0[0].getContext) {
                var cxt = resizeControlKnob0[0].getContext('2d');
                cxt.fillStyle = fillColor;
                cxt.strokeStyle = strokeColor;
                cxt.moveTo(0,0);
                cxt.lineTo(0, knobSize);
                cxt.lineTo(knobSize, knobSize);
                cxt.closePath();
                cxt.fill();
            }
			
            // bottomright
            if (resizeControlKnob1[0].getContext) {
                var cxt = resizeControlKnob1[0].getContext('2d');
                cxt.fillStyle = fillColor;
                cxt.strokeStyle = strokeColor;
                cxt.moveTo(0,knobSize);
                cxt.lineTo(0, 0);
                cxt.lineTo(knobSize, 0);
                cxt.closePath();
                cxt.fill();
            }
			
            // bottomleft
            if (resizeControlKnob2[0].getContext) {
                var cxt = resizeControlKnob2[0].getContext('2d');
                cxt.fillStyle = fillColor;
                cxt.strokeStyle = strokeColor;
                cxt.moveTo(0,0);
                cxt.lineTo(knobSize,0);
                cxt.lineTo(knobSize, knobSize);
                cxt.closePath();
                cxt.fill();
            }
			
            // topleft
            if (resizeControlKnob3[0].getContext) {
                var cxt = resizeControlKnob3[0].getContext('2d');
                cxt.fillStyle = fillColor;
                cxt.strokeStyle = strokeColor;
                cxt.moveTo(0,knobSize);
                cxt.lineTo(knobSize, knobSize);
                cxt.lineTo(knobSize, 0);
                cxt.closePath();
                cxt.fill();
            }
			
            // adding elements to wrapper
            resizeControlKnob0.appendTo(resizeControlWrapper);
            resizeControlKnob1.appendTo(resizeControlWrapper);
            resizeControlKnob2.appendTo(resizeControlWrapper);
            resizeControlKnob3.appendTo(resizeControlWrapper);
            
			var on_mouseDown = function(e){
                    var target = $(this);
                    window.beingResized = target;
                    e.stopPropagation();
					window.resizeMouseOldPosition = [e.pageX, e.pageY];
                    //trace("Resize started...");

                    host = target.data("host");
                    var size = {width: host.width(), height: host.height()};
                    host.data("startSize", size);

			        var resizeStart = target.data("resizeStart"); 
			        if (resizeStart) {
			            resizeStart.call(host, size);
			        }
             };
			 
            resizeControlKnob0.bind('mousedown', on_mouseDown);
            resizeControlKnob1.bind('mousedown', on_mouseDown);
            resizeControlKnob2.bind('mousedown', on_mouseDown);
            resizeControlKnob3.bind('mousedown', on_mouseDown);

            var rotationCenter = this.data("rotationCenter") || [0,0];
			resizeControlWrapper.setRotationCenter(rotationCenter[0], rotationCenter[1]);
            
            this.before(resizeControlWrapper);
            
            resizeControlKnob0.data("type", "topright");
            resizeControlKnob1.data("type", "bottomright");
            resizeControlKnob2.data("type", "bottomleft");
            resizeControlKnob3.data("type", "topleft");			
							
			var arrange = function () {
                var host = this.data("host");
                var controlWidth = host.width();
                var controlHeight = host.height();
		        this.width(controlWidth);
                this.height(controlHeight);            
				var knobSize = this.data("knobSize");
				
                resizeControlKnob0 = this.data("resizeControlKnob0");
                resizeControlKnob1 = this.data("resizeControlKnob1");
                resizeControlKnob2 = this.data("resizeControlKnob2");
                resizeControlKnob3 = this.data("resizeControlKnob3");
																
                resizeControlKnob0.css("left", controlWidth);
                resizeControlKnob0.css("top", -knobSize);

                resizeControlKnob1.css("left", controlWidth);
                resizeControlKnob1.css("top", controlHeight);
                resizeControlKnob2.css("left", -knobSize);
                resizeControlKnob2.css("top", controlHeight);
                resizeControlKnob3.css("left", -knobSize);
                resizeControlKnob3.css("top", -knobSize);
			}
			
            var followHost = function(){
                var host = this.data("host");
				//var position = [host.css("left"), host.css("top")];
                var knobSize = this.data("knobSize");
				var rotationCenter = host.data('rotationCenter');
                var resizeTranslation = host.data('resizeTranslation');
                if (!resizeTranslation) resizeTranslation = [0,0];
				//trace(resizeTranslation[0]+" "+resizeTranslation[1]);
                var angle = Number(host.css('rotate'));
                this.css("left", -resizeTranslation[0]);
                this.css("top", -resizeTranslation[1]);
                this.css("rotate",angle);
				
				//trace(position.left+" "+position.top);				
            }
            
            var knobData = {
                "wrapper": resizeControlWrapper,
                "host": this,
                "resizeStart": options.resizeStart,
                "resizeStop": options.resizeStop,
                "resizeChange": options.resizeChange,
            };
			
            resizeControlKnob0.data(knobData);
            resizeControlKnob1.data(knobData);
            resizeControlKnob2.data(knobData);
            resizeControlKnob3.data(knobData);
												
            resizeControlWrapper.data({
                "host": this,
                "followHost": followHost,
				"arrange": arrange,
				"knobSize": knobSize,
				"resizeControlKnob0": resizeControlKnob0,
                "resizeControlKnob1": resizeControlKnob1,
                "resizeControlKnob2": resizeControlKnob2,
                "resizeControlKnob3": resizeControlKnob3,												
            });
            
            this.data("resizeControl", resizeControlWrapper);
            
			arrange.call(resizeControlWrapper);   
            followHost.call(resizeControlWrapper);
        }
    },
	
    detachRotateControl: function(){
       var rotateControl = this.data("rotateControl");
       if (rotateControl) {
           rotateControl.remove();
           this.data("rotateControl", null);
       }
    },

    detachResizeControl: function(){
       var resizeControl = this.data("resizeControl");
       if (resizeControl) {
           resizeControl.remove();
           this.data("resizeControl", null);
       }
    }

});


// init

$(document).mousemove(function(e){
    var target;
    if (target = window.beingRotated) {
		var wrapper = target.data('wrapper');
		var offset = wrapper.offset();
		var mX = e.pageX - offset.left;
		var mY = e.pageY - offset.top;
		if (Math.abs(mX) > 1 && Math.abs(mY) > 1) {
			var angleOffset = wrapper.data("angleOffset");
			var newAngle = (mX < 0) ? 180 + (Math.atan(mY / mX) / Math.PI * 180 - angleOffset) : Math.atan(mY / mX) / Math.PI * 180 - angleOffset;
			var host = wrapper.data("host");
			var oldAngle = wrapper.data("host").css('rotate');

            if (oldAngle < 0) oldAngle = 360+oldAngle;
            if (newAngle < 0) newAngle = 360+newAngle;

	        var rotateChange = target.data("rotateChange"); 
	        if (rotateChange) {
	            if (rotateChange.call(host, oldAngle, newAngle)) {
                    if (host.data("forbiddenAngle")) {
                        host.data("forbiddenAngle", false);
                        host.removeClass("forbiddenRotationAngle");
                    }
                } else {
                    if (host.data("forbiddenAngle")!==true) {
                        host.data("forbiddenAngle", true);
                        host.addClass("forbiddenRotationAngle");
                    }
                }
	        } 
			host.rotate(newAngle);
		}
		
	} else if (target = window.beingResized) {
        var wrapper = target.data('wrapper');
		var angle = wrapper.css('rotate');
        // mouse move
		var mX = e.pageX - window.resizeMouseOldPosition[0];
        var mY = e.pageY - window.resizeMouseOldPosition[1];
		// let's calculate the X and Y projection of the mouseMove in the target's system
		var angleRad = angle*Math.PI/180;
		var cosA = Math.cos(angleRad);
		var sinA = Math.sin(angleRad);
		var mX_ = Math.round(cosA*mX+sinA*mY);
		var mY_ = Math.round(-sinA*mX+cosA*mY);
		var sign = [];
		switch (target.data("type")) {
            case "topright":
			     sign = [1,-1];
                 break;
            case "bottomright":
		         sign = [1,1];	
                 break;
            case "bottomleft":
                 sign = [-1,1];			
                 break;
            case "topleft":
                 sign = [-1,-1];			
                 break;
		}
		mX_ = sign[0]*mX_;
		mY_ = sign[1]*mY_;
        var host = wrapper.data("host"); 
        var oldSize = {width: host.width(), height: host.height()};
		//var newWidth = host.width()+mX_;
		//var newHeight = host.height()+mY_;
        var newSize = {width: oldSize.width+mX_, height: oldSize.height+mY_};
		//trace(newWidth+" "+newHeight);
        var resizeChange = target.data("resizeChange"); 
        if (resizeChange) {
            if (resizeChange.call(host, oldSize, newSize)) {
                if (host.data("forbiddenSize")) {
                    host.data("forbiddenSize", false);
                    host.removeClass("forbiddenSize");
                }
            } else {
                if (host.data("forbiddenSize")!==true) {
                    host.data("forbiddenSize", true);
                    host.addClass("forbiddenSize");
                }
            }
        } 

		host.resize(newSize.width, newSize.height);
		window.resizeMouseOldPosition = [e.pageX, e.pageY];
	}
});

$(document).mouseup(function(e){
    var target;
    if (target = window.beingRotated) {
        //trace("Rotation ended...");
        var host = target.data("host");
		var rotateStop = target.data("rotateStop"); 
        if (rotateStop) {
            var res = rotateStop.call(host, host.css("rotate"));
            if (!res) {
                host.rotate(target.data("startAngle"));
            }
        }

        if (host.data("forbiddenAngle")) {
            host.data("forbiddenAngle", false);
            host.removeClass("forbiddenRotationAngle");
        }

        window.beingRotated = null;
    } else if(target = window.beingResized) {
        //trace("Resize ended...");
        var host = target.data("host");
        var resizeStop = target.data("resizeStop");
        if (resizeStop) {
            var res = resizeStop.call(host, []);
            if (!res) {
                var startSize = host.data("startSize");
                host.resize(startSize.width, startSize.height); 
            }
        }

        if (host.data("forbiddenSize")) {
            host.data("forbiddenSize", false);
            host.removeClass("forbiddenSize");
        }
        
        window.beingResized = null;		
	}     
});
