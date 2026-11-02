// Type definitions for shellies 1.7
// Project: https://github.com/alexryd/node-shellies
// Definitions by: shellies-types contributors

import { EventEmitter } from 'eventemitter3';
import type * as coap from 'coap';
import type * as superagent from 'superagent';

export = shellies;

/**
 * The singleton exported by `shellies`. It keeps track of discovered Shelly
 * (generation 1) devices and emits events when devices appear, change or go
 * offline.
 */
declare const shellies: shellies.Shellies;

declare namespace shellies {
    // ---------------------------------------------------------------------
    // Shellies
    // ---------------------------------------------------------------------

    interface ShelliesEvents {
        /** The status updates listener has started. */
        start: () => void;
        /** The status updates listener has stopped. */
        stop: () => void;
        /** A new device was discovered, before it has been added. */
        discover: (device: Device, isUnknown: boolean) => void;
        /** A device was added. */
        add: (device: Device) => void;
        /** A device was removed. */
        remove: (device: Device) => void;
        /** A device has been offline for longer than `staleTimeout`. */
        stale: (device: Device) => void;
    }

    interface Shellies extends EventEmitter<ShelliesEvents> {
        /** The number of devices. */
        readonly size: number;
        /** Whether the status updates listener is running. */
        readonly running: boolean;
        /**
         * Milliseconds a device may stay offline before it is considered stale
         * and removed. `0` (default) disables this behavior.
         */
        staleTimeout: number;

        [Symbol.iterator](): IterableIterator<Device>;

        /** Sets the credentials used for HTTP requests (all devices). */
        setAuthCredentials(username: string, password: string): void;
        /**
         * Starts discovering devices and listening for status updates.
         * @param networkInterface Name of the network interface to use.
         */
        start(networkInterface?: string | null): Promise<void>;
        stop(): void;
        getDevice(type: string, id: string): Device | undefined;
        hasDevice(device: Device): boolean;
        /** @throws If a device with the same type and ID was already added. */
        addDevice(device: Device): void;
        removeDevice(device: Device): void;
        removeAllDevices(): void;
        isUnknownDevice(device: Device): device is UnknownDevice;

        readonly Coap: Coap;
        readonly request: HttpRequest;
        readonly StatusUpdatesListener: StatusUpdatesListenerConstructor;
        /** Creates a device from its CoAP type identifier (e.g. `SHSW-1`). */
        createDevice: CreateDevice;
    }

    interface CreateDevice {
        <T extends keyof DeviceTypeMap>(
            type: T,
            id: string,
            host: string,
            mode?: string
        ): DeviceTypeMap[T];
        (type: string, id: string, host: string, mode?: string): Device;
    }

    // ---------------------------------------------------------------------
    // HTTP
    // ---------------------------------------------------------------------

    /** The (superagent-defaults based) HTTP client used to talk to devices. */
    interface HttpRequest {
        get(url: string): superagent.SuperAgentRequest;
        post(url: string): superagent.SuperAgentRequest;
        put(url: string): superagent.SuperAgentRequest;
        delete(url: string): superagent.SuperAgentRequest;
        auth(username: string, password: string): this;
        set(field: string, value: string): this;
        timeout(ms: number): this;
    }

    // ---------------------------------------------------------------------
    // CoAP
    // ---------------------------------------------------------------------

    interface CoapMessage {
        /** The underlying CoAP message. */
        msg: coap.IncomingMessage;
        /** IP address of the sender. */
        host: string;
        /** CoAP device type identifier, e.g. `SHSW-1`. */
        deviceType?: string;
        deviceId?: string;
        protocolRevision?: string;
        /** Seconds the status is valid for. */
        validFor?: number;
        serial?: number;
        /** Parsed JSON payload, or the raw string if it is not valid JSON. */
        payload: any;
    }

    type CoapStatusUpdateHandler = (msg: CoapMessage) => void;

