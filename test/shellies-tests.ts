import shellies = require('../index');

// Events
shellies.on('discover', (device, isUnknown) => {
    const id: string = device.id;
    const known: boolean = isUnknown;
    device.on('change', (prop, newValue, oldValue, d) => {
        const p: string = prop;
        d.host.toUpperCase();
    });
    device.on('change:relay0', (nv, ov, d) => d.id);
    device.on('offline', d => d.id);
});
shellies.on('stale', d => d.type);
// @ts-expect-error wrong listener signature
shellies.on('add', (x: number) => {});

// Basic API
shellies.setAuthCredentials('user', 'pass');
shellies.staleTimeout = 5000;
shellies.start().then(() => shellies.stop());
shellies.start('eth0');
const count: number = shellies.size;
const running: boolean = shellies.running;
for (const d of shellies) {
    d.name?.toUpperCase();
    for (const [prop, value] of d) {
        prop.toUpperCase();
    }
}

// Device creation
const s1 = shellies.createDevice('SHSW-1', 'ABC', '192.168.1.2');
s1.relay0 = true;
s1.setRelay(0, true);
s1.externalTemperature0?.toFixed();

const s25 = shellies.createDevice('SHSW-25', 'ABC', '192.168.1.2', 'roller');
s25.setRollerState('open', 10);
s25.setRollerPosition(50);
s25.mode === 'roller';

const rgbw2 = shellies.createDevice('SHRGBW2', 'X', 'h');
rgbw2.setColor({ red: 255, switch: true });
rgbw2.setWhite(0, 100, true);

const bulb = shellies.createDevice('SHBLB-1', 'X', 'h');
bulb.setWhite(3000, 100, true);

const trv = shellies.createDevice('SHTRV-01', 'X', 'h');
trv.setTargetTemperature(21);

const generic = shellies.createDevice('SOMETHING-NEW', 'X', 'h');
generic.reboot();
generic.getSettings();
if (shellies.isUnknownDevice(generic)) {
    generic.payload?.length;
}

// @ts-expect-error not a switch
shellies.createDevice('SHHT-1', 'X', 'h').setRelay(0, true);

// Device lookup
const found = shellies.getDevice('SHSW-1', 'ABC');
found?.online;
found && shellies.hasDevice(found);

// Listener and coap
const listener = new shellies.StatusUpdatesListener();
listener.on('statusUpdate', msg => msg.deviceId?.toUpperCase());
listener.start().then(l => l.stop());
shellies.Coap.requestStatusUpdates(msg => msg.payload, 1000);
shellies.Coap.getStatus('1.2.3.4').then(m => m.validFor);
shellies.request.get('http://host/status').query({ a: 1 });

import shellies2 from '../index';
const typed = shellies2.getDevice('SHSW-25', 'x') as shellies2.Shelly25;
typed.rollerPosition.toFixed();
