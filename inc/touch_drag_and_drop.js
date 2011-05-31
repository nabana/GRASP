$.extend($.support, {
        touch: typeof Touch == "object"
});

(function( $ ){
	$.fn.addTouch = function()
	{
	        return this.each(function(i,el){
	                        
	                //
	                // Hook up touch events
	                //
	
	                if ($.support.touch) {
	                       // el.addEventListener("touchstart", iPadTouchHandler, false);
	                        el.addEventListener("touchmove", iPadTouchHandler, false);
	                        el.addEventListener("touchend", iPadTouchHandler, false);
	                        el.addEventListener("touchcancel", iPadTouchHandler, false);
	                }
	
			});
	};
})( jQuery );

var lastTap = null;
