/**
 *
 * @author Naba Bana
 *
 * Object $xcng
 *
 * Defining namespace. It is the only global object.
 *
 */

if (!$.isFunction(window.$xcng)) { 
    window.$xcng = function () {}
}



// Property widgets

$xcng.widgets = {};


/*
 * This class renders a widgetlist. Can have a label.
 *
 */
$xcng.widgets.WidgetList = function(config) {
    $.extend(this, config);
}

$xcng.widgets.WidgetList.prototype = {
    id: null,
    mode: "INPUT",  // default mode
    containerElement: null,
    label: null,
    labelElement: null,
    quantities: null,
    propertyTypeDescriptors: null,
    propertyInstanceDescriptors: null,
    propertyWidgets: null,

    widgetsHolderTemplate:'<table cellspacing="0"><tbody></tbody></table>',
    widgetSkinTemplate: null,
    widgetLabelPostfix: null,

    widgetsHolder: null,
    onValueChange: null,
    onValueChange_ctx: null,

    renderPropertyWidgets: function() {
        if (this.propertyInstanceDescriptors) {
            
            if (!this.widgetsHolder) {
                this.widgetsHolder = $(this.widgetsHolderTemplate);
                this.widgetsHolder.attr('id', this.id);
                this.widgetsHolder.addClass('widgetsList');
                if (this.containerElement) {
                    
                    if (this.label) {
                        this.labelElement = $('<div/>', {
                            'class': 'widgetsListLabel',
                            text: this.label
                        });

                        this.labelElement.appendTo(this.containerElement);
                    }

                    this.widgetsHolder.appendTo(this.containerElement);
                }
            }
            
            this.removePropertyWidgets();
            this.propertyWidgets && this.propertyWidgets.length && this.removePropertyWidtgets();
    
            this.propertyWidgets = {};
            
            for (var i=0; i<this.propertyInstanceDescriptors.length; i++) {
                var d = this.propertyInstanceDescriptors[i];

                
                var widgetType = this.propertyTypeDescriptors[d.typeId].widget;
                
                //trace(widgetType);
                if ($.isFunction($xcng.widgets[widgetType])){
                    var widget = new  $xcng.widgets[widgetType](d, this.mode, this);
                    if (this.widgetSkinTemplate) widget.skinTemplate = this.widgetSkinTemplate;
                    if (this.widgetLabelPostfix) widget.labelPostfix = this.widgetLabelPostfix;
                    widget.renderTo(this.widgetsHolder);
                    if (i % 2 == 0) widget.skin.addClass('even');
                    widget.addEventListener("VALUE_CHANGED", function (e, args) {
                        if (e.host.onValueChange) {
                            var ctx = isSet(e.host.onValueChange_ctx) ? e.host.onValueChange_ctx : this;
                            e.host.onValueChange.call(ctx, args);
                        }
                    });
                    this.propertyWidgets[d.id]=widget;
                }
            }
        }
    },

    removePropertyWidgets: function() {
        if(this.propertyWidgets) {
            for (var i in this.propertyWidgets) {
                this.propertyWidgets[i].removeAllEventListeners("VALUE_CHANGED");
                this.propertyWidgets[i].remove();
            }

            this.propertyWidgets = null;
        }
    },
    

}


// Classes
//

/**
 * Class PropertyWidget
 *
 * Abstract class for various vidgets
 */
$xcng.widgets.PropertyWidget = function(propertyInstanceDescriptor, mode, host) {
    
    this.mode = mode;
    this.host = host;
    this.propertyInstanceDescriptor = propertyInstanceDescriptor;
    

    this.propertyTypeDescriptor = host.propertyTypeDescriptors[propertyInstanceDescriptor.typeId];

    if (this.propertyTypeDescriptor.quantityId) this.quantity = host.quantities[this.propertyTypeDescriptor.quantityId];

    $.extend(this, new EventDispatcher());    
}

