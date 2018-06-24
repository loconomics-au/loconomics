/**
    Model class to help build models.

    Is not exactly an 'OOP base' class, but provides
    utilities to models and a model definition object
    when executed in their constructors as:

    '''
    function MyModel() {
        Model(this);
        // Now, there is a this.model property with
        // an instance of the Model class, with
        // utilities and model settings.
    }
    '''

    That auto creation of 'model' property can be avoided
    when using the object instantiation syntax ('new' keyword):

    '''
    var model = new Model(obj);
    // There is no a 'obj.model' property, can be
    // assigned to whatever property or nothing.
    '''
**/
'use strict';
var ko = require('knockout');
var $ = require('jquery');
var clone = function(obj) { return $.extend(true, {}, obj); };
var cloneValue = function(val, deepCopy) {
    /* eslint complexity:"off" */
    if (typeof(val) === 'object') {
        // A Date object is a special case: even being
        // an object, treat as a basic type, being copied as
        // a new instance independent of the deepCopy option
        if (val instanceof Date) {
            // A date clone
            return new Date(val);
        }
        else if (deepCopy === true) {
            if (val instanceof Array) {
                return val.map(function(item) {
                    return cloneValue(item, true);
                });
            }
            else if (val === null) {
                return null;
            }
            else if (val && val.model instanceof Model) {
                // A model copy
                return val.model.toPlainObject(deepCopy);
            }
            else {
                // Plain 'standard' object clone
                return clone(val);
            }
        }
        else if (deepCopy === false) {
            // Shallow copy
            return val;
        }
        // On else, left undefined, no references, no clones,
        // discarded value
        return undefined;
    }
    else {
        // A basic type value is already copied/cloned by javascript
        // on every assignment
        return val;
    }
};

function Model(modelObject) {

    if (!(this instanceof Model)) {
        // Executed as a function, it must create
        // a Model instance
        var model = new Model(modelObject);
        // and register automatically as part
        // of the modelObject in 'model' property
        modelObject.model = model;

        // Returns the instance
        return model;
    }

    // It includes a reference to the object
    this.modelObject = modelObject;
    // It maintains a list of properties and fields
    this.propertiesList = [];
    this.fieldsList = [];
    this.propertiesDefs = {};
    this.fieldsDefs = {};

    // Timestamp with the date of last change
    // in the data (automatically updated when changes
    // happens on properties; fields or any other member
    // added to the model cannot be observed for changes,
    // requiring manual updating with a 'new Date()', but is
    // better to use properties.
    // Its rated to zero just to avoid that consecutive
    // synchronous changes emit lot of notifications, specially
    // with bulk tasks like 'updateWith'.
    this.dataTimestamp = ko.observable(new Date()).extend({ rateLimit: 0 });
    /**
     * @private {Object} A dictionary by property key of subscription objects
     * to fields containing a Model or array of Model, so can be disposed
     * properly after a ref change.
     */
    this.__dataTimestampModelsSubscriptions = {};
}

module.exports = Model;

/**
    Internal utility to map a value given its property/field
    definition
**/
function prepareValueByDef(val, def) {
    if (def.isArray &&
        !Array.isArray(val)) {
        if (val)
            val = [val];
        else
            val = [];
    }
    if (def && def.Model) {
        var getModelInstance = function(item) {
            if (item instanceof def.Model ||
                item === null ||
                typeof(item) === 'undefined') {
                // 'as is'
                return item;
            }
            else {
                // For a model instance used as initialValue, reuse it's values
                // as initial data to keep expected behavior
                if (def.initialValue && def.initialValue.model) {
                    var m = new def.Model(def.initialValue.model.toPlainObject(true));
                    m.model.updateWith(item, true);
                    return m;
                }
                return new def.Model(item);
            }
        };
        if (Array.isArray(val)) {
            val = val.map(getModelInstance);
        }
        else {
            val = getModelInstance(val);
        }
    }
    else if (def && def.isDate) {
        var getDate = function(v) {
            if (v instanceof Date)
                return v;
            else if (typeof(v) === 'string')
                // Must be in ISO format
                return new Date(v);
            else if (typeof(v) === 'number')
                return new Date(v);
            else
                return null;
        };
        if (Array.isArray(val)) {
            val = val.map(getDate);
        }
        else {
            val = getDate(val);
        }
    }
    return val;
}

