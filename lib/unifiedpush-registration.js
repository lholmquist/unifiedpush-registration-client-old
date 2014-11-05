var util = require('util'),
    events = require('events'),
    urlParser = require('url'),
    http = require('http'),
    https = require('https');

function doEvent(status, message, callback) {
    if (!callback || typeof callback !== 'function') {
        this.emit(status, message);
        return;
    }

    if (status === 'error') {
        callback(message);
    } else {
        callback(null, message);
    }
}

function doSend(serverSettings, metadata, callback) {
    var request,
        caller = serverSettings.protocol === 'https:' ? https : http;

    request = caller.request(serverSettings, function (response) {
        if (response.statusCode >= 400) {
            doEvent.call(this, 'error', response.statusCode, callback);
            return;
        }

        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            doEvent.call(this, 'success', chunk, callback);
        }.bind(this));
    }.bind(this));

    request.on('error', function (error) {
        doEvent.call(this, 'error', 'problem with request: ' + error.message, callback);
    }.bind(this));

    request.end(JSON.stringify(metadata), 'utf-8');
}


function createServerSettings(url, variantId, variantSecret, type) {
    var serverSettings = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        auth: variantId + ':' + variantSecret,
        method: type
    };

    return serverSettings;
}


var AeroGear = {};

/**
    The AeroGear.UnifiedPushClient does cool stuff
    @class
    @param {Object} settings={} - the settings to be passed
    @param {String} settings.url - The URL of the Unified Push Server.
    @param {String} settings.variantId - The Variant ID
    @param {String} settings.variantSecret - The Variant Secret
    @returns {Object} sender - a Sender Object Event Emitter
 */
AeroGear.UnifiedPushClient = function (settings) {
    settings = settings || {};

    // we require all arguments to be present, otherwise it does not work
    if (!settings.variantId || !settings.variantSecret || !settings.url) {
        throw 'UnifiedPushClientException';
    }

    // Allow instantiation without using new
    if (!(this instanceof AeroGear.UnifiedPushClient)) {
        return new AeroGear.UnifiedPushClient(settings);
    }

    var url = settings.url;

    url = url.substr(-1) === '/' ? url : url + '/';

    events.EventEmitter.call(this);

    this.getUrl = function () {
        return url;
    };

    this.getVariantId = function () {
        return settings.variantId;
    };

    this.getVariantSecret = function () {
        return settings.variantSecret;
    };
};

util.inherits(AeroGear.UnifiedPushClient, events.EventEmitter);


/**
    Performs a register request against the UnifiedPush Server using the given metadata which represents a client that wants to register with the server.
    @param {Object} settings The settings to pass in
    @param {Object} settings.metadata - the metadata for the client
    @param {String} settings.metadata.deviceToken - identifies the client within its PushNetwork. On Android this is the registrationID, on iOS this is the deviceToken and on SimplePush this is the URL of the given SimplePush server/network.
    @param {String} [settings.metadata.alias] - Application specific alias to identify users with the system. Common use case would be an email address or a username.
    @param {Array} [settings.metadata.categories] - In SimplePush this is the name of the registration endpoint. On Hybrid platforms like Apache Cordova this is used for tagging the registered client.
    @param {String} [settings.metadata.operatingSystem] - Useful on Hybrid platforms like Apache Cordova to specifiy the underlying operating system.
    @param {String} [settings.metadata.osVersion] - Useful on Hybrid platforms like Apache Cordova to specify the version of the underlying operating system.
    @param {String} [settings.metadata.deviceType] - Useful on Hybrid platforms like Apache Cordova to specify the type of the used device, like iPad or Android-Phone.
    @returns {Object} An ES6 Promise created by AeroGear.ajax
*/
AeroGear.UnifiedPushClient.prototype.registerWithPushServer = function (settings, callback) {

    if (settings && typeof settings === 'function') {
        callback = settings;
        settings = {};
    }

    var serverSettings,
        metadata = settings.metadata || {},
        url = this.getUrl() + 'rest/registry/device';

    url = urlParser.parse(url);

    // we need a deviceToken, registrationID or a channelID:
    if (!metadata.deviceToken) {
        throw 'UnifiedPushRegistrationException';
    }

    metadata.categories = Array.isArray(metadata.categories) ? metadata.categories : (metadata.categories ? [metadata.categories] : []);

    serverSettings = createServerSettings(url, this.getVariantId(), this.getVariantSecret(), 'POST');

    doSend.call(this, serverSettings, metadata, callback);

    return this;
};

/**
    Performs an unregister request against the UnifiedPush Server for the given deviceToken. The deviceToken identifies the client within its PushNetwork. On Android this is the registrationID, on iOS this is the deviceToken and on SimplePush this is the URL of the given SimplePush server/network.
    @param {String} deviceToken - unique String which identifies the client that is being unregistered.
    @returns {Object} An ES6 Promise created by AeroGear.ajax
*/
AeroGear.UnifiedPushClient.prototype.unRegisterWithPushServer = function (deviceToken, callback) {

    var serverSettings,
        url = this.getUrl() + 'rest/registry/device/' + deviceToken;

    url = urlParser.parse(url);

    serverSettings = createServerSettings(url, this.getVariantId(), this.getVariantSecret(), 'DELETE');

    doSend.call(this, serverSettings, callback);

    return this;
};


module.exports = AeroGear;
