
var Montage = require("./core").Montage;

var parse = require("frb/parse");
var stringify = require("frb/stringify");
var evaluate = require("frb/evaluate");
var precedence = require("frb/language").precedence;

var Selector = exports.Selector = Montage.specialize({

    syntax: {
        value: null
    },

    constructor: {
        value: function Selector() {
            this.super();
        }
    },

    initWithSyntax: {
        value: function (syntax) {
            this.syntax = syntax;
            return this;
        }
    },

    initWithPath: {
        value: function (path) {
            this.syntax = parse(path);
            return this;
        }
    },

    stringify: {
        value: function () {
            return stringify(this.syntax);
        }
    },

    serializeSelf: {
        value: function (serializer) {
            serializer.setProperty("path", stringify(this.syntax));
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            this.syntax = parse(deserializer.getProperty("path"));
        }
    },

    evaluate: {
        value: function (value, parameters) {
            return evaluate(this.syntax, value, parameters);
        }
    }

});

function getArgs(arguments) {
    return Array.prototype.map.call(arguments, function (argument) {
        if (typeof argument === "string") {
            return parse(argument);
        } else if (argument.syntax) {
            return argument.syntax;
        } else if (typeof argument === "object") {
            return argument;
        }
    });
}
function instanceMethod(type) {
    return function () {
        var args = getArgs(arguments);
        // invoked as instance method
        return new (this.constructor)().initWithSyntax({
            type: type,
            args: [this.syntax].concat(args)
        });
    };
}

function classMethod(type) {
    return function () {
        var args = getArgs(arguments);
        // invoked as class method
        return new this().initWithSyntax({
            type: type,
            args: args
        });
    };
}

// generate methods on Selector for each of the tokens of the language.
// support invocation both as class and instance methods like
// Selector.and("a", "b") and aSelector.and("b")
var tokens = precedence.keys(), i, countI;
for(i=0,countI=tokens.length;i<countI;i++) {
	var type = tokens[i];
	Montage.defineProperty(Selector.prototype, type, {
        value: instanceMethod(type)
    });
    Montage.defineProperty(Selector, type, {
        value: classMethod(type)
    });
    
}