function createDef(givenVal, initialVal) {

    var def;
    var isModel = givenVal && givenVal.model instanceof Model;
    var isArray = Array.isArray(givenVal);
    //TODO ToInvestigate how option 'isArray' must work here without introducing incompatible change
    // Change attempt: isArray = givenVal && givenVal.isArray || Array.isArray(givenVal),
    var isDate = (givenVal instanceof Date);
    var isObject = typeof(givenVal) === 'object' && !isDate;

    if (givenVal !== null && !isModel && isObject && !isArray) {
        def = givenVal;
    }
    else {
        def = {
            defaultValue: givenVal,
            isArray: isArray
        };
        if (isModel)
            def.Model = givenVal.constructor;
        else if (isDate)
            def.isDate = isDate;
    }

    initialVal = typeof(initialVal) === 'undefined' ? def.defaultValue : initialVal;
    def.initialValue = prepareValueByDef(initialVal, def);

    return def;
}

/**
    Define observable properties using the given
    properties object definition that includes de default values,
    and some optional initialValues (normally that is provided externally
    as a parameter to the model constructor, while default values are
    set in the constructor).
    That properties become members of the modelObject, simplifying
    model definitions.

    It uses Knockout.observable and observableArray, so properties
    are funtions that reads the value when no arguments or sets when
    one argument is passed of.
**/
Model.prototype.defProperties = function defProperties(properties, initialValues) {

    initialValues = initialValues || {};

    var modelObject = this.modelObject;
    var propertiesList = this.propertiesList;
    var defs = this.propertiesDefs;
    var dataTimestamp = this.dataTimestamp;
    var __dataTimestampModelsSubscriptions = this.__dataTimestampModelsSubscriptions;

    Object.keys(properties).forEach(function(key) {

        // Create and register definition
        var def = createDef(properties[key], initialValues[key]);
        defs[key] = def;

        // Create the observable property
        modelObject[key] = Array.isArray(def.initialValue) ?
        //TODO ToInvestigate how option 'isArray' must work here without introducing incompatible change
        // Change attempt: modelObject[key] = def.isArray ?
            ko.observableArray(def.initialValue) :
            ko.observable(def.initialValue);

        // Remember default
        modelObject[key]._defaultValue = def.defaultValue;
        // remember initial
        modelObject[key]._initialValue = def.initialValue;

        // Add subscriber to update the timestamp on changes, that is simple
        // except for models and arrays of models where we need to track previous suscriptions
        // and subscribe to each every timestamp change so it tracks any depth
        // on individual items changes
        // NOTE: The bad part of this strategy of noticing nested changes (by using subscriptions)
        // is that happens at another microtask after setting the new value, so any code depending
        // on a model with this will need to delay saving a copy of the datastamp after an updateWith/reset
        // for next microtask (like with a zero setTimeoff)
        modelObject[key].subscribe(function(newValue) {
            dataTimestamp(new Date());
            if (def.Model) {
                if (Array.isArray(newValue)) {
                    if (__dataTimestampModelsSubscriptions[key]) {
                        __dataTimestampModelsSubscriptions[key].forEach((sub) => sub.dispose());
                    }
                    if (newValue) {
                        __dataTimestampModelsSubscriptions[key] = newValue
                        .map((itemModel) => itemModel.model && itemModel.model.dataTimestamp.subscribe(() => dataTimestamp(new Date())))
                        .filter((a) => !!a);
                    }
                }
                else {
                    if (__dataTimestampModelsSubscriptions[key]) {
                        __dataTimestampModelsSubscriptions[key].dispose();
                    }
                    if (newValue) {
                        __dataTimestampModelsSubscriptions[key] = newValue.model && newValue.model.dataTimestamp.subscribe(() => dataTimestamp(new Date()));
                    }
                }
            }
        });

        // Add to the internal registry
        propertiesList.push(key);
    });

    // Update timestamp after the bulk creation.
    dataTimestamp(new Date());
};

/**
    Define fields as plain members of the modelObject using
    the fields object definition that includes default values,
    and some optional initialValues.

    Its like defProperties, but for plain js values rather than observables.
**/
Model.prototype.defFields = function defFields(fields, initialValues) {

    initialValues = initialValues || {};

    var modelObject = this.modelObject;
    var defs = this.fieldsDefs;
    var fieldsList = this.fieldsList;

    Object.keys(fields).each(function(key) {

        // Create and register definition
        var def = createDef(fields[key], initialValues[key]);
        defs[key] = def;

        // Create field with initial value
        modelObject[key] = def.initialValue;

        // Add to the internal registry
        fieldsList.push(key);
    });
};

/**
    Store the list of fields that make the ID/primary key
    and create an alias 'id' property that returns the
    value for the ID field or array of values when multiple
    fields.
**/
Model.prototype.defID = function defID(fieldsNames) {

    // Store the list
    this.idFieldsNames = fieldsNames;

    // Define ID observable
    if (fieldsNames.length === 1) {
        // Returns single value
        var field = fieldsNames[0];
        this.modelObject.id = ko.pureComputed(function() {
            return this[field]();
        }, this.modelObject);
    }
    else {
        this.modelObject.id = ko.pureComputed(function() {
            return fieldsNames.map(function(fieldName) {
                return this[fieldName]();
            }.bind(this));
        }, this.modelObject);
    }
};

