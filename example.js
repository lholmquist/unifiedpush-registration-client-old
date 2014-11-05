var registrar = require('./lib/unifiedpush-registration'),
    metadata = {},
    settings = {},
    options = {};

settings.url = 'http://localhost:8080/ag-push';
settings.variantId = '12345';
settings.variantSecret = '12345';

options.metadata = {};

options.metadata.deviceToken = '8D220016DBA072CBEEC3EE72707EB82A4008BA62E0CC75A224065BB479C8292E';

var registrar = registrar.UnifiedPushClient(settings);

registrar.registerWithPushServer(options, function (err, response) {
    if (err) {
        console.log('error', err);
        return;
    }

    console.log('success', response);
});