    interface Coap {
        getDescription(host: string): Promise<CoapMessage>;
        getStatus(host: string): Promise<CoapMessage>;
        listenForStatusUpdates(
            statusUpdateHandler: CoapStatusUpdateHandler | undefined | null,
            networkInterface?: string | null
        ): Promise<coap.Server>;
        /** Sends a multicast request; resolves when the timeout has passed. */
        requestStatusUpdates(
            statusUpdateHandler?: CoapStatusUpdateHandler | null,
            timeout?: number
        ): Promise<void>;
    }

    interface StatusUpdatesListenerEvents {
        start: () => void;
        stop: () => void;
        statusUpdate: (msg: CoapMessage) => void;
    }

    interface StatusUpdatesListener
        extends EventEmitter<StatusUpdatesListenerEvents> {
        readonly listening: boolean;
        start(networkInterface?: string | null): Promise<this>;
        stop(): this;
    }

    interface StatusUpdatesListenerConstructor {
        new (): StatusUpdatesListener;
    }

    // ---------------------------------------------------------------------
    // Devices
    // ---------------------------------------------------------------------

    interface DeviceEvents {
        /** A property changed. */
        change: (
            prop: string,
            newValue: any,
            oldValue: any,
            device: Device
        ) => void;
        online: (device: Device) => void;
        offline: (device: Device) => void;
        stale: (device: Device) => void;
        /** A specific property (`change:<prop>`) changed. */
        [event: `change:${string}`]: (
            newValue: any,
            oldValue: any,
            device: Device
        ) => void;
    }

    interface Device extends EventEmitter<DeviceEvents> {
        id: string;
        host: string;
        /** The device's settings, once they have been fetched. */
        settings: any;
        lastSeen: Date | null;
        /** The CoAP device type identifier. */
        readonly type: string;
        /** Human readable model name. */
        readonly modelName: string;
        online: boolean;
        /** Milliseconds until the device is considered offline. */
        ttl: number;
        name: string | undefined;
        readonly request: HttpRequest;

        /** Iterates over `[property, value]` pairs of the current mode. */
        [Symbol.iterator](): IterableIterator<[string, any]>;

        /** Applies a status update. */
        update(msg: CoapMessage): void;
        setAuthCredentials(username: string, password: string): void;
        getSettings(): Promise<any>;
        getStatus(): Promise<any>;
        reboot(): Promise<void>;
    }

    interface Switch extends Device {
        setRelay(index: number, value: boolean): Promise<void>;
    }

    interface UnknownDevice extends Device {
        /** JSON encoded status updates received from the device. */
        payload: string | null;
    }

    interface ColorOptions {
        red?: number;
        green?: number;
        blue?: number;
        white?: number;
        gain?: number;
        brightness?: number;
        temp?: number;
        switch?: boolean;
        [param: string]: string | number | boolean | undefined;
    }

    interface Shelly1 extends Switch {
        relay0: boolean;
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        externalTemperature0: number | null;
        externalTemperature1: number | null;
        externalTemperature2: number | null;
        externalHumidity: number | null;
        externalInput0: number | null;
    }

    interface Shelly1L extends Shelly1 {
        input1: number;
        inputEvent1: string;
        inputEventCounter1: number;
        power0: number;
        energyCounter0: number;
        deviceTemperature: number;
        overTemperature: boolean;
    }

    interface Shelly1PM extends Shelly1 {
        power0: number;
        energyCounter0: number;
        overPower: number;
        overPowerValue: number;
        deviceTemperature: number;
        overTemperature: number;
    }