/**
    Allows to register a property (previously defined) as
    the model timestamp, so gets updated on any data change
    (keep in sync with the internal dataTimestamp).
**/
Model.prototype.regTimestamp = function regTimestampProperty(propertyName) {

    var prop = this.modelObject[propertyName];
    if (typeof(prop) !== 'function') {
        throw new Error('There is no observable property with name [' +
                        propertyName +
                        '] to register as timestamp.'
       );
    }
    // Add subscriber on internal timestamp to keep
    // the property updated
    this.dataTimestamp.subscribe(function(timestamp) {
        prop(timestamp);
    });
};

/**
    Returns a plain object with the properties and fields
    of the model object, just values.

    @param deepCopy:bool If left undefined, do not copy objects in
    values and not references. If false, do a shallow copy, setting
    up references in the result. If true, to a deep copy of all objects.
**/
Model.prototype.toPlainObject = function toPlainObject(deepCopy) {

    var plain = {};
    var modelObj = this.modelObject;

    function setValue(property, val) {
        var clonedValue = cloneValue(val, deepCopy);
        if (typeof(clonedValue) !== 'undefined') {
            plain[property] = clonedValue;
        }
    }

    this.propertiesList.forEach(function(property) {
        // Properties are observables, so functions without params:
        var val = modelObj[property]();

        setValue(property, val);
    });

    this.fieldsList.forEach(function(field) {
        // Fields are just plain object members for values, just copy:
        var val = modelObj[field];

        setValue(field, val);
    });

    return plain;
};

Model.prototype.updateWith = function updateWith(data, deepCopy) {

    // We need a plain object for 'fromJS'.
    // If is a model, extract their properties and fields from
    // the observables (fromJS), so we not get computed
    // or functions, just registered properties and fields
    var timestamp = null;
    if (data && data.model instanceof Model) {

        // We need to set the same timestamp, so
        // remember for after the fromJS
        timestamp = data.model.dataTimestamp();

        // Replace data with a plain copy of itself
        data = data.model.toPlainObject(deepCopy);
    }

    var target = this.modelObject;
    var defs = this.propertiesDefs;
    this.propertiesList.forEach(function(property) {
        var val = data[property];
        var def = defs[property];
        if (typeof(val) !== 'undefined') {
            target[property](prepareValueByDef(val, def));
        }
    });

    defs = this.fieldsDefs;
    this.fieldsList.forEach(function(field) {
        var val = data[field];
        var def = defs[field];
        if (typeof(val) !== 'undefined') {
            target[field] = prepareValueByDef(val, def);
        }
    });

    // Same timestamp if any
    if (timestamp)
        this.modelObject.model.dataTimestamp(timestamp);
};

Model.prototype.clone = function clone(data, deepCopy) {
    // Get a plain object with the object data
    var plain = this.toPlainObject(deepCopy);
    // Create a new model instance, using the source plain object
    // as initial values
    var cloned = new this.modelObject.constructor(plain);
    if (data) {
        // Update the cloned with the provided plain data used
        // to replace values on the cloned one, for quick one-step creation
        // of derived objects.
        cloned.model.updateWith(data);
    }
    else {
        // Since there is no initial differential data, ensure the
        // same timestamp since the clone is still identical to the source
        cloned.model.dataTimestamp(this.modelObject.model.dataTimestamp());
    }
    // Cloned model ready:
    return cloned;
};

/**
    Updates the dataTimestamp to the current unique datetime,
    so the model appear as touched/updated, even if not data change.
    Useful sometimes to make a difference from a cloned instance
    so appear different.
    NOTE: the datetime set is not exactly the current one, is the current
    number of milliseconds plus one,
    to ensure that the timestamp is different on edge cases where this
    method is called just after a creation or clonation, because the way
    javascript works and the limited milliseconds precision of the Date object
    there is a chance that the 'touched' date will be the same as before,
    thats avoided with this simple trick, so remains 'unique' in the current execution.
**/
Model.prototype.touch = function touch() {
    // We use the function way to get milliseconds, add 1 and create instance
    this.dataTimestamp(new Date(Date() + 1));
};

/**
    Replaces all the properties and fields data in the model object
    with the default ones of the constructor, plus optional new preset data.
**/
Model.prototype.reset = function reset(presets) {

    var newInstance = new this.modelObject.constructor(presets);

    this.updateWith(newInstance, true);
};
