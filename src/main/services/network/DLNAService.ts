import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { NetworkServer, MediaSource } from '../../../shared/types/media';

export class DLNAService {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
  }

  /**
   * Resolves the ContentDirectory Control URL from the device description
   */
  private async getControlUrl(location: string): Promise<string | null> {
    try {
      const response = await axios.get(location);
      const data = this.parser.parse(response.data);
      const device = data.root?.device;
      
      if (!device) return null;

      // Find ContentDirectory service
      // serviceList -> service
      const services = Array.isArray(device.serviceList?.service) 
        ? device.serviceList.service 
        : [device.serviceList?.service].filter(Boolean);

      const cdService = services.find((s: { serviceType?: string; controlURL?: string }) => s.serviceType?.includes('ContentDirectory'));
      
      if (cdService && cdService.controlURL) {
        return new URL(cdService.controlURL, location).toString();
      }
      return null;
    } catch (e) {
      console.error('Failed to get control URL:', e);
      return null;
    }
  }

  /**
   * Browses a DLNA folder (Container)
   */
  async browse(server: NetworkServer, objectId = '0'): Promise<MediaSource[]> {
    if (!server.location) throw new Error('Server location unknown');

    const controlUrl = await this.getControlUrl(server.location);
    if (!controlUrl) throw new Error('ContentDirectory service not found');

    const soapBody = `<?xml version="1.0"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
            <ObjectID>${objectId}</ObjectID>
            <BrowseFlag>BrowseDirectChildren</BrowseFlag>
            <Filter>*</Filter>
            <StartingIndex>0</StartingIndex>
            <RequestedCount>0</RequestedCount>
            <SortCriteria></SortCriteria>
          </u:Browse>
        </s:Body>
      </s:Envelope>`;

    try {
      const response = await axios.post(controlUrl, soapBody, {
        headers: {
          'Content-Type': 'text/xml; charset="utf-8"',
          'SOAPAction': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
        }
      });

      const result = this.parser.parse(response.data);
      const browseResult = result['s:Envelope']?.['s:Body']?.['u:BrowseResponse']?.Result;
      
      if (!browseResult) return [];

      // DIDL-Lite XML is embedded as a string in the Result field
      const didlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      const didl = didlParser.parse(browseResult);
      
      const didlRoot = didl['DIDL-Lite'];
      if (!didlRoot) return [];

      const containers = didlRoot.container ? (Array.isArray(didlRoot.container) ? didlRoot.container : [didlRoot.container]) : [];
      const items = didlRoot.item ? (Array.isArray(didlRoot.item) ? didlRoot.item : [didlRoot.item]) : [];

      const mediaSources: MediaSource[] = [];

      // Process Containers (Folders)
      for (const c of containers) {
        mediaSources.push({
          id: c['@_id'],
          type: 'network',
          networkType: 'dlna',
          networkServerId: server.id,
          path: c['@_id'], // For folders, path is objectID
          title: c['dc:title'] || 'Unknown Folder',
          isDirectory: true,
        });
      }

      // Process Items (Files)
      for (const i of items) {
        const res = i.res;
        let url = '';
        if (Array.isArray(res)) {
            url = res[0]['#text'];
        } else if (res) {
            url = res['#text'];
        }

        if (url) {
            mediaSources.push({
                id: i['@_id'],
                type: 'network',
                networkType: 'dlna',
                networkServerId: server.id,
                path: url, // The actual HTTP URL
                title: i['dc:title'] || 'Unknown Item',
                artist: i['upnp:artist'],
                album: i['upnp:album'],
                duration: undefined // Parse duration from res protocolInfo if needed
            });
        }
      }

      return mediaSources;

    } catch (e) {
      console.error('DLNA Browse Error:', e);
      throw e;
    }
  }
}
