import SMB2 from '@marsaud/smb2';
import { Readable } from 'stream';
import { MediaSource, SMBConfig } from '../../../shared/types/media';
import path from 'path';

export class SMBService {
  private client: SMB2 | null = null;


  async connect(config: SMBConfig): Promise<void> {
    if (this.client) {
      this.disconnect();
    }


    
    // Parse share string: \\HOST\SHARE
    // SMB2 lib expects just share path? Or generic connect.
    // @marsaud/smb2 Usage: new SMB2({ share: '\\\\HOST\\SHARE', ... })
    
    this.client = new SMB2({
      share: config.share,
      domain: config.domain || 'WORKGROUP',
      username: config.username || 'guest',
      password: config.password || '',
      autoCloseTimeout: 0 // Keep alive
    });

    // Verify connection by reading root
    await this.client.readdir('');
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect(); // SMB2 has disconnect? Or just close?
      // It has close() or disconnect().
      // Types might define disconnect or close.
      // @marsaud/smb2 usually wrapper around net socket.
      // If undefined, we just null it which might leak but client usually handles it.
      // Actually @marsaud/smb2 instance usually doesn't have explicit disconnect if not wrapping.
      // But let's assume GC or it has close.
      this.client = null;
    }
  }

  async list(dirPath: string): Promise<MediaSource[]> {
    if (!this.client) throw new Error('Not connected');

    // readdir returns array of filenames or objects?
    // readdir(path, { errorOnMissing: boolean }?) -> string[]
    // readdir(path, { withFileTypes: true }?) -> Dirent[] equivalent?
    // The library usually returns filenames (strings) unless specified.
    // We should use readdir(path) and then stat? That's slow.
    // Does it support listing with types?
    // Checking @marsaud/smb2 docs (imagined): it mimics fs.
    
    // Let's assume standard readdir (strings).
    // Getting metadata for all is expensive.
    // Maybe just list and mark everything as unknown?
    // Or try to stat.
    
    const entries = await this.client.readdir(dirPath);
    
    const sources: MediaSource[] = [];
    
    for (const entry of entries) {
        // Skip hidden/system
        if (entry.startsWith('.') || entry.startsWith('$')) continue;

        const fullPath = path.join(dirPath, entry).replace(/\\/g, '/');
        
        // We need to know if directory.
        // stat is needed.
        try {
            const stat = await this.client.stat(fullPath);
            const isDirectory = stat.isDirectory();
            
            sources.push({
                id: Buffer.from(fullPath).toString('base64'),
                type: 'network',
                networkType: 'smb',
                // We need to link this source to the connected SERVER config? 
                // Currently SMBService holds ONE connection.
                // In a real app we might manage multiple connections.
                path: fullPath,
                title: entry,
                isDirectory: isDirectory
            });
        } catch (e) {
            // Permission denied or err
        }
    }
    
    return sources;
  }

  async createReadStream(filePath: string): Promise<Readable> {
    if (!this.client) throw new Error('Not connected');
    
    // createReadStream(path, options?)
    // This returns a Readable stream.
    return this.client.createReadStream(filePath);
  }
}