$xcng.widgets.PropertyWidget.prototype = {
    quantity: null,
    propertyTypeDescriptor: null,
    propertyInstanceDescriptor: null,
    containerElement: null,
    skin: null,

    labelContainer: null,
    controlContainer: null,
    statusContainer: null,
    hintContainer: null,
    valueContainer: null,

    mode: "INPUT",  // default mode
    host: null,

    skinTemplate: '<tr><td class="labelContainer"></td><td class="valueContainer"><div class="controlContainer"/><div class="hintContainer"/></td></tr>',
    labelPostfix: "",

    renderTo: function(containerElement) {
        if (this.containerElement != containerElement) {
            this.containerElement = containerElement;
            this.render();
        }
    },

    render: function() {
        var propertyInstanceDescriptor = this.propertyInstanceDescriptor;
        var pLabel = this.propertyTypeDescriptor.label;
        var unit = propertyInstanceDescriptor.unit;
        var oldSkin;
        if (!this.skin) {
            this.skin = $(this.skinTemplate);
        } else {
            oldSkin = this.skin;
            this.skin = $(this.skinTemplate);            
        }
        this.skin.attr('id', propertyInstanceDescriptor.id+"_widget");
        this.skin.attr('title', this.propertyTypeDescriptor.description);
        this.skin.addClass('widgetSkin');        
        this.skin.addClass(this.mode);        
        
        this.labelContainer = this.skin.find('.labelContainer');
        this.labelContainer.text(pLabel+this.labelPostfix);

        this.valueContainer = this.skin.find('.valueContainer');

        this.controlContainer = this.skin.find('.controlContainer');
        this.statusContainer = this.skin.find('.statusContainer');

        if (!propertyInstanceDescriptor.valid) {
            this.skin.addClass('invalid');
        } else {
            this.skin.addClass('valid');
        }

        this.hintContainer = this.skin.find('.hintContainer');
        
        if (isSet(propertyInstanceDescriptor.hint)) {
            this.hintContainer.text(propertyInstanceDescriptor.hint);
        }

        this.skin.data('host', this);

        this.skin.keydown(function(e) {
            if (e.which == 8 || e.which == 46) {
                e.stopPropagation();
            }
        });

        if (this.containerElement) {
            this.controlContainer.empty();
            
            // should be implemented in children
            this.renderControl();
            
            if (oldSkin) {
                this.skin.insertBefore(oldSkin);
                oldSkin.remove();
            } else {
                this.skin.appendTo(this.containerElement);
            }
        }
    },

    enable: function() {
        // Override this in child classes
    },

    disable: function() {
        // Override this in child classes
    },

    // call this from skin
    _triggerChange: function() {
        this.dispatchEvent("VALUE_CHANGED", {id: this.propertyInstanceDescriptor.id, value: this.propertyInstanceDescriptor.value, unitId: this.propertyInstanceDescriptor.unitId});
    },

    remove: function() {
        this.skin.remove();
    }
}




/**
 * TextField widget
 */
$xcng.widgets.TextField = function(propertyInstanceDescriptor, mode, host) {
    $xcng.widgets.PropertyWidget.call(this, propertyInstanceDescriptor, mode, host);
    trace("TextField Widget for property ["+propertyInstanceDescriptor.id+"] created");
}

