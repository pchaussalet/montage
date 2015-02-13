/**
 * Defines the BitField class, that compactly stores multiple values as a short
 * series of bits.
 * @module montage/core/bitfield
 * @requires montage/core/core
 */



/*

Implementation with growth: https://github.com/fb55/bitfield/blob/master/index.js


http://stackoverflow.com/questions/3435693/create-a-large-bit-field

This is an extension to Matthew Crumley's post from 2010:

I took Matthew's code, added pre-allocation and compared it to typed array implementations.

This jsperf shows that Chrome is the fastest and sanest (I would expect Uint32Array to perform the fastest) and that IE only defined the interfaces but did not care to optimize typed arrays. The Firefox results are obscured because the console is flooded with warnings about how JSPerf "compiles" the test code.

enter image description here

("Other" is (my apparently very private) IE 11.)

Uint8Array Implementation

function BitField8(nSize) {
    var nBytes = Math.ceil(nSize/8) | 0;
    this.values = new Uint8Array(nBytes);
}

BitField8.prototype.get = function(i) {
    var index = (i / 8) | 0;
    var bit = i % 8;
    return (this.values[index] & (1 << bit)) !== 0;
};

BitField8.prototype.set = function(i) {
    var index = (i / 8) | 0;
    var bit = i % 8;
    this.values[index] |= 1 << bit;
};

BitField8.prototype.unset = function(i) {
    var index = (i / 8) | 0;
    var bit = i % 8;
    this.values[index] &= ~(1 << bit);
};
Uint32Array Implementation

function BitField32(nSize) {
    var nNumbers = Math.ceil(nSize/32) | 0;
    this.values = new Uint32Array(nNumbers);
}

BitField32.prototype.get = function(i) {
    var index = (i / 32) | 0;
    var bit = i % 32;
    return (this.values[index] & (1 << bit)) !== 0;
};

BitField32.prototype.set = function(i) {
    var index = (i / 32) | 0;
    var bit = i % 32;
    this.values[index] |= 1 << bit;
};

BitField32.prototype.unset = function(i) {
    var index = (i / 32) | 0;
    var bit = i % 32;
    this.values[index] &= ~(1 << bit);
};


//tests:

var bitfield = 0;
var flag1 = 2 << 1;
var flag2 = 2 << 2;
var flagmax = 2 << 10000;
bitfield |= flagmax
if (bitfield & flagmax) {
    doSomething();
}	

*/


var Montage = require("./core").Montage,
    deprecate = require("./deprecate");
/**
 * The BitField object compactly stores multiple values as a short series of
 * bits.
 * This implementation is limited to 32 fields.
 * @class BitField
 * @classdesc Compactly stores multiple values as a short series of bits.
 * @extends Montage
 */
