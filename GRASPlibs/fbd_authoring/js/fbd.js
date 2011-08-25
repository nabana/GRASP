// custom js for the library

window.$fbd={};

$fbd.positionVectorLabel = function (angle) {
    var label = this.skinParts.label;
    if (angle > 180 || angle < 0) {
	    label.css("top", 20);	
    } else {
        label.css("top", -20);
    }

}

$fbd.positionCoupleLabel = function (angle) {
    var label = this.skinParts.label;
    var w = this.skinParts.label.width();
    label.css("left", -w/2+3);	
}