$xcng.widgets.TextField.prototype = {
    renderControl: function() {

        if (this.quantity && this.quantity.units) {

            var unitId;

            if (this.propertyInstanceDescriptor.unitId) {
                unitId = this.propertyInstanceDescriptor.unitId;
            } else if(this.quantity.baseUnit) {
                unitId = this.quantity.baseUnit;                            
            }

            var unit = this.quantity.units[unitId];                      
        }
        
        switch (this.mode) {
            case "INPUT":

                var unitE;
                if (unit) {

                    var options = [];

                    for (var i in this.quantity.units) {
                        options.push([i,this.quantity.units[i].symbol]);                        
                    }
                    
                    if (options.length == 1) {
                        unitE = $('<span/>', {
                            text: unit.symbol,
                            'class': 'unit '+this.quantity.id
                        });
                    } else {
                        var optionsHtml = "";
                        for (var i=0; i<options.length;i++) {
                            optionsHtml+='<option value="'+options[i][0]+'">'+options[i][1]+'</option>';
                        }
                        unitE = $('<select/>', {
                            html: optionsHtml,
                            disabled: this.propertyTypeDescriptor.readonly ? true : false,
                            'class': 'unit '+this.quantity.id,
                            change: function() {
                                var host = $(this).data('host');
                                host.propertyInstanceDescriptor.unitId = $(this).val();
                                host._triggerChange.call(host);
                            }
                            
                        });

                        unitE.data('host', this.host);
                    }
                }

                if (this.quantity) {
                
                    var inputHint;

                    var numericSettings = null;

                    if (this.quantity.isInteger && !this.quantity.isPositive) {
                        inputHint = "Integers only";
                    } else if (this.quantity.isInteger && this.quantity.isPositive) {
                        inputHint = "Non-negative integers only";                        
                    } else if (!this.quantity.isInteger && this.quantity.isPositive) {
                        inputHint = "Non-negative numbers only";                        
                    } else {
                        inputHint = "Numbers only";                        
                    }
                    
                    var inputE = $('<input/>', {
                        type: "text",
                        title: this.quantity ? inputHint : "",
                        value: this.propertyInstanceDescriptor.value,
                        'class': "propertyValue INPUT"+(this.quantity ? " numeric" : ""),
                        id: this.propertyInstanceDescriptor.id+"_input",
                        disabled: this.propertyTypeDescriptor.readonly ? true : false,
                    });
                    //inputE.numeric();
                    if (this.quantity.isInteger && !this.quantity.isPositive) {
                        inputE.numeric({ decimal: false}, function() { alert(inputHint); this.value = ""; this.focus(); });
                    } else if (this.quantity.isInteger && this.quantity.isPositive) {
                        inputE.numeric({ decimal: false, negative: false }, function() { alert(inputHint); this.value = ""; this.focus(); });
                    } else if (!this.quantity.isInteger && this.quantity.isPositive) {
                        inputE.numeric({ negative: false }, function() { alert(inputHint); this.value = ""; this.focus(); });
                    } else {
                        inputE.numeric({ }, function() { alert(inputHint); this.value = ""; this.focus(); });
                    }

                    inputE.change(function() {
                            var host = $(this).data('host');
                            host.propertyInstanceDescriptor.value = $(this).val();
                            host._triggerChange.call(host);
                        });


                    var control = inputE.after(unitE);

                    if (isSet(this.propertyTypeDescriptor.widgetParameters) && isSet(this.propertyTypeDescriptor.widgetParameters.width)) inputE.width(this.propertyTypeDescriptor.widgetParameters.width);
                
                } else {

                    var control = $('<input/>', {
                        type: "text",
                        title: this.quantity ? inputHint : "",
                        value: this.propertyInstanceDescriptor.value,
                        'class': "propertyValue TextField INPUT"+(this.quantity ? " numeric" : ""),
                        id: this.propertyInstanceDescriptor.id+"_input",
                        disabled: this.propertyTypeDescriptor.readonly ? true : false,
                        change: function() {
                            var host = $(this).data('host');
                            host.propertyInstanceDescriptor.value = $(this).val();
                            host._triggerChange.call(host);
                        }
                    });


                    if (isSet(this.propertyTypeDescriptor.widgetParameters) && isSet(this.propertyTypeDescriptor.widgetParameters.width)) control.width(this.propertyTypeDescriptor.widgetParameters.width);
                }
                
    
                break;
            
            case "DISPLAY":
                var unitE;
                if (unit) {
                        unitE = $('<span/>', {
                        text: unit.symbol,
                        'class': 'unit '+this.quantity.id
                    });
                }

                var control = $('<span/>', {
                    text: this.propertyInstanceDescriptor.value,
                    'class': "propertyValue TextField DISPLAY",
                }).add(unitE);
                

                if (isSet(this.propertyTypeDescriptor.widgetParameters) && isSet(this.propertyTypeDescriptor.widgetParameters.width)) control.width(this.propertyTypeDescriptor.widgetParameters.width);

                break;

        }
       

        control.data('host', this);
        
        this.controlContainer.append(control);

    }
}

$.extend($xcng.widgets.TextField.prototype, $xcng.widgets.PropertyWidget.prototype);


/**
 * DropDown widget
 */
$xcng.widgets.DropDown = function(propertyInstanceDescriptor, mode, host) {
    $xcng.widgets.PropertyWidget.call(this, propertyInstanceDescriptor, mode, host);
    trace("DropDown Widget for property ["+propertyInstanceDescriptor.id+"] created");
}

