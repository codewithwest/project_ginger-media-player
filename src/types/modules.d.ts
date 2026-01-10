declare module 'ffmpeg-static' {
  const path: string;
  export = path;
}

declare module 'ffprobe-static' {
  export const path: string;
}

declare module 'get-port' {
  interface Options {
    port?: number | number[];
    host?: string;
  }
  function getPort(options?: Options): Promise<number>;
  export default getPort;
}