    interface Shelly2 extends Switch {
        relay0: boolean;
        relay1: boolean;
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        input1: number;
        inputEvent1: string;
        inputEventCounter1: number;
        power0: number;
        energyCounter0: number;
        mode: 'relay' | 'roller';
        /** Only updated in `relay` mode. */
        overPower0: number;
        /** Only updated in `relay` mode. */
        overPower1: number;
        /** Only updated in `relay` mode. */
        overPowerValue: number;
        /** Only updated in `roller` mode. */
        rollerState: 'open' | 'close' | 'stop';
        /** Only updated in `roller` mode. */
        rollerPosition: number;
        /** Only updated in `roller` mode. */
        rollerStopReason: string;
        /** Moves the roller. */
        setRollerState(state: 'open' | 'close' | 'stop', duration?: number | null): Promise<any>;
        /** Moves the roller to the given position (0-100). */
        setRollerPosition(position: number): Promise<any>;
    }

    interface Shelly25 extends Shelly2 {
        /** Only updated in `relay` mode. */
        power1: number;
        /** Only updated in `relay` mode. */
        energyCounter1: number;
        deviceTemperature: number;
        overTemperature: number;
    }

    interface Shelly2LED extends Device {
        switch0: boolean;
        brightness0: number;
        switch1: boolean;
        brightness1: number;
        setWhite(index: number, brightness: number, on: boolean): Promise<void>;
    }

    interface Shelly3EM extends Switch {
        relay0: boolean;
        power0: number;
        energyCounter0: number;
        energyReturned0: number;
        powerFactor0: number;
        current0: number;
        voltage0: number;
        power1: number;
        energyCounter1: number;
        energyReturned1: number;
        powerFactor1: number;
        current1: number;
        voltage1: number;
        power2: number;
        energyCounter2: number;
        energyReturned2: number;
        powerFactor2: number;
        current2: number;
        voltage2: number;
        overPower: number;
    }

    interface Shelly4Pro extends Switch {
        power0: number;
        relay0: boolean;
        power1: number;
        relay1: boolean;
        power2: number;
        relay2: boolean;
        power3: number;
        relay3: boolean;
    }

    interface ShellyAir extends Switch {
        relay0: boolean;
        totalWorkTime: number;
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        power0: number;
        energyCounter0: number;
        overPower: number;
        overPowerValue: number;
        deviceTemperature: number;
        overTemperature: number;
        externalTemperature0: number | null;
        externalTemperature1: number | null;
        externalTemperature2: number | null;
        externalHumidity: number | null;
    }

    interface ShellyBulb extends Device {
        switch: boolean;
        red: number;
        green: number;
        blue: number;
        white: number;
        gain: number;
        brightness: number;
        colorTemperature: number;
        mode: 'color' | 'white';
        setColor(opts: ColorOptions): Promise<void>;
        setWhite(temperature: number, brightness: number, on: boolean): Promise<void>;
    }

    interface ShellyBulbRGBW extends ShellyBulb {
    }

    interface ShellyButton1 extends Device {
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        sensorError: boolean;
        charging: number;
        battery: number;
        wakeUpEvent: string;
    }

    interface ShellyButton1V2 extends ShellyButton1 {
    }

    interface ShellyColor extends Device {
        switch: boolean;
        red: number;
        green: number;
        blue: number;
        white: number;
        gain: number;
        brightness: number;
        colorTemperature: number;
        mode: 'color' | 'white';
        setColor(opts: ColorOptions): Promise<void>;
        setWhite(temperature: number, brightness: number, on: boolean): Promise<void>;
    }

    interface ShellyDimmerW1 extends Device {
        switch: boolean;
        brightness: number;
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        loadError: boolean;
        deviceTemperature: number;
        overTemperature: number;
        mode: 'white';
        setWhite(brightness: number, on: boolean): Promise<void>;
    }

    interface ShellyDimmer extends Device {
        switch: boolean;
        brightness: number;
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        input1: number;
        inputEvent1: string;
        inputEventCounter1: number;
        power0: number;
        energyCounter0: number;
        overPower: number;
        loadError: boolean;
        deviceTemperature: number;
        overTemperature: number;
        mode: 'white';
        setWhite(brightness: number, on: boolean): Promise<void>;
    }

