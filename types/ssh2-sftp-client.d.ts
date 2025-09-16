declare module "ssh2-sftp-client" {
  class SftpClient {
    connect(options: {
      host: string;
      port?: number;
      username: string;
      password?: string;
      privateKey?: string | Buffer;
      passphrase?: string;
    }): Promise<void>;
    end(): Promise<void>;
    exists(remotePath: string): Promise<boolean | "d" | "-" | "l">;
    mkdir(remotePath: string, recursive?: boolean): Promise<void>;
    rmdir(remotePath: string, recursive?: boolean): Promise<void>;
    fastPut(localPath: string, remotePath: string): Promise<void>;
    delete(remotePath: string): Promise<void>;
  }
  export default SftpClient;
}

