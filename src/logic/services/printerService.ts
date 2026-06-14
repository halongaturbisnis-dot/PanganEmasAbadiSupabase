/**
 * SERVICES/PRINTERSERVICE.TS
 * Specialized service for managing thermal printer connections and data transfer.
 * Supports Bluetooth (Web Bluetooth), USB (WebUSB), and Network (TCP/IP).
 */

import { errorService } from './errorService';

export enum PrinterConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export enum PrinterType {
  BLUETOOTH = 'bluetooth',
  USB = 'usb',
  NETWORK = 'network',
}

export interface PrinterDevice {
  id: string;
  name: string;
  type: PrinterType;
  rawDevice?: any; // The original browser device object (BluetoothDevice, USBDevice, etc.)
}

class PrinterService {
  private activeDevice: any = null;
  private characteristic: any = null; // For Bluetooth
  private status: PrinterConnectionStatus = PrinterConnectionStatus.DISCONNECTED;
  private type: PrinterType | null = null;

  getStatus(): PrinterConnectionStatus {
    return this.status;
  }

  getType(): PrinterType | null {
    return this.type;
  }

  /**
   * 1. BLUETOOTH CONNECTION (Web Bluetooth API)
   */
  async connectBluetooth(): Promise<PrinterDevice | null> {
    try {
      this.status = PrinterConnectionStatus.CONNECTING;
      
      // Request device from user
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }], // Generic printer service UUID
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristics = await service.getCharacteristics();
      
      // Find the writable characteristic
      this.characteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);

      if (!this.characteristic) {
        throw new Error('Could not find writable characteristic on this printer.');
      }

      this.activeDevice = device;
      this.status = PrinterConnectionStatus.CONNECTED;
      this.type = PrinterType.BLUETOOTH;

      return {
        id: device.id,
        name: device.name || 'BT Thermal Printer',
        type: PrinterType.BLUETOOTH,
        rawDevice: device
      };
    } catch (err) {
      this.handleError('Bluetooth', err);
      return null;
    }
  }

  /**
   * 2. USB CONNECTION (WebUSB API)
   */
  async connectUSB(): Promise<PrinterDevice | null> {
    try {
      this.status = PrinterConnectionStatus.CONNECTING;
      
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);
      await device.claimInterface(0);

      this.activeDevice = device;
      this.status = PrinterConnectionStatus.CONNECTED;
      this.type = PrinterType.USB;

      return {
        id: device.serialNumber || 'USB_PRINTER',
        name: device.productName || 'USB Thermal Printer',
        type: PrinterType.USB,
        rawDevice: device
      };
    } catch (err) {
      this.handleError('USB', err);
      return null;
    }
  }

  /**
   * 3. NETWORK CONNECTION (Generic fetch/socket placeholder)
   */
  async connectNetwork(ip: string): Promise<PrinterDevice | null> {
    try {
      this.status = PrinterConnectionStatus.CONNECTING;
      // For network, we usually don't "persist" a connection in browser context
      // but we can validate reachedability or just store the IP.
      this.activeDevice = { ip };
      this.status = PrinterConnectionStatus.CONNECTED;
      this.type = PrinterType.NETWORK;

      return {
        id: ip,
        name: `Network Printer (${ip})`,
        type: PrinterType.NETWORK
      };
    } catch (err) {
      this.handleError('Network', err);
      return null;
    }
  }

  /**
   * SEND DATA TO PRINTER
   */
  async printRaw(data: Uint8Array): Promise<boolean> {
    if (this.status !== PrinterConnectionStatus.CONNECTED) {
      console.warn('Printer is not connected.');
      return false;
    }

    try {
      if (this.type === PrinterType.BLUETOOTH) {
        // Chunk data for Bluetooth (usually MTU limit is around 20 bytes, but can be higher)
        const CHUNK_SIZE = 20;
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          await this.characteristic.writeValue(chunk);
        }
      } else if (this.type === PrinterType.USB) {
        await this.activeDevice.transferOut(1, data); // Endpoint 1 is standard for most printers
      } else if (this.type === PrinterType.NETWORK) {
        // This requires an external proxy or backend route since browsers can't open raw TCP sockets
        await fetch(`http://${this.activeDevice.ip}/print`, {
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/octet-stream' }
        });
      }
      return true;
    } catch (err) {
      this.handleError('Print', err);
      return false;
    }
  }

  private handleError(context: string, err: any) {
    this.status = PrinterConnectionStatus.ERROR;
    // Add context to error message if it's a string or has message property
    if (err && typeof err === 'object') {
      err.message = `[${context}] ${err.message || 'Unknown error'}`;
    }
    errorService.handle(err);
  }

  disconnect() {
    this.activeDevice = null;
    this.characteristic = null;
    this.status = PrinterConnectionStatus.DISCONNECTED;
    this.type = null;
  }
}

export const printerService = new PrinterService();