    interface ShellyDimmer2 extends ShellyDimmer {
    }

    interface ShellyDoorWindow extends Device {
        state: number;
        tilt: number;
        vibration: number;
        illuminance: number;
        illuminanceLevel: string;
        sensorError: boolean;
        battery: number;
        wakeUpEvent: string;
    }

    interface ShellyDoorWindow2 extends ShellyDoorWindow {
        temperature: number;
    }

    interface ShellyDuo extends Device {
        switch: boolean;
        brightness: number;
        colorTemperature: number;
        whiteLevel: number;
        power0: number;
        energyCounter0: number;
        setWhite(temperature: number, brightness: number, on: boolean): Promise<void>;
    }

    interface ShellyEM extends Switch {
        relay0: boolean;
        power0: number;
        energyCounter0: number;
        energyReturned0: number;
        voltage0: number;
        power1: number;
        energyCounter1: number;
        energyReturned1: number;
        voltage1: number;
        overPower: number;
    }

    interface ShellyFlood extends Device {
        temperature: number;
        flood: number;
        sensorError: boolean;
        battery: number;
        wakeUpEvent: string;
    }

    interface ShellyGas extends Device {
        sensorOperation: string;
        selfTest: string;
        gas: string;
        concentration: number;
        valve: string;
    }

    interface ShellyHD extends Switch {
        power0: number;
        relay0: boolean;
        power1: number;
        relay1: boolean;
    }

    interface ShellyHT extends Device {
        temperature: number;
        humidity: number;
        sensorError: boolean;
        battery: number;
        wakeUpEvent: string;
    }

    interface ShellyI3 extends Device {
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        input1: number;
        inputEvent1: string;
        inputEventCounter1: number;
        input2: number;
        inputEvent2: string;
        inputEventCounter2: number;
    }

    interface ShellyMotion extends Device {
        motion: number;
        vibration: number;
        illuminance: number;
        battery: number;
    }

    interface ShellyMotion2 extends ShellyMotion {
        temperature: number;
    }

    interface ShellyPlug extends Switch {
        relay0: boolean;
        power0: number;
        energyCounter0: number;
        overPower: number;
        overPowerValue: number;
    }

    interface ShellyPlugE extends ShellyPlug {
    }

    interface ShellyPlugS extends ShellyPlug {
        deviceTemperature: number;
        overTemperature: number;
    }

    interface ShellyPlugUS extends ShellyPlug {
    }

    interface ShellyRGBW extends Device {
        switch: boolean;
        red: number;
        green: number;
        blue: number;
        white: number;
        gain: number;
        brightness: number;
        colorTemperature: number;
        mode: 'color' | 'white';
        setColor(opts: ColorOptions): Promise<void>;
        setWhite(temperature: number, brightness: number, on: boolean): Promise<void>;
    }

    interface ShellyRGBW2 extends Device {
        /** Only updated in `color` mode. */
        switch: boolean;
        /** Only updated in `color` mode. */
        red: number;
        /** Only updated in `color` mode. */
        green: number;
        /** Only updated in `color` mode. */
        blue: number;
        /** Only updated in `color` mode. */
        white: number;
        /** Only updated in `color` mode. */
        gain: number;
        /** Only updated in `white` mode. */
        switch0: boolean;
        /** Only updated in `white` mode. */
        brightness0: number;
        /** Only updated in `white` mode. */
        switch1: boolean;
        /** Only updated in `white` mode. */
        brightness1: number;
        /** Only updated in `white` mode. */
        switch2: boolean;
        /** Only updated in `white` mode. */
        brightness2: number;
        /** Only updated in `white` mode. */
        switch3: boolean;
        /** Only updated in `white` mode. */
        brightness3: number;
        power0: number;
        energyCounter0: number;
        /** Only updated in `white` mode. */
        power1: number;
        /** Only updated in `white` mode. */
        energyCounter1: number;
        /** Only updated in `white` mode. */
        power2: number;
        /** Only updated in `white` mode. */
        energyCounter2: number;
        /** Only updated in `white` mode. */
        power3: number;
        /** Only updated in `white` mode. */
        energyCounter3: number;
        overPower: number;
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        mode: 'color' | 'white';
        setColor(opts: ColorOptions): Promise<void>;
        setWhite(index: number, brightness: number, on: boolean): Promise<void>;
    }

