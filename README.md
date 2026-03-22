# homebridge-gpio-electric-rim-lock

![npm version](https://img.shields.io/npm/v/homebridge-gpio-electric-rim-lock)
![license](https://img.shields.io/npm/l/homebridge-gpio-electric-rim-lock)
![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi-red)
[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?color=%23491F59&style=flat)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

Homebridge plugin to control **electric rim locks** using Raspberry Pi GPIO pins.
This plugin allows you to open electric rim locks from **Apple HomeKit** by triggering a relay connected to a Raspberry Pi.


## Compatibility

This plugin is designed to run **only on Raspberry Pi hardware** because it uses the `rpio` library to access GPIO pins.

⚠️ The plugin **will not work on**:

- non-Raspberry Pi Linux systems
- virtual machines
- Docker containers without GPIO access


## Hardware Setup

This plugin assumes that the Raspberry Pi controls an **electric rim lock via a relay module**.

Electric rim locks usually include a **wall button** that briefly closes a circuit to unlock the door.  
On many systems this is a **12V AC circuit**.

The Raspberry Pi **must not be connected directly to the lock**, therefore a **relay module** is required.

When HomeKit sends the unlock command:

1. the GPIO pin activates the relay
2. the relay closes the circuit
3. the door unlocks
4. the relay is released after the configured delay


## Circuit Diagram

<img width="930" height="460" alt="schematic" src="https://github.com/user-attachments/assets/d1b19ad1-3346-4870-9b0b-4e80f4411840" />


## Installation

### Install via Homebridge UI (Recommended)

1. Open the **Homebridge UI**
2. Navigate to **Plugins**
3. Search for: ``` homebridge-gpio-electric-rim-lock ```
4. Click **Install**

### Install via npm

```
npm install -g homebridge-gpio-electric-rim-lock
```

Restart **Homebridge** after installation.


## Configuration

### Using the Homebridge UI

The plugin includes a configuration interface.

Navigate to: Plugins → **Homebridge GPIO Electric Rim Lock** → Settings

### Manual Configuration

Add the following to your Homebridge `config.json`.

Example:

```json
{
  "platforms": [
    {
      "platform": "Tiro",
      "locks": [
        {
          "name": "Front Door",
          "pin": 11,
          "duration": 500
        },
        {
          "name": "Back Door",
          "pin": 12,
          "duration": 700
        }
      ]
    }
  ]
}
```


## Configuration Options

| Field | Required | Description |
|------|------|------|
| `name` | yes | Name of the door lock shown in HomeKit |
| `pin` | yes | Physical GPIO pin connected to the relay (recommended 11, 12, 13 or 15)|
| `duration` | no | Relay activation time in milliseconds (from 100 to 2000, default **500 ms**) |


## Troubleshooting

### Plugin does not start

Make sure Homebridge is running on a **Raspberry Pi**.

You can verify this with:

```
cat /proc/cpuinfo
```

### Relay does not trigger

Check:

- correct GPIO **pin number**
- relay module **power supply**
- GPIO permissions

### GPIO permission errors

Run Homebridge with appropriate permissions or add the user to the `gpio` group.

Example:

```
sudo usermod -aG gpio homebridge
```

Restart the system after changing group permissions.


## Safety Notice

This plugin controls **physical door locks**.

Always ensure:

- your wiring is correct
- relay modules are properly isolated
- the door can still be opened manually in case of failure

The author is **not responsible for damage or security issues** caused by improper installation.
