/**
 * @module montage/ui/text.reel
 */
var Component = require("../component").Component;

/**
 * A Text component shows plain text. Any text can be safely displayed without
 * escaping, but the browser will treat all sequences of white space as a
 * single space.
 *
 * The text component replaces the inner DOM of its element with a TextNode and
 * it renders the [value]{@link Text#value} string in it.
 *
 * @class Text
 * @classdesc A component that displays a string of plain text.
 * @extends Component
 */
exports.Text = Component.specialize( /** @lends Text# */ {

    constructor: {
        value: function Text() {
            //this.super();
        }
    },

    hasTemplate: {
        value: false
    },

    canDraw: {
        value: function() {
            return true;
        }
    },

    _prepareCanDraw: {
        enumerable: false,
        value: function _prepareCanDraw() {
            //this.ownerComponent.canDrawGate.setField(this.uuid, true);
			this.canDrawGate.setField("componentTreeLoaded", true);
            
        }
    },

    shouldLoadComponentTree: {
        value: false
    },

	// _isComponentExpanded:  {
	//         value: true
	//     },

	// _isComponentTreeLoaded:  {
	//         value: true
	//     },

    _value: {
        value: null
    },

    /**
     * The string to be displayed. `null` is equivalent to the empty string.
     * @type {string}
     * @default null
     */
    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (this._value !== value) {
                this._value = value;
                this.needsDraw = true;
            }
        }
    },

    /**
     * An optional converter for transforming the `value` into the
     * corresponding rendered text.
     * Converters are called at time of draw.
     * @type {?Converter}
     * @default null
    */
    converter: {
        value: null
    },

    /**
     * The default string value assigned to the Text instance.
     * @type {string}
     * @default "" empty string
     */
    defaultValue: {
        value: ""
    },

    _valueNode: {
        value: null
    },

    _RANGE: {
        value: document.createRange()
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                var range = this._RANGE;
                range.selectNodeContents(this.element);
                range.deleteContents();
                this._valueNode = document.createTextNode("");
                range.insertNode(this._valueNode);
                this.element.classList.add("montage-Text");
            }
        }
    },

    draw: {
        value: function() {
            // get correct value
            var value = this._value, displayValue = (value || 0 === value ) ? value : this.defaultValue;

            if (this.converter) {
                displayValue = this.converter.convert(displayValue);
            }

            //push to DOM
            this._valueNode.data = displayValue;
        }
    }

});

