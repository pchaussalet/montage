var Montage = require("./core").Montage,
    // logger = require("./logger").logger("document-part"),
    Promise = require("./promise").Promise,
    defaultEventManager = require("./event/event-manager").defaultEventManager;

var DocumentPart = Montage.specialize({
    parentDocumentPart: {value: null},
    template: {value: null},
    fragment: {value: null},
    objects: {value: null},
    _childComponents: {value: null},
    childComponents: {
        get: function() {
			return this._childComponents || (this._childComponents = []);
		}
	},
    parameters: {value: null},

    constructor: {
        value: function DocumentPart() {
            //this.super();
        }
    },

    initWithTemplateAndFragment: {
        value: function(template, fragment) {
//if (template._baseUrl == 'http://localhost:8000/test/ui/repetition/list-parameters.reel/') console.trace(template._baseUrl);
            this.template = template;
            this.fragment = fragment;
        }
    },

    startActingAsTopComponent: {
        value: function() {
            if (this.fragment) {
                defaultEventManager.registerEventHandlerForElement(
                    this, this.fragment);
            }
        }
    },

    stopActingAsTopComponent: {
        value: function() {
            if (this.fragment) {
                defaultEventManager.unregisterEventHandlerForElement(
                    this.fragment);
            }
        }
    },

    addChildComponent: {
        value: function(childComponent) {
            if (this.childComponents.indexOf(childComponent) == -1) {
                this.childComponents.push(childComponent);
            }
        }
    },

    removeChildComponent: {
        value: function(childComponent) {
            var childComponents = this.childComponents,
                ix = childComponents.indexOf(childComponent);

            if (ix > -1) {
                childComponents.splice(ix, 1);
                childComponent._parentComponent = null;
                childComponent._alternateParentComponent = null;
            }
        }
    },

    _addToDrawList: {
        value: function() {}
    },

    _componentTreeLoadedDeferred: {value: null},
    loadComponentTree: {
        value: function() {
            var deferred = this._componentTreeLoadedDeferred,
                promises, i, countI, childComponents = this.childComponents, self = this;

            if (!deferred) {
                deferred = Promise.defer();
                this._componentTreeLoadedDeferred = deferred;

                promises = [];

				for(i=0, countI = childComponents.length; i<countI;i++) {
					if(!childComponents[i].canDrawGate.getField("componentTreeLoaded")) {
	                    promises.push(childComponents[i].loadComponentTree());
					}
                }

                Promise.all(promises).then(function() {
                    deferred.resolve();
					self._componentTreeLoadedDeferred = null;
                }, deferred.reject).done();
            }

            return deferred.promise;
        }
    }
});

exports.DocumentPart = DocumentPart;

