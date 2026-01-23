import { NetworkDiscoveryService } from './NetworkDiscoveryService';
import { DLNAService } from './DLNAService';
import { SMBService } from './SMBService';
import { NetworkServer, MediaSource, SMBConfig } from '../../../shared/types/media';

export class NetworkManager {
  private discoveryService: NetworkDiscoveryService;
  private dlnaService: DLNAService;
  private smbService: SMBService;

  constructor() {
    this.discoveryService = new NetworkDiscoveryService();
    this.dlnaService = new DLNAService();
    this.smbService = new SMBService();
  }

  public startDiscovery() {
    this.discoveryService.start();
  }

  public stopDiscovery() {
    this.discoveryService.stop();
  }

  public onServerFound(callback: (server: NetworkServer) => void) {
    this.discoveryService.on('server-found', callback);
  }

  public getServers(): NetworkServer[] {
    return this.discoveryService.getServers();
  }

  public async browse(server: NetworkServer, path: string): Promise<MediaSource[]> {
    if (server.type === 'dlna') {
      return this.dlnaService.browse(server, path);
    } else if (server.type === 'smb') {
      // For SMB, browsing requires connection first usually.
      // Assuming 'path' is relative to share root.
      // If server.address/share is already connected...
      // This part depends on how we manage SMB connections statefully.
      // For now, assume SMBService handles single connection.
      return this.smbService.list(path);
    }
    return [];
  }

  public async connectSMB(config: SMBConfig) {
    await this.smbService.connect(config);
  }
  
  public getSMBStream(path: string) {
      return this.smbService.createReadStream(path);
  }
}
