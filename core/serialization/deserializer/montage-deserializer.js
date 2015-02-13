var Montage = require("../../core").Montage;
var Deserializer = require("mousse/deserialization/deserializer").Deserializer;
var MontageInterpreter = require("./montage-interpreter").MontageInterpreter;
var MontageReviver = require("./montage-reviver").MontageReviver;
var Promise = require("../../promise").Promise;

var MontageDeserializer = Montage.specialize.call(Deserializer, {
    _interpreter: {value: null},
    _serializationString: {value: null},
    _serialization: {value: null},

    init: {
        value: function(serializationString, _require, objectRequires, origin) {
            if (! this.isSerializationStringValid(serializationString)) {
                throw new Error(
                    this._formatSerializationSyntaxError(serializationString)
                );
            }

            Deserializer.call(this, serializationString);
            this._origin = origin;
            this._interpreter = new MontageInterpreter()
                .init(_require, objectRequires);

            return this;
        }
    },

    initWithSerialization: {
        value: function(serialization, _require, objectRequires, origin) {
			this._serialization = serialization;
            this._origin = origin;
            this._interpreter = new MontageInterpreter()
                .init(_require, objectRequires);

            return this;
        }
    },


    serialization: {
        get: function() {
            return this._serialization ? this._serialization : (this._serialization = JSON.parse(this._serializationString));
        }
    },

    deserialize: {
        value: function(instances, element) {
            var serialization;

            try {
                serialization = this.serialization;
                //serialization = Object.create(this.serialization);
                //serialization = JSON.parse(this._serializationString);
                return this._interpreter.instantiate(serialization, instances, element);
            } catch (error) {
                 return Promise.reject(error);
            }
			//console.log("deserialize ",this.moduleId);
        }
    },

    preloadModules: {
        value: function() {
            return this._interpreter.preloadModules(this.serialization);
        }
    },

    getExternalObjectLabels: {
        value: function() {
            var serialization = this.serialization,
                labels = [];

            for (var label in serialization) {
                if (Object.keys(serialization[label]).length === 0) {
                    labels.push(label);
                }
            }

            return labels;
        }
    },

    isSerializationStringValid: {
        value: function(serializationString) {
            try {
                this._serialization = JSON.parse(serializationString);
                return true;
            } catch (ex) {
                return false;
            }
        }
    },

    _formatSerializationSyntaxError: {
        value: function(source) {
	
	        return require.async("../../jshint")
            .then(function(exports) {
                JSHINT = exports.JSHINT;

	            var gutterPadding = "   ",
	                origin = this._origin,
	                message,
	                error,
	                lines,
	                gutterSize,
	                line;

	            if (!JSHINT(source)) {
	                error = JSHINT.errors[0];
	                lines = source.split("\n");
	                gutterSize = (gutterPadding + lines.length).length;
	                line = error.line - 1;

	                for (var i = 0, l = lines.length; i < l; i++) {
	                    lines[i] = (new Array(gutterSize - (i + 1 + "").length + 1)).join(i === line ? ">" : " ") +
	                        (i + 1) + " " + lines[i];
	                }
	                message = "Syntax error at line " + error.line +
	                    (origin ? " from " + origin : "") + ":\n" +
	                    error.evidence + "\n" + error.reason + "\n" +
	                    lines.join("\n");
	            } else {
	                message = "Syntax error in the serialization but not able to find it!\n" + source;
	            }

	            return message;

            });
    
	
	
	
        }
    }

}, {

    defineDeserializationUnit: {
        value: function(name, funktion) {
            MontageReviver.defineUnitReviver(name, funktion);
        }
    }

});

exports.MontageDeserializer = MontageDeserializer;
exports.deserialize = function(serializationString, _require) {
    return new MontageDeserializer().
        init(serializationString, _require)
        .deserializeObject();
};