    interface ShellySense extends Device {
        temperature: number;
        humidity: number;
        motion: number;
        illuminance: number;
        charging: number;
        battery: number;
    }

    interface ShellySmoke extends Device {
        temperature: number;
        smoke: number;
        sensorError: boolean;
        battery: number;
        wakeUpEvent: string;
    }

    interface ShellySmoke2 extends ShellySmoke {
        humidity: number;
    }

    interface ShellyTRV extends Device {
        temperature: number;
        targetTemperature: number;
        battery: number;
        sensorError: boolean;
        valveError: boolean;
        mode: number;
        status: boolean;
        valvePosition: number;
        setTargetTemperature(temperature: number): Promise<void>;
    }

    interface ShellyUni extends Switch {
        relay0: boolean;
        relay1: boolean;
        input0: number;
        inputEvent0: string;
        inputEventCounter0: number;
        input1: number;
        inputEvent1: string;
        inputEventCounter1: number;
        externalTemperature0: number | null;
        externalTemperature1: number | null;
        externalTemperature2: number | null;
        externalTemperature3: number | null;
        externalTemperature4: number | null;
        voltage0: number;
        externalHumidity: number | null;
    }

    interface ShellyVintage extends Device {
        switch: boolean;
        brightness: number;
        power0: number;
        energyCounter0: number;
        setWhite(brightness: number, on: boolean): Promise<void>;
    }
    /** Maps CoAP device type identifiers to device interfaces. */
    interface DeviceTypeMap {
        'SHSW-1': Shelly1;
        'SHSW-L': Shelly1L;
        'SHSW-PM': Shelly1PM;
        'SHSW-21': Shelly2;
        'SHSW-25': Shelly25;
        'SH2LED-1': Shelly2LED;
        'SHEM-3': Shelly3EM;
        'SHSW-44': Shelly4Pro;
        'SHAIR-1': ShellyAir;
        'SHBLB-1': ShellyBulb;
        'SHCB-1': ShellyBulbRGBW;
        'SHBTN-1': ShellyButton1;
        'SHBTN-2': ShellyButton1V2;
        'SHCL-255': ShellyColor;
        'SHDM-1': ShellyDimmer;
        'SHDM-2': ShellyDimmer2;
        'SHDIMW-1': ShellyDimmerW1;
        'SHDW-1': ShellyDoorWindow;
        'SHDW-2': ShellyDoorWindow2;
        'SHBDUO-1': ShellyDuo;
        'SHEM': ShellyEM;
        'SHWT-1': ShellyFlood;
        'SHGS-1': ShellyGas;
        'SHSW-22': ShellyHD;
        'SHHT-1': ShellyHT;
        'SHIX3-1': ShellyI3;
        'SHMOS-01': ShellyMotion;
        'SHMOS-02': ShellyMotion2;
        'SHPLG-1': ShellyPlug;
        'SHPLG2-1': ShellyPlugE;
        'SHPLG-S': ShellyPlugS;
        'SHPLG-U1': ShellyPlugUS;
        'SHRGBWW-01': ShellyRGBW;
        'SHRGBW2': ShellyRGBW2;
        'SHSEN-1': ShellySense;
        'SHSM-01': ShellySmoke;
        'SHSM-02': ShellySmoke2;
        'SHTRV-01': ShellyTRV;
        'SHUNI-1': ShellyUni;
        'SHVIN-1': ShellyVintage;
    }
}