var BitField = exports.BitField = Montage.specialize( /** @lends BitField */ {

    constructor: {
        value: function BitField() {
			this._fields = Object.create(null);
            //this.super();
        }
    },

    /**
     * Creates a new BitField object containing the fields provided in the
     * propertyDescriptor parameter.
     * @method
     * @param {Object} propertyDescriptor An object containing one or more
     * property name/value pairs.
     * Each pair is added to the new BitField.
     * @returns {Object} A new BitField object that contains fields described
     * by the property descriptor.
     * @example
     * var bitField = new BitField();
     * bitField = new BitField().initWithDescriptor({
     *     likes_golf: {
     *         value: false
     *     },
     *     likes_basketball: {
     *         value: true
     *     },
     *     likes_baseball: {
     *         value: false
     *     },
     * });
     */
    initWithDescriptor: {
        enumerable: false,
        value: function(propertyDescriptor) {
            var fieldName;
            this.reset();
            for (fieldName in propertyDescriptor) {
                this.setField(fieldName, propertyDescriptor[fieldName].value);
            }
            return this;
        }
    },

    /**
     * @method
     * @param {string} delegate The delegate to be initialized.
     * @returns itself
    */
    initWithDelegate: {
        enumerable: false,
        value: function(delegate) {
            this.reset();
            this.delegate = delegate;
            return this;
        }
    },

    addField: {
        enumerable: false,
        value: function(aFieldName, value) {
            deprecate.deprecationWarning('BitField.addField', 'BitField.setField');
            return this.setField(aFieldName, value);
        }
    },

    /**
     * Adds a new field to a BitField instance.
     * @method
     * @param {string} aFieldName The name of the field to add.
     * @param {Mixed} defaultValue The new field's default value.
     */
    setField: {
        enumerable: false,
        value: function(aFieldName, value) {
            if (!(aFieldName in this._fields)) {
	            if (this._fieldCount >= 32) {
	                throw "BitField 32 fields limit reached.";
	            }
	            //We try to recycle slots as limited to 32bits
	            this._trueValue += (this._fields[aFieldName] = this._constantsToReuse.length ? this._constantsToReuse.shift() : (1 << this._fieldCount));
	            Object.defineProperty(this, aFieldName, {
	                enumerable: true,
	                get: function() {
						    return (this._values[0] & this._fields[aFieldName]) !== 0;
	                },
	                set: function(value) {
	                    value ? (this._values[0] |= this._fields[aFieldName]) : (this._values[0] &= ~ (this._fields[aFieldName]));
	                    this.callDelegateMethod(this.value);
	                }
	            });
	            this._fieldCount++;

        	}
            //this[aFieldName] = value;
            value ? (this._values[0] |= this._fields[aFieldName]) : (this._values[0] &= ~ (this._fields[aFieldName]));
            this.callDelegateMethod(this.value);

            // if (!! value) {
            //     this[aFieldName] = true;
            // }
        }
    },

    /**
     * @method
     * @param {Array} aFieldName The aFieldName array.
     * @returns !table or table[aFieldName]
     */
    getField: {
        enumerable: false,
        value: function(aFieldName) {
 		    return (this._values[0] & this._fields[aFieldName]) !== 0;
           	//return this[aFieldName];
        }
    },

    _constantsToReuse: {
        enumerable: false,
        value: []
    },

    /**
     * Removes a field from the bitfield.
     * @method
     * @param {string} aFieldName The name of the field to remove.
     */
    removeField: {
        enumerable: false,
        value: function(aFieldName) {
            delete this[aFieldName];
            this._constantsToReuse.push(this._fields[aFieldName]);
            this._trueValue -= this._fields[aFieldName];
            delete this._fields[aFieldName];
        }
    },

    /**
     * The BitField object's delegate.
     * @type {Property}
     * @default null
     */
    _bitFieldDidBecomeTrue: {
        enumerable: false,
        value: "gateDidBecomeTrue"
    },
    _bitFieldDidBecomeFalse: {
        enumerable: false,
        value: "gateDidBecomeFalse"
    },
    _delegate: {
        enumerable: false,
        value: null
    },
    _delegateNoOp: {
        enumerable: false,
        value: function(){}
    },
    delegate: {
        enumerable: false,
        get: function() {
			return this._delegate;
		},
		set: function(value) {
			this._delegate = value;
			this._didBecomeTrueCallback = this._delegate[this.identifier ? (this.identifier+"DidBecomeTrue") : this._bitFieldDidBecomeTrue] || this._delegateNoOp;
			this._didBecomeFalseCallback = this._delegate[this.identifier ? (this.identifier+"DidBecomeFalse") : this._bitFieldDidBecomeFalse] || this._delegateNoOp;
		}
    },

    _didBecomeTrueCallback: {
        enumerable: false,
        value: null
    },
    _didBecomeFalseCallback: {
        enumerable: false,
        value: null
    },

    /**
     * @method
     * @returns Nothing
     */
    callDelegateMethod: {
        value: function(value) {
            if (this.delegate) {
                value 
				? this._didBecomeTrueCallback.call(this._delegate,this)
				:  this._didBecomeFalseCallback.call(this._delegate,this);
            }
        },
        enumerable: false
    },
    /**
     * @type {Function}
     * @default {number} 0
     */
    value: {
        enumerable: false,
        get: function() {
            return (this._values[0] === this._trueValue);
        }
    },

    _fieldCount: {
        enumerable: false,
        value: 0
    },

    _values: {
        enumerable: false,
        value: new Uint32Array(1)
    },


    _trueValue: {
        enumerable: false,
        value: 0
    },

    /**
     * @method
     */
    reset: {
        enumerable: false,
        value: function() {
            //this._values = 0x0;
		    this._values = new Uint32Array(1);

        }
    },

    _fields: {
        enumerable: false,
        value:null
    },

    /**
     * @method
     */
    toString: {
        value: function() {
            var fieldNames = this._fields,
                i,
                iField,
                result = "";
            for (i = 0; (iField = fieldNames[i]); i++) {
                result += iField + "[" + (this._values[0] & fieldNames[iField]) + "], ";
            }
            return result;
        }
    }

});

