/**
 * @module montage/core/core
 */

require("collections/shim");
require("./shim/object");
require("./shim/array");
require("./extras/object");
require("./extras/date");
require("./extras/element");
require("./extras/function");
require("./extras/regexp");
require("./extras/string");

var Map = require("collections/map");
var ATTRIBUTE_PROPERTIES = "AttributeProperties",
    UNDERSCORE = "_",
    PROTO = "__proto__",
    VALUE = "value",
    ENUMERABLE = "enumerable",
    DISTINCT = "distinct",
    SERIALIZABLE = "serializable",
    UNDERSCORE_UNICODE = 95,
    ARRAY_PROTOTYPE = Array.prototype,
    OBJECT_PROTOTYPE = Object.prototype,
    accessorPropertyDescriptor = {
        get: void 0,
        set: void 0,
        configurable: false,
        enumerable: false
    },
    valuePropertyDescriptor = {
        value: void 0,
        configurable: false,
        enumerable: false,
        writable: false
    };

    // Fix Function#name on browsers that do not support it (IE10):
    if (!Object.create.name) {
        var fnNamePrefixRegex = /^[\S\s]*?function\s*/;
        var fnNameSuffixRegex = /[\s\(\/][\S\s]+$/;

        function _name() {
          var name = "";
          if (this === Function || this === Function.prototype.constructor) {
            name = "Function";
          }
          else if (this !== Function.prototype) {
            name = ("" + this).replace(fnNamePrefixRegex, "").replace(fnNameSuffixRegex, "");
          }
          return name;
        }

        Object.defineProperty(Function.prototype, 'name', {
            get: _name
        });
    }

/**
 * The Montage constructor provides conveniences for sub-typing
 * ([specialize]{@link Montage.specialize}) and common methods for Montage
 * prototype chains.
 *
 * @class Montage
 * @classdesc The basis of all types using the MontageJS framework.
 */
var Montage = exports.Montage = function Montage() {};

var PROTO_IS_SUPPORTED = {}.__proto__ === Object.prototype;
var PROTO_PROPERTIES_BLACKLIST = {"_montage_metadata": 1, "__state__": 1, "_hasUserDefinedConstructor": 1};

Montage.defineValueProperty = function Montage_defineValueProperty(object, propertyName, value, configurable, enumerable, writable) {
    Montage_defineValueProperty.template.value = value;
    Montage_defineValueProperty.template.configurable = configurable;
    Montage_defineValueProperty.template.enumerable = enumerable;
    Montage_defineValueProperty.template.writable = writable;

    this.defineProperty(object, propertyName, Montage_defineValueProperty.template);
}
Montage.defineValueProperty.template = valuePropertyDescriptor;
Montage.defineAccessorProperty = function Montage_defineAccessorProperty(object, propertyName, get, set, configurable, enumerable) {
    Montage_defineAccessorProperty.template.get = get;
    Montage_defineAccessorProperty.template.set = set;
    Montage_defineAccessorProperty.template.configurable = configurable;
    Montage_defineAccessorProperty.template.enumerable = enumerable;

    this.defineProperty(object, propertyName, Montage_defineValueProperty.template);
}
Montage.defineAccessorProperty.template = accessorPropertyDescriptor;


valuePropertyDescriptor.value = false;
Object.defineProperty(Montage, "_hasUserDefinedConstructor", valuePropertyDescriptor);

/**
 * Customizes a type with idiomatic JavaScript constructor and prototype
 * inheritance, using ECMAScript 5 property descriptors with customizations
 * for common usage in MontageJS.
 *
 * See {@link Montage.defineProperty}
 * @function Montage.specialize
 * @param {Object} prototypeProperties a object mapping property names to
 * customized Montage property descriptors, to be applied to the new
 * prototype
 * @param {?Object} constructorProperties a object mapping property names to
 * customized Montage property descriptors, to be applied to the new
 * constructor
 * @returns {function} a constructor function for the new type, which
 * derrives prototypically from `this`, with a prototype that inherits
 * `this.prototype`, with the given property descriptors applied.
 */

valuePropertyDescriptor.value = function specialize(prototypeProperties, constructorProperties) {
        var constructor, prototype, names, propertyName, property, i, length,
            // check if this constructor has Montage capabilities
            parent = this,
            foreignParent = typeof this.specialize === "undefined";

        prototypeProperties = prototypeProperties || Object.empty;
        constructorProperties = constructorProperties || Object.empty;

        if (prototypeProperties.constructor && prototypeProperties.constructor.value) {
            constructor = prototypeProperties.constructor.value;
            constructor._hasUserDefinedConstructor = true;

        } else {
            if (this._hasUserDefinedConstructor) {
                constructor = function Anonymous() {
                    return this.superForValue("constructor")() || this;
                    //return parent.apply(this, arguments) || this;
                };
            } else {
                constructor = function Anonymous() {
                    return this;
                }
            }
        }

        if (PROTO_IS_SUPPORTED) {
            constructor.__proto__ = parent;
        } else {
            names = Object.getOwnPropertyNames(parent);

            for (i = 0, length = names.length; i < length; i++) {
                propertyName = names[i];

                if (!(PROTO_PROPERTIES_BLACKLIST.hasOwnProperty(propertyName))) {
                    property = Object.getOwnPropertyDescriptor(constructor, propertyName);

                    if (!property || property.configurable) {
                        Montage.defineProperty(constructor, propertyName, Object.getOwnPropertyDescriptor(parent, propertyName));
                    }
                }
            }

            constructor.__constructorProto__ = parent;

            Montage.defineProperty(constructor, "isPrototypeOf", {
                value: function (object) {
                    var prototype;

                    while (object !== null) {
                        prototype = Object.getPrototypeOf(object);

                        if(prototype === this) {
                            return true;
                        }

                        object = prototype;
                    }

                    return false;
                },
                enumerable: false
            });
        }

        prototype = Object.create(this.prototype);

        if (foreignParent) {
            // give the constructor all the properties of Montage
            names = Object.getOwnPropertyNames(Montage);

            for (i = 0, length = names.length; i < length; i++) {
                propertyName = names[i];
                property = Object.getOwnPropertyDescriptor(constructor, propertyName);

                if (!property || property.configurable) {
                    Montage.defineProperty(constructor, propertyName, Object.getOwnPropertyDescriptor(Montage, propertyName));
                }
            }

            // give the prototype all the properties of Montage.prototype
            names = Object.getOwnPropertyNames(Montage.prototype);

            for (i = 0, length = names.length; i < length; i++) {
                propertyName = names[i];
                property = Object.getOwnPropertyDescriptor(constructor, propertyName);

                if (!property || property.configurable) {
                    Montage.defineProperty(prototype, propertyName, Object.getOwnPropertyDescriptor(Montage.prototype, propertyName));
                }
            }
        }

        if ("blueprint" in prototypeProperties) {
            Montage.defineProperty(constructor, "blueprint", prototypeProperties.blueprint);
        }

        if ("blueprintModuleId" in prototypeProperties) {
            Montage.defineProperty(constructor, "blueprintModuleId", prototypeProperties.blueprintModuleId);
        }

        Montage.defineProperties(prototype, prototypeProperties);

        // needs to be done afterwards so that it overrides any prototype properties
        Montage.defineProperties(constructor, constructorProperties);

        Montage.defineProperties(constructor, {
            __isConstructor__: {
                value: true,
                enumerable: false
            },

            _superCache: {
                value: new Map,
                enumerable: false
            }
        });

        constructor.prototype = prototype;

        Montage.defineValueProperty(prototype, "constructor",constructor,true,false,true );
        // Montage.defineProperty(prototype, "constructor", {
        //     value: constructor,
        //     enumerable: false
        // });

        // Super needs
        Montage.defineValueProperty(constructor, "constructor",constructor,true,false,true );
        // Montage.defineProperty(constructor, "constructor", {
        //     value: constructor,
        //     enumerable: false
        // });

        return constructor;

    };
valuePropertyDescriptor.writable = false;
valuePropertyDescriptor.configurable = true;
valuePropertyDescriptor.enumerable = false;
Object.defineProperty(Montage, "specialize", valuePropertyDescriptor);


if (!PROTO_IS_SUPPORTED) {
    // If the __proto__ property isn't supported than we need to patch up behavior for constructor functions
    var originalGetPrototypeOf = Object.getPrototypeOf;
    Object.getPrototypeOf = function getPrototypeOf(object) {
        if (typeof object === "function" && object.__constructorProto__) {
            // we have set the __constructorProto__ property of the function to be it's parent constructor
            return object.__constructorProto__;
        } else {
            return originalGetPrototypeOf.apply(Object, arguments);
        }
    };
}

/**
 * Defines a property on an object using a Montage property descriptor.
 * Montage property descriptors extend and slightly vary ECMAScript 5 property
 * descriptors.
 *
 *  - `value`
 *  - `get`
 *  - `set`
 *  - `enumerable` is `true` by default, but `false` if `value` is a function
 *  - `writable` is `true` by default, but `false` if the `name` begins with
 *    an underscore, `_`.
 *  - `configurable` is `true` by default
 *  - `distinct` is deprecated, but conveys the intention that the `value`
 *    should be duplicated for each instance, but the means of cloning is
 *    ill-defined and temperamental.
 *
 * @function Montage.defineProperty
 * @function Montage.defineProperty
 * @param {Object} object The object on which to define the property.
 * @param {string} name The name of the property to define, or modify.
 * @param {Object} descriptor A descriptor object that defines the properties
 * being defined or modified.
 * @example
 * Montage.defineProperty(Object.prototype, "_eventListenerDescriptors", {
 *     enumerable: true | false,
 *     serializable: "reference" | "value" | "auto" | false,
 *     value: null,
 *     writable: true | false
 * });
 */
valuePropertyDescriptor.writable = valuePropertyDescriptor.configurable = valuePropertyDescriptor.enumerable = false;
valuePropertyDescriptor.value = function Montage_defineProperty(obj, prop, descriptor) {
        if (! (typeof obj === "object" || typeof obj === "function") || obj === null) {
            throw new TypeError("Object must be an object, not '" + obj + "'");
        }

        var isValueDescriptor = (VALUE in descriptor);

        if (DISTINCT in descriptor && !isValueDescriptor) {
            throw new TypeError("Cannot use distinct attribute on non-value property '" + prop + "'");
        }


        //reset defaults appropriately for framework.
        if (PROTO in descriptor) {
            descriptor.__proto__ = (isValueDescriptor ? (typeof descriptor.value === "function" ? _defaultFunctionValueProperty : _defaultObjectValueProperty) : _defaultAccessorProperty);
        } else {
            var defaults;
            if (isValueDescriptor) {
                if (typeof descriptor.value === "function") {
                    defaults = _defaultFunctionValueProperty;
                } else {
                    defaults = _defaultObjectValueProperty;
                }
            } else {
                defaults = _defaultAccessorProperty;
            }
            for (var key in defaults) {
                if (!(key in descriptor)) {
                    descriptor[key] = defaults[key];
                }
            }
        }

        if (!descriptor.hasOwnProperty(ENUMERABLE) && prop.charCodeAt(0) === UNDERSCORE_UNICODE) {
            descriptor.enumerable = false;
        }
        if (!descriptor.hasOwnProperty(SERIALIZABLE)) {
            if (! descriptor.enumerable) {
                descriptor.serializable = false;
            } else if (descriptor.get && !descriptor.set) {
                descriptor.serializable = false;
            } else if (descriptor.writable === false) {
                descriptor.serializable = false;
            }
        }

        if (SERIALIZABLE in descriptor) {
            // get the _serializableAttributeProperties property or creates it through the entire chain if missing.
            getAttributeProperties(obj, SERIALIZABLE)[prop] = descriptor.serializable;
        }

        // clear the cache in any descendants that use this property for super()
        if (obj._superDependencies) {
            var superDependencies, i, j;

            if (typeof descriptor.value === "function") {
                var propValueKey = prop;
                    propValueKey += ".value"

                if ((superDependencies = obj._superDependencies[propValueKey])) {
                    for (i = 0, j = superDependencies.length; i < j; i++) {
                        superDependencies[i]._superCache.delete(propValueKey);
                    }
                }
            } else {
                var propGetKey = prop,
                    propSetKey = prop;

                    propGetKey += ".get";
                    propSetKey += ".set";

                if (typeof descriptor.get === "function" && (superDependencies = obj._superDependencies[propGetKey])) {
                    for (i = 0, j = superDependencies.length; i < j; i++) {
                        superDependencies[i]._superCache.delete(propGetKey);
                    }
                }

                if (typeof descriptor.set === "function" && (superDependencies = obj._superDependencies[propSetKey])) {
                    for (i = 0, j = superDependencies.length; i < j; i++) {
                        superDependencies[i]._superCache.delete(propSetKey);
                    }
                }
            }
        }
        return Object.defineProperty(obj, prop, descriptor);
    };
Object.defineProperty(Montage, "defineProperty", valuePropertyDescriptor);

/**
 * Defines one or more new properties to an object, or modifies existing
 * properties on the object.
 * @see {@link Montage.defineProperty}
 * @function Montage.defineProperties
 * @param {Object} object The object to which the properties are added.
 * @param {Object} properties An object that maps names to Montage property
 * descriptors.
 */
Object.defineProperty(Montage, "defineProperties", {value: function (obj, properties) {
    if (typeof properties !== "object" || properties === null) {
        throw new TypeError("Properties must be an object, not '" + properties + "'");
    }
    var propertyKeys = Object.getOwnPropertyNames(properties);
    for (var i = 0; (property = propertyKeys[i]); i++) {
        if ("_bindingDescriptors" !== property) {
            this.defineProperty(obj, property, properties[property]);
        }
    }
    return obj;
}});

var _defaultAccessorProperty = {
    enumerable: true,
    configurable: true,
    serializable: true
};
var _defaultObjectValueProperty = {
    writable: true,
    enumerable: true,
    configurable: true,
    serializable: "reference"
};
var _defaultFunctionValueProperty = {
    writable: true,
    enumerable: false,
    configurable: true
    /*,
    serializable: false
    */
};

var ObjectAttributeProperties = new Map();
function getAttributeProperties(proto, attributeName, privateAttributeName) {
    var attributePropertyName = privateAttributeName || (UNDERSCORE + attributeName + ATTRIBUTE_PROPERTIES);

        if(proto !== Object.prototype) {
            if (proto.hasOwnProperty(attributePropertyName)) {
                return proto[attributePropertyName];
            } else {
                return Object.defineProperty(proto, attributePropertyName, {
                    enumerable: false,
                    configurable: false,
                    writable: true,
                    value: Object.create(getAttributeProperties(Object.getPrototypeOf(proto), attributeName, attributePropertyName))
                })[attributePropertyName];
            }
        }
        else {
            if(!ObjectAttributeProperties.has(attributeName)) {
                ObjectAttributeProperties.set(attributeName,{});
            }
            return ObjectAttributeProperties.get(attributeName);
        }
}

Montage.defineProperty(Montage, "didCreate", {
    value: Function.noop
});

var getSuper = function (object, method) {
    var propertyNames, proto, i, propCount, propertyName, func, context, foundSuper, property;
    if (!(method._superPropertyName && method._superPropertyType)) {
        Montage.defineValueProperty(method, "_superPropertyType",null,true,false,true );
        Montage.defineValueProperty(method, "_superPropertyName",null,true,false,true );
        // Montage.defineProperty(method, "_superPropertyType", {value:null});
        // Montage.defineProperty(method, "_superPropertyName", {value:null});
        context = object;
        while (!foundSuper && context !== null) {
            propertyNames = Object.getOwnPropertyNames(context);
            proto = Object.getPrototypeOf(context);
            i = 0;
            propCount = propertyNames.length;
            for (i; i < propCount; i++) {
                propertyName = propertyNames[i];
                property = Object.getOwnPropertyDescriptor(context, propertyName);
                if ((func = property.value) != null) {
                    if (func === method || func.deprecatedFunction === method) {
                        method._superPropertyType = "value";
                        method._superPropertyName = propertyName;
                        foundSuper = true;
                        break;
                    }
                }
                if ((func = property.get) != null) {
                    if (func === method || func.deprecatedFunction === method) {
                        method._superPropertyType = "get";
                        method._superPropertyName = propertyName;
                        foundSuper = true;
                        break;
                    }
                }
                if ((func = property.set) != null) {
                    if (func === method || func.deprecatedFunction === method) {
                        method._superPropertyType = "set";
                        method._superPropertyName = propertyName;
                        foundSuper = true;
                        break;
                    }
                }
            }
            context = proto;
        }
    }
    return superForImplementation(object, method._superPropertyType, method._superPropertyName, method);
};


var superImplementation = function super_() {
    if (typeof superImplementation.caller !== "function") {
        throw new TypeError("Can't get super without caller. Use this.superForValue(methodName) if using strict mode.");
    }
    var superFunction = getSuper(this, superImplementation.caller);
    return typeof superFunction === "function" ? superFunction.bind(this) : Function.noop;
};

Montage.defineProperty(Montage, "_superContext", {
    value: null
});

var superForImplementation = function (object, propertyType, propertyName, method) {
    var superFunction, superObject, property, cacheObject, boundSuper,
        context = object,
        cacheId = propertyName + "." + propertyType;

    if (!object._superContext) {
        object._superContext = {};
    }
    // is there a super context for this call? I.e. does the super() call originate in an ancestor of object?
    // If so, we use that object as the starting point (context) when looking for the super method.
    if (object._superContext[cacheId]) {
        context = object._superContext[cacheId];
    } else {
        // find out where in the prototype chain the calling function belongs
        context = object;
        while (context !== null) {
            if (context.hasOwnProperty(propertyName)) {
                property = Object.getOwnPropertyDescriptor(context, propertyName);
                if (typeof property[propertyType] === "function") {
                    break;
                }
            }
            context = Object.getPrototypeOf(context);
        }
    }

    cacheObject = context.constructor;

    // is the super for this method in the cache?
    if (cacheObject._superCache && cacheObject._superCache.has(cacheId)) {
        boundSuper = (function (cacheId, object, superObject, superFunction) {
            return function () {
                object._superContext[cacheId] = superObject;
                var retVal = superFunction.apply(object, arguments);
                delete object._superContext[cacheId];
                return retVal;
            };
        })(cacheId, object, cacheObject._superCache.get(cacheId).owner, cacheObject._superCache.get(cacheId).func);
        return boundSuper;
    }

    // search the prototype chain for a parent that has a matching method
    superObject = context;
    while (typeof superFunction === "undefined" && (superObject = Object.getPrototypeOf(superObject))) {
        if (!superObject._superDependencies) {
            Montage.defineValueProperty(superObject, "_superDependencies",{},true,false,true );
            // Montage.defineProperty(superObject, "_superDependencies", {
            //     value: {}
            // });
        }
        if (!superObject._superDependencies[cacheId]) {
            superObject._superDependencies[cacheId] = [];
        }
        superObject._superDependencies[cacheId].push(cacheObject);
        property = Object.getOwnPropertyDescriptor(superObject, propertyName);
        if (property) {
            if ((typeof property[propertyType] === "function") && (property[propertyType] !== method)) {
                superFunction = property[propertyType];
                break;
            } else {
                // parent has property but not the right type
                break;
            }
        }
    }

    if (typeof superFunction === "function") {
        // we wrap the super method in a function that saves the context on the object
        // and immediately clears it again after the super has been called. This is needed
        // in case superFunction also calls superFor*() so superForImplementation() knows
        // which object owns the calling method.
        boundSuper = (function (cacheId, object, superObject, superFunction) {
            return function () {
                object._superContext[cacheId] = superObject;
                var retVal = superFunction.apply(object, arguments);
                delete object._superContext[cacheId];
                return retVal;
            };
        })(cacheId, object, superObject, superFunction);

        if (!cacheObject._superCache) {
            Montage.defineValueProperty(cacheObject, "_superCache",new Map,true,true,true );
            // Montage.defineProperty(cacheObject, "_superCache", {
            //     value: {}
            // });
        }

        // cache the super and the object we found it on
        cacheObject._superCache.set(cacheId,{
            func: superFunction,
            owner: superObject
        });
        return boundSuper;
    } else {
        return Function.noop;
    }
};

var superForValueImplementation = function (propertyName) {
    return superForImplementation(this, "value", propertyName, superForValueImplementation.caller);
};
var superForGetImplementation = function (propertyName) {
    return superForImplementation(this, "get", propertyName, superForGetImplementation.caller);
};
var superForSetImplementation = function (propertyName) {
    return superForImplementation(this, "set", propertyName, superForSetImplementation.caller);
};

/**
 * Calls the method with the same name as the caller from the parent of the
 * constructor that contains the caller, falling back to a no-op if no such
 * method exists.
 * @function Montage.super
 * @returns {function} this constructor’s parent constructor.
 */
Montage.defineProperty(Montage, "super", {
    get: superImplementation,
    enumerable: false
});

/**
 * Calls the method with the same name as the caller from the parent of the
 * prototype that contains the caller, falling back to a no-op if no such
 * method exists.
 */
Montage.defineProperty(Montage.prototype, "super", {
    get: superImplementation,
    enumerable: false
});

/**
 * Calls the method with the given name from the parent of the constructor that
 * contains the caller, falling backto no-op if no such method exists.
 * @param {string} name
 * @param ...arguments to forward to the parent method
 */
Montage.defineProperty(Montage, "superForValue", {
    value: superForValueImplementation,
    enumerable: false
});

/**
 * Calls the method with the given name from the parent of the prototype that
 * contains the caller, falling backto no-op if no such method exists.
 * @param {string} name
 * @param ...arguments to forward to the parent method
 */
Montage.defineProperty(Montage.prototype, "superForValue", {
    value: superForValueImplementation,
    enumerable: false
});

Montage.defineProperty(Montage, "superForGet", {
    value: superForGetImplementation,
    enumerable: false
});
Montage.defineProperty(Montage.prototype, "superForGet", {
    value: superForGetImplementation,
    enumerable: false
});

Montage.defineProperty(Montage, "superForSet", {
    value: superForSetImplementation,
    enumerable: false
});
Montage.defineProperty(Montage.prototype, "superForSet", {
    value: superForSetImplementation,
    enumerable: false
});

/**
 * Returns the names of serializable properties belonging to Montage object.
 * @function Montage.getSerializablePropertyNames
 * @param {Object} anObject A Montage object.
 * @returns {Array} An array containing the names of the serializable
 * properties belonging to `anObject`.
 */
Montage.defineProperty(Montage, "getSerializablePropertyNames", {value: function (anObject) {


    var propertyNames,
        attributes = getAttributeProperties(anObject, SERIALIZABLE);

    if (attributes) {
        propertyNames = []
        for (var name in attributes) {
            if (attributes[name]) {
                propertyNames.push(name);
            }
        }
        return propertyNames;
    }
    else {
        return Array.empty;
    }

}});

/**
    Returns the attribute of a property belonging to an object.
    @function Montage.getPropertyAttribute
    @param {Object} anObject A object.
    @param {string} propertyName The name of a property belonging to
    `anObject`.
    @param {string} attributeName The name of a property's attribute.
    @returns attributes array
*/
Montage.defineProperty(Montage, "getPropertyAttribute", {value: function (anObject, propertyName, attributeName) {
    var attributes = getAttributeProperties(anObject, attributeName);
    if (attributes) {
        return attributes[propertyName];
    }
}});

/**
    @function Montage.getPropertyAttributes
    @param {Object} anObject An object.
    @param {string} attributeName The attribute name.
    @returns {Object} TODO getPropertyAttributes returns description
*/
Montage.defineProperty(Montage, "getPropertyAttributes", {value: function (anObject, attributeName) {
    var attributes = getAttributeProperties(anObject, attributeName),
        attributeValues;

    if (!attributes) {
        return;
    }

    attributeValues = {};
    for (var name in attributes) {
        attributeValues[name] = attributes[name];
    }

    return attributeValues;
}});

var _instanceMetadataDescriptor = {
    isInstance: {value: true}
};

var _functionInstanceMetadataDescriptor = {
    objectName: {value: "Function"},
    isInstance: {value: true}
};

/**
 * Get the metadata Montage has on the given object.
 * @function Montage.getInfoForObject
 * @param {Object} object
 * @returns {Object} If the object was exported by a module, `property` is the
 * name it has on the exports object, `aliases` is an array of all other names
 * if there was more than one, `require` is the package it comes from, `module`
 * is the identifier for the module in that package, and `isInstance` discerns
 * constructors and prototypes from instances.
 */
Montage.defineProperty(Montage, "getInfoForObject", {
    value: function (object) {
        var metadata;
        var instanceMetadataDescriptor;

        //jshint -W106

        if (hasOwnProperty.call(object, "_montage_metadata") && object._montage_metadata) {
            return object._montage_metadata;
        } else {
            metadata = object._montage_metadata || (object.constructor && object.constructor._montage_metadata) || null;
            if (object.constructor === Function) {
                instanceMetadataDescriptor = _functionInstanceMetadataDescriptor;
            } else {
                instanceMetadataDescriptor = _instanceMetadataDescriptor;
            }

            // don't modify the Object prototype, because this will cause
            // future calls to Montage.getInfoForObject on objects without
            // their own _montage_metadata property to return this one
            if (object === Object.prototype) {
                return Object.create(metadata, instanceMetadataDescriptor);
            }

            try {
                //For Object instances we do _montage_metadata per instance
                if(object.constructor === Object) {
                    return Object.defineProperty(object, "_montage_metadata", {
                        enumerable: false,
                        // this object needs to be overriden by the SerializationCompiler because this particular code might be executed on an exported object before the Compiler takes action, for instance, if this function is called within the module definition itself (happens with __core__).
                        writable: true,
                        value: Object.create(metadata, instanceMetadataDescriptor)
                    })._montage_metadata;

                }
                //For everything else we go more efficient and declare the property only once per prototype
                else {
                    if(!hasOwnProperty.call(object.constructor.prototype, "_montage_metadata")) {
                        Object.defineProperty(object.constructor.prototype, "_montage_metadata", {
                            enumerable: false,
                            // this object needs to be overriden by the SerializationCompiler because this particular code might be executed on an exported object before the Compiler takes action, for instance, if this function is called within the module definition itself (happens with __core__).
                            writable: true,
                            value: undefined
                        });
                    }
                    return (object._montage_metadata = Object.create(metadata, instanceMetadataDescriptor)) || object._montage_metadata;
                }
            } catch(e) {
                // NOTE Safari (as of Version 5.0.2 (6533.18.5, r78685)
                // doesn't seem to allow redefining an existing property on a DOM Element
                return (object._montage_metadata = Object.create(metadata, instanceMetadataDescriptor));
            }
        }
        //jshint +W106
    }
});


var hasOwnProperty = Object.prototype.hasOwnProperty;


Montage.defineProperty(Montage, "identifier", {
    value: null,
    serializable: true
});
Montage.defineProperty(Montage.prototype, "identifier", {
    value: null,
    serializable: true
});

/**
 * Returns true if two objects are equal, otherwise returns false.
 * @function Montage#equals
 * @param {Object} anObject The object to compare for equality.
 * @returns {boolean} Returns `true` if the calling object and
 * `anObject` are identical and their `uuid` properties
 * are also equal. Otherwise, returns `false`.
 */
Montage.defineProperty(Montage.prototype, "equals", {
    value: function (anObject) {
        if (!anObject) return false;
        return this === anObject || (this.uuid && this.uuid === anObject.uuid);
    }
});

Montage.defineProperty(Montage, "equals", {
    value: Montage.prototype.equals
});

/**
 * This method calls the method named with the identifier prefix if it exists.
 * Example: If the name parameter is "shouldDoSomething" and the caller's identifier is "bob", then
 * this method will try and call "bobShouldDoSomething"
 * @function Montage#callDelegateMethod
 * @param {string} name
*/
Montage.defineProperty(Montage.prototype, "callDelegateMethod", {
    value: function (name) {
        var delegate = this.delegate, delegateFunction;

        if (delegate) {

            if ((typeof this.identifier === "string") && (typeof (delegateFunction = delegate[this.identifier + name.toCapitalized()]) === "function")) {}
            else if (typeof (delegateFunction = delegate[name]) === "function") {}

            if (delegateFunction) {
                if(arguments.length === 2) {
                    return delegateFunction.call(delegate,arguments[1]);
                }
                else if(arguments.length === 3) {
                    return delegateFunction.call(delegate,arguments[1],arguments[2]);
                }
                else if(arguments.length === 4) {
                    return delegateFunction.call(delegate,arguments[1],arguments[2],arguments[3]);
                }
                else if(arguments.length === 5) {
                    return delegateFunction.call(delegate,arguments[1],arguments[2],arguments[3],arguments[4]);
                }
                else {
                    // remove first argument
                    ARRAY_PROTOTYPE.shift.call(arguments);
                    return delegateFunction.apply(delegate, arguments);
                }
            }
        }
    }
});

// Property Changes

var PropertyChanges = require("collections/listen/property-changes");
Object.addEach(Montage, PropertyChanges.prototype);
Object.addEach(Montage.prototype, PropertyChanges.prototype);

/**
 * Adds a change listener for the named property of this instance.  The handler
 * may be a function or an object with a handler method.  When the property
 * changes on this object, the handler will be notified *on the stack*.
 *
 * The dispatcher will try to dispatch to *only* the most specific handler
 * method available, from `handle` + PropertyName (bactrian camel case) +
 * `Change`, to `handlePropertyChange`, or if the `beforeChange` flag is set,
 * `handle` + PropertyName + `WillChange` then `handlePropertyWillChange`.  The
 * arguments to the handler are `value`, `name`, and this.
 *
 * @function Montage#addOwnPropertyChangeListener
 * @param {string} name The name of the property to observe.
 * @param {object|function} handler On which to dispatch change notifications.
 * @param {boolean} beforeChange Whether to observer changes before they occur.
 * To avoid the boolean trap, try to use `addBeforeOwnPropertyChangeListener`
 * instead, unless `beforeChange` is truly variable.
 * @returns {function} `cancel`, useful for removing the change listener
 * without having to retain and reconstruct all of the arguments.
 * @see Montage#addBeforeOwnPropertyChangeListener
 */

/**
 * Cancels a change listener established with the same given parameters.  For
 * the meanings of the parameters, see `addOwnPropertyChangeListener`.
 * @see Montage#addOwnPropertyChangeListener
 * @function Montage#removeOwnPropertyChangeListener
 * @param {string} name
 * @param {object|function} handler
 * @param {boolean} beforeChange
 */

/**
 * Adds a listener that will be notified *before* a property changes.  See
 * `addOwnPropertyChangeListener` for details.
 * @see Montage#addOwnPropertyChangeListener
 * @function Montage#addBeforeOwnPropertyChangeListener
 * @param {string} name
 * @param {object|function} handler
 * @returns {function} cancel
 */

/**
 * Removes a change listener established by `addBeforeOwnPropertyChangeListener`
 * or `addOwnPropertyChangeListener` with the `beforeChange` flag.
 * Call with the same arguments used to set up the observer.
 * @see Montage#addOwnPropertyChangeListener
 * @see Montage#addBeforeOwnPropertyChangeListener
 * @function Montage#removeBeforeOwnPropertyChangeListener
 * @param {string} name
 * @param {object|function} handler
 */

/**
 * Produces the descriptor for a property change listener. The descriptor is an
 * object that will contain two arrays, `willChangeListeners` and
 * `changeListeners`. Each listener will be the `handler` given to establish
 * the change listener on `addOwnPropertyChangeListener` or
 * `addBeforeOwnPropertyChangeListener`.
 * @see Montage#addOwnPropertyChangeListener
 * @see Montage#addBeforeOwnPropertyChangeListener
 * @function Montage#getOwnPropertyChangeDescriptor
 * @param {string} name
 * @returns the property change descriptor for this name, created if necessary.
 */

/**
 * Manually dispatches a property change notification on this object.  This can
 * be useful if the property is a getter or setter and its value changes as a
 * side effect of some other operation, like cache invalidation. It is
 * unnecessary to dispatch a change notification in the setter of a property if
 * it modifies its own value, but if changing `celicius` has a side effect on
 * `fahrenheit`, they can manually dispatch changes to the other. Be sure
 * to dispatch both the change and before the change.
 * @function Montage#dispatchOwnPropertyChange
 * @param {string} name
 * @param value
 * @param {boolean} beforeChange Avoid the boolean trap and use
 * `dispatchBeforeOwnPropertyChange`. You are not likely to encounter a case
 * where `beforeChange` is a named variable.
 */

/**
 * Manually dispatches a notification that a property is about to change.
 * See `dispatchOwnPropertyChange`.
 * @see Montage#dispatchOwnPropertyChange
 * @function Montage#dispatchBeforeOwnPropertyChange
 * @param {string} name
 * @param value
 */

/**
 * An overridable method for ensuring that changes to the named property
 * dispatch notifications. The default behavior is to wrap the property with a
 * getter and setter.
 * @function Montage#makePropertyObservable
 * @param {string} name
 */

/**
 * Determines whether a property has ever been observed. Removing all property
 * change listeners does not destroy this record.
 * @function Montage#hasOwnPropertyChangeDescriptor
 * @param {string} name
 */

/**
 * @class Bindings
 * @extends frb
 * @typedef {string} FRBExpression
 */
var Bindings = exports.Bindings = require("frb");

var bindingPropertyDescriptors = {

    /**
     * Establishes a binding between two FRB expressions.  See the
     * [FRB](http://documentup.com/montagejs/frb/) documentation for
     * information about FRB paths/expressions. There can only be one binding
     * per target path on an object.
     * @param {string} targetPath
     * @param {object} descriptor A descriptor has at least an arrow property,
     * `"<-"`, `"<->"`. The corresponding string is the `sourcePath` for the
     * binding and the type of arrow determines whether the binding is one way
     * (from source to target) or if data flows both directions. The
     * `descriptor` may contain a `converter` or `reverter` object, or directly
     * provide `convert` and `revert` functions. Converters and reverters have
     * `convert` and `revert` methods.  The `convert` function or method
     * transforms data from the source to the target. The `revert` function or
     * method transforms data from the target to the source and is necessary if
     * there is a converter on a two-way binding. A `reverter` is the same as a
     * `converter`, but the polarity is reversed. This is useful for reusing
     * converters that were designed for data flowing the “wrong” way.  The
     * `descriptor` may also provide a `trace` flag for console debugging.
     * @function Montage#defineBinding
     */
    // The `commonDescriptor` is deliberately not documented as its use is
    // specific to the `defineBindings` implementation and not intended to
    // be used directly.
    defineBinding: {
        value: function (targetPath, descriptor, commonDescriptor) {
            return Bindings.defineBinding(this, targetPath, descriptor, commonDescriptor);
        }
    },

    /**
     * Establishes multiple bindings.
     * @see Montage#defineBinding
     * @function Montage#defineBindings
     * @param descriptors {object} an object for which every property is a
     * source path and every value is a binding descriptor as described by
     * `defineBinding`.
     * @param commonDescriptor {?object} a partial binding descriptor with
     * properties intended to be shared by all of the established bindings.
     */
    defineBindings: {
        value: function (descriptors, commonDescriptor) {
            return Bindings.defineBindings(this, descriptors, commonDescriptor);
        }
    },

    /**
     * Cancels a binding and removes its descriptor from the object's binding
     * descriptor index. This will in turn cause any change listeners needed on
     * far reaching objects for the binding to be canceled.  A component should
     * call this if the binding reaches into objects it does not itself own to
     * ensure that they are available for garbage collection.
     *
     * @function
     * @param {string} targetPath The target path used to establish the
     * binding.
     */
    cancelBinding: {
        value: function (targetPath) {
            return Bindings.cancelBinding(this, targetPath);
        }
    },

    /**
     * Cancels all registered bindings on this object.
     *
     * @function
     */
    cancelBindings: {
        value: function () {
            return Bindings.cancelBindings(this);
        }
    },

    /**
     * Gets the binding descriptor for a target path.
     *
     * @function
     * @param {string} targetPath
     * @returns {object} the descriptor for the binding
     * @see {@link Montage#defineBinding} for information on the descriptor type.
     */
    getBinding: {
        value: function (targetPath) {
            return Bindings.getBinding(this, targetPath);
        }
    },

    /**
     * Gets the binding descriptors for all target paths.
     * @function Montage#getBindings
     * @returns {object} an object that maps traget paths to binding
     * descriptors.
     * See `defineBinding` for information on the descriptor type.
     * @see Montage#defineBinding
     */
    getBindings: {
        value: function () {
            return Bindings.getBindings(this);
        }
    }

};

Montage.defineProperties(Montage, bindingPropertyDescriptors);
Montage.defineProperties(Montage.prototype, bindingPropertyDescriptors);

// Paths

var WeakMap = require("collections/weak-map"),
    Map = require("collections/map"),
    parse = require("frb/parse"),
    evaluate = require("frb/evaluate"),
    assign = require("frb/assign"),
    bind = require("frb/bind"),
    compileObserver = require("frb/compile-observer"),
    Scope = require("frb/scope"),
    Observers = require("frb/observers"),
    autoCancelPrevious = Observers.autoCancelPrevious;


var PathChangeDescriptor = function PathChangeDescriptor() {
    this._willChangeListeners = null;
    this._changeListeners = null;
	return this;
}

Object.defineProperties(PathChangeDescriptor.prototype,{
	_willChangeListeners: {
		value:null,
		writable: true
	},
	willChangeListeners: {
		get: function() {
			return this._willChangeListeners || (this._willChangeListeners = new Map());
		}
	},
	_changeListeners: {
		value:null,
		writable: true
	},
    changeListeners: {
		get: function() {
			return this._changeListeners || (this._changeListeners = new Map());
		}
	}

});

var pathChangeDescriptors = new WeakMap();

var pathPropertyDescriptors = {

    /**
     * Evaluates an FRB expression from this object and returns the value.
     * The evaluator does not establish any change listeners.
     * @function Montage#getPath
     * @param {string} path an FRB expression
     * @returns the current value of the expression
     */
    getPath: {
        value: function (path, parameters, document, components) {
            return evaluate(
                path,
                this,
                parameters || this,
                document,
                components
            );
        }
    },

    /**
     * Assigns a value to the FRB expression from this object. Not all
     * expressions can be assigned to. Property chains will work, but will
     * silently fail if the target object does not exist.
     * @function Montage#setPath
     * @param {string} path an FRB expression designating the value to replace
     * @param value the new value
     */
    setPath: {
        value: function (path, value, parameters, document, components) {
            return assign(
                this,
                path,
                value,
                parameters || this,
                document,
                components
            );
        }
    },

    /**
     * Observes changes to the value of an FRB expression.  The content of the
     * emitted value may react to changes, particularly if it is an array.
     * @function Montage#observePath
     * @param {string} path an FRB expression
     * @param {function} emit a function that receives new values in response
     * to changes.  The emitter may return a `cancel` function if it manages
     * event listeners that must be collected when the value changes.
     * @returns {function} a canceler function that will remove all involved
     * change listeners, prevent new values from being observed, and prevent
     * previously emitted values from reacting to any further changes.
     */
    observePath: {
        value: function (path, emit) {
            var syntax = parse(path);
            var observe = compileObserver(syntax);
            return observe(autoCancelPrevious(emit), new Scope(this));
        }
    },

    /**
     * Observes changes to the content of the value for an FRB expression.
     * The handler will receive “ranged content change” messages.  When a
     * change listener is added, the handler will be immediately invoked with
     * the initial content added at index 0 for the expression.
     * @function Montage#addRangeAtPathChangeListener
     * @param {string} path an FRB expression that produces content changes
     * @param handler a function that accepts `plus`, `minus`, and `index`
     * arguments, or a handler object with a designated method by that
     * signature.  `plus` and `minus` are arrays of values that were added
     * or removed.  `index` is the offset at which the `minus` was removed,
     * then the `plus` was added.
     * @param {?string} methodName the name of the method on the handler object
     * that should receive change messages.
     * @returns {function} cancel function for removing the range at path
     * change listener. Until `removeRangeAtPathChangeListener` is implemented,
     * this is the only way to disable this kind of observer.
     */
    addRangeAtPathChangeListener: {
        value: function (path, handler, methodName, parameters, document, components) {
            methodName = methodName || "handleRangeChange";
            function dispatch(plus, minus, index) {
                if (handler[methodName]) {
                    handler[methodName](plus, minus, index);
                } else if (handler.call) {
                    handler.call(null, plus, minus, index);
                } else {
                    throw new Error("Can't dispatch range change to " + handler);
                }
            }
            var minus = [];
            return this.addPathChangeListener(path, function (plus) {
                if (plus && plus.toArray && plus.addRangeChangeListener) {
                    // Give copies to avoid modification by the listener.
                    dispatch(plus.toArray(), minus.toArray(), 0);
                    minus = plus;
                    return plus.addRangeChangeListener(dispatch);
                } else {
                    plus = [];
                    dispatch(plus, minus, 0);
                    minus = plus;
                }
            }, void 0, void 0, parameters, document, components);
        }
    },

    // TODO removeRangeAtPathChangeListener
    // TODO add/removeMapAtPathChangeListener

    /**
     * Returns an internal index of all of the path change descriptors
     * associated with this instance.
     * @see Montage#getPathChangeDescriptor
     * @function Montage#getPathChangeDescriptors
     * @returns an object that maps property names to an object with two
     * Maps, `changeListeners` and `willChangeListeners`. Each of these
     * maps handler objects to path change descriptors. See
     * `getPathChangeDescriptor` for a description of that type.
     */
    getPathChangeDescriptors: {
        value: function () {
            if (!pathChangeDescriptors.has(this)) {
                pathChangeDescriptors.set(this, new Map());
            }
            return pathChangeDescriptors.get(this);
        }
    },

    /**
     * Gets the path change descriptor object for an observer established
     * previously by `addPathChangeListener` or `addBeforePathChangeListener`.
     * @function Montage#getPathChangeDescriptor
     * @param {string} path an FRB expression
     * @param handler a function that will receive a value change notification,
     * or an object with a method that will receive the change notifications
     * @param {boolean} beforeChange
     * @returns a path change descriptor. Such objects have `path`, `handler`,
     * `beforeChange`, and `cancel` properties. The `cancel` method is for
     * internal use only. It cancels the observer, but does not perform any
     * book keeping on the index of path change descriptors.
     */
    getPathChangeDescriptor: {
        value: function (path, handler, beforeChange) {
            var descriptors = Montage.getPathChangeDescriptors.call(this);
            if (!descriptors.has(path)) {
                descriptors.set(path, new PathChangeDescriptor);
            }

            descriptors = descriptors.get(path);
            descriptors = beforeChange ? descriptors.willChangeListeners : descriptors.changeListeners;

            if (!descriptors.has(handler)) {
                descriptors.set(handler, {
                    path: path,
                    handler: handler,
                    beforeChange: beforeChange,
                    cancel: Function.noop
                });
            }

            return descriptors.get(handler);
        }
    },

    /**
     * Creates an observer for the value of an FRB expression. The observer
     * will immediately dispatch a notification to the handler of the initial
     * value of the expression, before returning.
     *
     * If the expression's value is an array, this will be the final
     * notification and all subsequent changes will be reflected by the content
     * of the array. Use `addRangeAtPathChangeListener` if you want discrete
     * notifications for changes to the content of an expression that evaluates
     * to an array.
     *
     * Use `removePathChangeListener` to cancel all involved change listeners.
     *
     * @function Montage#addPathChangeListener
     * @param {string} path an FRB expression.
     * @param {object|function} handler an object with a handler method, or a
     * function. The handler will be called with `value`, `path`, and this as
     * arguments.
     * @param {string} handlerMethodName the method name on the handler on
     * which to dispatch change notifications, if the handler is not a
     * function.
     * @param {boolean} beforeChange instructs the path change listener to
     * dispatch before the change has occurred. Avoid using this boolean trap
     * by making use of the named method `addBeforePathChangeListener`. Using
     * this flag remains desireable only if `beforeChange` is indeed variable.
     */
    addPathChangeListener: {
        value: function (path, handler, methodName, beforeChange, parameters, document, components) {
            var self = this;

            handler = handler || Function.noop;

            var descriptor = Montage.getPathChangeDescriptor.call(this, path, handler, beforeChange);
            descriptor.cancel();

            var syntax = parse(path);

            var initialValue;
            var initialized;
            var emit;
            if (handler === Function.noop) {
                emit = function (value) {
                    if (initialized) {
                        throw new Error("Path change handler needs a handler because it emits new values when the source changes: " + JSON.stringify(path));
                    } else {
                        initialized = true;
                        initialValue = value;
                    }
                };
            } else if (methodName) {
                emit = function (value) {
                    return handler[methodName].call(handler, value, path, self);
                };
            } else if (handler.handlePathChange) {
                emit = function (value) {
                    return handler.handlePathChange.call(handler, value, path, self);
                };
            } else if (typeof handler === "function") {
                emit = function (value) {
                    return handler.call(self, value, path, self);
                };
            } else {
                throw new Error("Can't recognize handler type: " + handler + ". Must be function or delegate implementing handlePathChange.");
            }

            var observe = compileObserver(syntax);
            var scope = new Scope(this);
            scope.beforeChange = beforeChange;
            scope.parameters = parameters;
            scope.document = document;
            scope.components = components;
            var cancel = observe(autoCancelPrevious(emit), scope);

            descriptor.cancel = cancel;

            if (initialized) {
                return initialValue;
            } else {
                return cancel;
            }
        }
    },

    /**
     * Removes a path change listener previously established by a call to
     * `addPathChangeListener`. The given arguments must match the original.
     * See `addPathChangeListener` for descriptions of their meaning.
     * @see Montage#addPathChangeListener
     * @function Montage#removePathChangeListener
     * @param {string} path
     * @param {object|function}
     * @param {string} handlerMethodName
     * @param {boolean} beforeChange
     */
    removePathChangeListener: {
        value: function (path, handler, beforeChange) {
            handler = handler || Function.noop;
            var descriptorsForObject = Montage.getPathChangeDescriptors.call(this);
            var phase = beforeChange ? "willChangeListeners" : "changeListeners";

            var descriptorsForPath = descriptorsForObject.get(path);
            if (!descriptorsForPath) {
                throw new Error("Can't find " + phase + " for " + JSON.stringify(path));
            }
            var descriptorsForPhase = descriptorsForPath[phase];
            if (!descriptorsForPhase.has(handler)) {
                throw new Error("Can't find " + phase + " for " + JSON.stringify(path));
            }
            var descriptor = descriptorsForPhase.get(handler);
            descriptor.cancel();
            descriptorsForPhase.delete(handler);
            if (
                descriptorsForPath.willChangeListeners.size === 0 &&
                descriptorsForPath.changeListeners.size === 0
            ) {
                descriptorsForObject.delete(path);
            }
            // if there are no other handlers
            if (descriptorsForObject.size < 1) {
                pathChangeDescriptors["delete"](this);
            }
        }
    },

    /**
     * Establishes an observer such that the handler will receive a
     * notification when the value of an FRB expression is about to change.
     * See `addPathChangeListener` for details.
     * @see Montage#addPathChangeListener
     * @function Montage#addBeforePathChangeListener
     * @param {string} path
     * @param {object|function}
     * @param {string} handlerMethodName
     */
    addBeforePathChangeListener: {
        value: function (path, handler, methodName, parameters, document, components) {
            return Montage.addPathChangeListener.call(this, path, handler, methodName, true, parameters, document, components);
        }
    },

    /**
     * Removes a path change listener previously established by a call to
     * `addBeforePathChangeListener`. The given arguments must match the
     * original. See `addPathChangeListener` for descriptions of their meaning.
     * @see Montage#addBeforePathChangeListener
     * @see Montage#addPathChangeListener
     * @function Montage#removeBeforePathChangeListener
     * @param {string} path
     * @param {object|function}
     * @param {string} handlerMethodName
     * @param {boolean} beforeChange
     */
    removeBeforePathChangeListener: {
        value: function (path, handler, methodName) {
            return Montage.removePathChangeListener.call(this, path, handler, true);
        }
    }

};

Montage.defineProperties(Montage, pathPropertyDescriptors);
Montage.defineProperties(Montage.prototype, pathPropertyDescriptors);

// has to come last since serializer and deserializer depend on logger, which
// in turn depends on montage running to completion
require("./serialization/bindings");

/*
 * Defines the module Id for blueprints. This is externalized so that it can be subclassed.
 * <b>Note</b> This is a class method beware...
 */
exports._blueprintModuleIdDescriptor = {
    serializable:false,
    enumerable: false,
    get:function () {
        var info = Montage.getInfoForObject(this);
        var self = (info && !info.isInstance) ? this : this.constructor;
        if ((!Object.getOwnPropertyDescriptor(self, "_blueprintModuleId")) || (!self._blueprintModuleId)) {
            info = Montage.getInfoForObject(self);
            var moduleId = info.moduleId,
                slashIndex = moduleId.lastIndexOf("/"),
                dotIndex = moduleId.lastIndexOf(".");
            slashIndex = ( slashIndex === -1 ? 0 : slashIndex + 1 );
            dotIndex = ( dotIndex === -1 ? moduleId.length : dotIndex );
            dotIndex = ( dotIndex < slashIndex ? moduleId.length : dotIndex );
            Montage.defineProperty(self, "_blueprintModuleId", {
                enumerable: false,
                value: moduleId.slice(0, dotIndex) + ".meta"
            });
        }
        return self._blueprintModuleId;
    }
};

exports._blueprintDescriptor = {
    serializable:false,
    enumerable: false,
    get:function () {
        var info = Montage.getInfoForObject(this);
        var self = (info && !info.isInstance) ? this : this.constructor;
        if ((!Object.getOwnPropertyDescriptor(self, "_blueprint")) || (!self._blueprint)) {
            var blueprintModuleId = self.blueprintModuleId;
            if (blueprintModuleId === "") {
                throw new TypeError("Blueprint moduleId undefined for the module '" + JSON.stringify(self) + "'");
            }

            if (!exports._blueprintDescriptor.BlueprintModulePromise) {
                exports._blueprintDescriptor.BlueprintModulePromise = require.async("core/meta/module-blueprint").get("ModuleBlueprint");
            }
            Montage.defineProperty(self, "_blueprint", {
                enumerable: false,
                value: exports._blueprintDescriptor.BlueprintModulePromise.then(function (Blueprint) {
                    var info = Montage.getInfoForObject(self);

                    return Blueprint.getBlueprintWithModuleId(blueprintModuleId, info.require)
                    .catch(function (error) {
                        // FIXME only generate blueprint if the moduleId
                        // requested does not exist. If any parents do not
                        // exist then the error should still be thrown.
                        if (error.message.indexOf("Can't XHR") !== -1) {
                            return Blueprint.createDefaultBlueprintForObject(self).then(function (blueprint) {
                                return blueprint;
                            });
                        } else {
                            throw error;
                        }
                    });
                })
            });
        }
        return self._blueprint;
    },
    set:function (value) {
        var info = Montage.getInfoForObject(this);
        var _blueprintValue;
        var self = (info && !info.isInstance) ? this : this.constructor;
        if (value === null) {
            _blueprintValue = null;
        } else if (typeof value.then === "function") {
            throw new TypeError("Object blueprint should not be a promise");
        } else {
            value.blueprintInstanceModule = self.blueprintModule;
            _blueprintValue = require("./promise").Promise.resolve(value);
        }
        Montage.defineProperty(self, "_blueprint", {
            enumerable: false,
            value: _blueprintValue
        });
    }
};