$xcng.widgets.DropDown.prototype = {
    renderControl: function() {
        switch (this.mode) {
            case "INPUT":
                var control = $('<select/>', {
                    'class': "propertyValue Select INPUT",
                    id: this.propertyInstanceDescriptor.id+"_input",
                    disabled: this.propertyTypeDescriptor.readonly ? true : false,
                    change: function() {
                        var host = $(this).data('host');
                        host.propertyInstanceDescriptor.value = $(this).val();
                        host._triggerChange.call(host);
                    }
                });

                var multiple = this.propertyTypeDescriptor.multiple;
                if (multiple) {

                    control.attr('multiple', 'multiple');

                    for (var i in this.propertyTypeDescriptor.possibleValues) {
                        var index = this.propertyInstanceDescriptor.value.indexOf(i);

                        control.append('<option'+( index > -1 ? ' selected="selected"': '')+' value="'+i+'" >'+this.propertyTypeDescriptor.possibleValues[i]+'</option>');
                    }

                } else {
                   
                    for (var i  in this.propertyTypeDescriptor.possibleValues) {
                        control.append('<option'+(i==this.propertyInstanceDescriptor.value ? ' selected="selected"': '')+' value="'+i+'" >'+this.propertyTypeDescriptor.possibleValues[i]+'</option>');
                    }

                }

                if (isSet(this.propertyTypeDescriptor.widgetParameters) && isSet(this.propertyTypeDescriptor.widgetParameters.rows)) {
                    control.attr('size', this.propertyTypeDescriptor.widgetParameters.rows);
                }

                break;
            
            case "DISPLAY":

                var value = this.propertyInstanceDescriptor.value;
                var control = $('<span/>', {
                    text: $.isArray(value) ? value.join(', ') : value,
                    'class': "propertyValue Select DISPLAY",
                });

                break;

        }
        
        if (isSet(this.propertyTypeDescriptor.widgetParameters) && isSet(this.propertyTypeDescriptor.widgetParameters.width)) control.width(this.propertyTypeDescriptor.widgetParameters.width);

        control.data('host', this);

        this.controlContainer.append(control);

    }
}

$.extend($xcng.widgets.DropDown.prototype, $xcng.widgets.PropertyWidget.prototype);

/**
 * TBrowser widget
 */
$xcng.widgets.TBrowser = function(propertyInstanceDescriptor, mode, host) {
    $xcng.widgets.PropertyWidget.call(this, propertyInstanceDescriptor, mode, host);
    trace("TBrowser Widget for property ["+propertyInstanceDescriptor.id+"] created");
}

$xcng.widgets.TBrowser.prototype = {
    control: null,
    renderControl: function() {
        switch (this.mode) {
            case "INPUT":
                var control = $('<div/>', {
                    'class': "propertyValue Taxon INPUT",
                    id: this.propertyInstanceDescriptor.id+"_input",
                    title: "Click to browse taxonomy"
                });
                   
                if (this.propertyTypeDescriptor.readonly) {
                    control.addClass('disabled');
                    control.text(this.propertyInstanceDescriptor.value.label+" [+]");   
                } else {
                    control.text(this.propertyInstanceDescriptor.value.label+" [+]");
                    control.addClass('enabled');
                    control.click(function() {
                        var host = $(this).data('host');
                        host.on_click.call(host);
                    });

                }

                break;
            
            case "DISPLAY":
                var control = $('<span/>', {
                    text: this.propertyInstanceDescriptor.value.label,
                    'class': "propertyValue Taxon DISPLAY",
                });

                break;

        }

        control.data('host', this);
        this.controlContainer.append(control);
        this.control = control;
    },

    on_click: function() {
        $xcng.tx.GetTaxonomy(this.propertyInstanceDescriptor.taxonomyId, this.openTBRowserPanelForTaxonomy, this);
    },
    
    openTBRowserPanelForTaxonomy: function(taxonomy) {
        $xcng.ShowTBrowserPanel("Selecting a value for <i>"+this.propertyInstanceDescriptor.value.label+"</i>",  taxonomy, [this.propertyInstanceDescriptor.value.id], this.setValueFromBrowser, this);
    },

    setValueFromBrowser: function(value) {
        if (value) {
            oldId = this.propertyInstanceDescriptor.value.id;
            this.propertyInstanceDescriptor.value = {id: value[0].id, label: value[0].label}
            this.control.text(this.propertyInstanceDescriptor.value.label+" [+]");
            
            if (oldId != this.propertyInstanceDescriptor.value.id){
                this._triggerChange();
            }
        }
        $xcng.KillTBrowserPanel();
    }
}

