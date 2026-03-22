"use strict";

const rpio = require("rpio");
const fs = require("fs");

let Service, Characteristic;
const cpuInfoCache = fs.readFileSync("/proc/cpuinfo", "utf8");

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform(
    "homebridge-gpio-electric-rim-lock",
    "Tiro",
    ElectricRimLockPlatform,
    true
  );
};

// Get Raspberry Pi serial number
function getSerial() {
  try {
    const serialLine = cpuInfoCache.split("\n").find((line) => line.startsWith("Serial"));
    return serialLine ? serialLine.split(":")[1].trim() : "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

// Platform class
class ElectricRimLockPlatform {

  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.accessories = [];
    this.initializedPins = new Set();

    if (!config) return;

    api.on("didFinishLaunching", () => {
      this.log("Tiro platform ready");
      this.discoverDevices();
    });
  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }

  discoverDevices() {
    const locks = this.config.locks || [];
    locks.forEach(lock => {

      if (!lock.name || lock.pin === undefined) {
        this.log.warn("⚠ Lock missing name or pin, skipping.");
        return;
      }

      const uuid = this.api.hap.uuid.generate("tiro-lock-" + lock.pin);
      const existingAccessory = this.accessories.find(a => a.UUID === uuid);

      if (existingAccessory) {
        this.log("Restoring:", existingAccessory.displayName);
        existingAccessory.context = lock;
        new ElectricRimLockAccessory(this, existingAccessory);
      } else {
        this.log("Adding:", lock.name);
        const accessory = new this.api.platformAccessory(lock.name, uuid);
        accessory.category = this.api.hap.Categories.DOOR_LOCK;
        accessory.context = lock;
        new ElectricRimLockAccessory(this, accessory);
        this.api.registerPlatformAccessories(
          "homebridge-gpio-electric-rim-lock",
          "Tiro",
          [accessory]
        );
      }

    });
  }

  initPin(pin) {

    if (this.initializedPins.has(pin)) return;
  
    rpio.open(pin, rpio.OUTPUT, rpio.LOW);
  
  	this.initializedPins.add(pin);
    this.log("GPIO initialized:", pin);
  }
}

// Electric Rim Lock Accessory
class ElectricRimLockAccessory {
  constructor(platform, accessory) {
  
    this.platform = platform;
    this.log = platform.log;
    this.accessory = accessory;

    const config = accessory.context;

    this.name = config.name;
    this.pin = config.pin;
    this.duration = config.duration || 500;
    this.version = require("./package.json").version;
    this.busy = false;

    // Validate name and pin
    if (!this.name || !this.pin) {
        this.log.error("Plugin not configured correctly: name or pin missing.");
        this.disabled = true;
        return;
    }

    // Raspberry Pi check
    if (!/Raspberry Pi/i.test(cpuInfoCache)) {
      this.log.warn("This plugin is intended for Raspberry Pi: some features may not work.");
    }  
 
  	try {
  		platform.initPin(this.pin);
	  } catch (err) {
  		this.log.error("GPIO init failed: invalid pin number.");
  		this.disabled = true;
  		return;
	  }

    this.setupInfoService();
    this.setupLockService();
  }

  setupInfoService() {

    const info =
      this.accessory.getService(Service.AccessoryInformation) ||
      this.accessory.addService(Service.AccessoryInformation);

    info
      .setCharacteristic(Characteristic.Manufacturer, "Roberto Montanari")
      .setCharacteristic(Characteristic.Model, "Tiro GPIO")
      .setCharacteristic(Characteristic.SerialNumber, getSerial() + "-" + this.pin)
      .setCharacteristic(Characteristic.FirmwareRevision, this.version);
  }

  setupLockService() {

    this.lockService =
      this.accessory.getService(Service.LockMechanism) ||
      this.accessory.addService(Service.LockMechanism, this.name);

    this.lockService
      .getCharacteristic(Characteristic.LockCurrentState)
      .onGet(() => 1);

    this.lockService
      .getCharacteristic(Characteristic.LockTargetState)
      .onGet(() => 1)
      .onSet((state) => this.setLock(state));
  }

  async setLock(state) {
    if (this.busy) {
      this.log("Ignored double trigger:", this.name);
      return;
    }

    if (state === 0) {
      this.busy = true;
      this.log("Unlock:", this.name);
      rpio.write(this.pin, 1);
      setTimeout(() => {
        rpio.write(this.pin, 0);
        this.busy = false;
      }, this.duration);
    } else {
      rpio.write(this.pin, 0);
      this.log("Locked:", this.name);
    }
  }
}
