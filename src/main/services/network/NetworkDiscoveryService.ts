import { Client } from 'node-ssdp';
import { EventEmitter } from 'events';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { NetworkServer } from '../../../shared/types/media';
import { randomUUID } from 'crypto';



export class NetworkDiscoveryService extends EventEmitter {
  private client: Client;
  private servers: Map<string, NetworkServer> = new Map();
  private parser: XMLParser;

  constructor() {
    super();
    this.client = new Client();
    this.parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
    });

    this.initSSDP();
  }

  private initSSDP() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.client.on('response', async (headers: any) => {
      // We are looking for MediaServer:1 (or higher)
      // Headers keys might be uppercase or lowercase depending on implementation, node-ssdp usually normalizes?
      // Actually strictly it's raw headers. node-ssdp does some processing. 
      // The types say headers is loosely typed.
      
      const location = headers.LOCATION || headers['Location'];
      
      if (!location) return;

      // Check if we already have this server (by USN or Location)
      // USN is Unique Service Name.
      const existing = Array.from(this.servers.values()).find(s => s.location === location);
      if (existing) return;

      try {
        // Fetch device description
        const deviceData = await this.fetchDeviceDescription(location);
        if (deviceData) {
            this.servers.set(deviceData.id, deviceData);
            this.emit('server-found', deviceData);
            console.log(`[Discovery] Found server: ${deviceData.name} at ${deviceData.address}`);
        }
      } catch (err) {
        console.error(`[Discovery] Failed to fetch description from ${location}`, err);
      }
    });
  }

  public async start() {
    console.log('[Discovery] Starting SSDP search...');
    // Search for MediaServer
    this.client.search('urn:schemas-upnp-org:device:MediaServer:1');
    
    // Periodically refresh?
    // client.search returns a promise? No, it just sends packet.
  }

  public stop() {
    this.client.stop();
  }

  public getServers(): NetworkServer[] {
    return Array.from(this.servers.values());
  }

  private async fetchDeviceDescription(url: string): Promise<NetworkServer | null> {
    const response = await axios.get(url, { timeout: 5000 });
    const xml = response.data;
    const result = this.parser.parse(xml);

    // root -> device
    const device = result.root?.device;
    if (!device) return null;

    // Filter for MediaServer?
    // The ST header already filtered, but double check deviceType if needed.
    // urn:schemas-upnp-org:device:MediaServer:1

    const friendlyName = device.friendlyName || 'Unknown Server';
    const uuid = device.UDN || randomUUID();
    
    // Parse icons
    let iconUrl: string | undefined;
    if (device.iconList && device.iconList.icon) {
        const icons = Array.isArray(device.iconList.icon) ? device.iconList.icon : [device.iconList.icon];
        // Prefer png, larger size
        const bestIcon = icons.find((i: { mimetype?: string; url?: string }) => i.mimetype === 'image/png') || icons[0];
        if (bestIcon && bestIcon.url) {
            iconUrl = new URL(bestIcon.url, url).toString();
        }
    }

    const host = new URL(url).hostname;

    return {
        id: uuid,
        name: friendlyName,
        type: 'dlna',
        address: host,
        location: url, // The location of device description (XML)
        icon: iconUrl,
        requiresAuth: false // DLNA usually open inside LAN
    };
  }
}