$.extend($xcng.widgets.TBrowser.prototype, $xcng.widgets.PropertyWidget.prototype);


/**
 * CheckBox widget
 */
$xcng.widgets.CheckBox = function(propertyInstanceDescriptor, mode, host) {
    $xcng.widgets.PropertyWidget.call(this, propertyInstanceDescriptor, mode, host);
    trace("CheckBox Widget for property ["+propertyInstanceDescriptor.id+"] created");
}

$xcng.widgets.CheckBox.prototype = {
    renderControl: function() {
        switch (this.mode) {
            case "INPUT":
                var control = $('<input/>', {
                    type: 'checkbox',
                    value: this.propertyInstanceDescriptor.value,
                    'class': "propertyValue CheckBox INPUT",
                    id: this.propertyInstanceDescriptor.id+"_input",
                    disabled: this.propertyTypeDescriptor.readonly ? true : false,
                    change: function() {
                        var host = $(this).data('host');
                        host.propertyInstanceDescriptor.value = (this.checked) ? "checked" : "unchecked";
                        host._triggerChange.call(host);
                    }
                });

                control.attr('checked', this.propertyInstanceDescriptor.value == "checked" ? true:false );

                break;
            
            case "DISPLAY":

                var control = $('<input/>', {
                    type: 'checkbox',
                    value: this.propertyInstanceDescriptor.value,
                    'class': "propertyValue CheckBox DISPLAY",
                    id: this.propertyInstanceDescriptor.id+"_input",
                    disabled: true,
                });

                control.attr('checked', this.propertyInstanceDescriptor.value);
                
                break;

        }
        
        if (isSet(this.propertyTypeDescriptor.widgetParameters) && isSet(this.propertyTypeDescriptor.widgetParameters.width)) control.width(this.propertyTypeDescriptor.widgetParameters.width);

        control.data('host', this);

        this.controlContainer.append(control);

    }
}

$.extend($xcng.widgets.CheckBox.prototype, $xcng.widgets.PropertyWidget.prototype);

/**
 * TextArea widget
 */
$xcng.widgets.TextArea = function(propertyInstanceDescriptor, mode, host) {
    $xcng.widgets.PropertyWidget.call(this, propertyInstanceDescriptor, mode, host);
    trace("TextArea Widget for property ["+propertyInstanceDescriptor.id+"] created");
}

$xcng.widgets.TextArea.prototype = {
    renderControl: function() {
        switch (this.mode) {
            case "INPUT":
                var control = $('<textarea/>', {
                    text: this.propertyInstanceDescriptor.value,
                    'class': "propertyValue TextArea INPUT",
                    id: this.propertyInstanceDescriptor.id+"_input",
                    disabled: this.propertyTypeDescriptor.readonly ? true : false,
                    change: function() {
                        var host = $(this).data('host');
                        host.propertyInstanceDescriptor.value = $(this).val();
                        host._triggerChange.call(host);
                    }
                });

                control.attr('checked', this.propertyInstanceDescriptor.value);

                if (isSet(this.propertyTypeDescriptor.widgetParameters) && isSet(this.propertyTypeDescriptor.widgetParameters.cols)) control.attr('cols',this.propertyTypeDescriptor.widgetParameters.cols);
                if (isSet(this.propertyTypeDescriptor.widgetParameters) && isSet(this.propertyTypeDescriptor.widgetParameters.rows)) control.attr('rows', this.propertyTypeDescriptor.widgetParameters.rows);

                break;
            
            case "DISPLAY":

                var control = $('<span/>', {
                    text: this.propertyInstanceDescriptor.value,
                    'class': "propertyValue TextArea DISPLAY",
                    id: this.propertyInstanceDescriptor.id+"_input",
                });

                break;

        }
        
        control.data('host', this);

        this.controlContainer.append(control);

    }
}

$.extend($xcng.widgets.TextArea.prototype, $xcng.widgets.PropertyWidget.prototype);



