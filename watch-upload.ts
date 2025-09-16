import chokidar from "chokidar";
import SftpClient from "ssh2-sftp-client";
import path from "path";
import fs from "fs";

// Config
const USERNAME = Bun.env.SFTP_USERNAME ?? "";
const LOCAL_DIR = path.resolve(process.cwd(), "wits_upload");
const REMOTE_BASE = `/srv/home/${USERNAME}/public_html`;
const SFTP_HOST = "wits.ruc.dk";
const SFTP_PORT = 22;
const SFTP_USERNAME = USERNAME;
const SFTP_PASSWORD = Bun.env.SFTP_PASSWORD ?? "";

type UploadTask = {
  type: "full-sync" | "single-file" | "delete";
  localPath?: string;
  remotePath?: string;
};

const uploadQueue: UploadTask[] = [];
let processing = false;
let debounceTimer: Timer | undefined;

const ensureRemoteDir = async (sftp: SftpClient, remoteDir: string) => {
  const dirs: string[] = [];
  let current = remoteDir;
  while (true) {
    const parent = path.posix.dirname(current);
    if (parent === current) {
      dirs.push(current);
      break;
    }
    dirs.push(current);
    current = parent;
  }
  dirs.reverse();
  for (const d of dirs) {
    try {
      // @ts-ignore types allow exists returning boolean | string
      const exists = await sftp.exists(d);
      if (!exists) {
        await sftp.mkdir(d, true);
      }
    } catch (err) {
      // Try to mkdir recursively
      try {
        await sftp.mkdir(d, true);
      } catch {
        // ignore if already exists or cannot be created yet
      }
    }
  }
};

const walkLocalFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkLocalFiles(full));
    else if (e.isFile()) files.push(full);
  }
  return files;
};

const toRemote = (localPath: string): string => {
  const rel = path.relative(LOCAL_DIR, localPath);
  const posixRel = rel.split(path.sep).join(path.posix.sep);
  return path.posix.join(REMOTE_BASE, posixRel);
};

const processQueue = async () => {
  if (processing) return;
  processing = true;
  try {
    while (uploadQueue.length > 0) {
      const task = uploadQueue.shift()!;
      const sftp = new SftpClient();
      try {
        await sftp.connect({
          host: SFTP_HOST,
          port: SFTP_PORT,
          username: SFTP_USERNAME,
          password: SFTP_PASSWORD
        });

        if (task.type === "full-sync") {
          const allFiles = walkLocalFiles(LOCAL_DIR);
          for (const file of allFiles) {
            const remote = toRemote(file);
            await ensureRemoteDir(sftp, path.posix.dirname(remote));
            await sftp.fastPut(file, remote);
          }
        } else if (
          task.type === "single-file" &&
          task.localPath &&
          task.remotePath
        ) {
          await ensureRemoteDir(sftp, path.posix.dirname(task.remotePath));
          await sftp.fastPut(task.localPath, task.remotePath);
        } else if (task.type === "delete" && task.remotePath) {
          try {
            // try delete file
            await sftp.delete(task.remotePath);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("SFTP operation failed:", err);
      } finally {
        try {
          await sftp.end();
        } catch {}
      }
    }
  } finally {
    processing = false;
  }
};

const scheduleFullSync = () => {
  console.log("Scheduling full sync");
  // Debounce multiple rapid events
  if (debounceTimer) clearTimeout(debounceTimer as unknown as number);
  // @ts-ignore node/bun timer types
  debounceTimer = setTimeout(() => {
    uploadQueue.push({ type: "full-sync" });
    processQueue();
  }, 500);
};

const main = async () => {
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error(`Local directory not found: ${LOCAL_DIR}`);
    process.exit(1);
  }

  // Initial full sync on start
  uploadQueue.push({ type: "full-sync" });
  processQueue();

  const watcher = chokidar.watch(LOCAL_DIR, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 50
    }
  });

  watcher
    .on("add", () => scheduleFullSync())
    .on("change", () => scheduleFullSync())
    .on("addDir", () => scheduleFullSync())
    .on("unlink", (localPath: string) => {
      const remotePath = toRemote(localPath);
      uploadQueue.push({ type: "delete", remotePath });
      processQueue();
    })
    .on("unlinkDir", () => scheduleFullSync()) // Simplify by full sync on dir removals
    .on("error", (err) => console.error("Watcher error:", err));

  console.log(
    `Watching for changes in ${LOCAL_DIR} and syncing to ${SFTP_HOST}:${REMOTE_BASE}`
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
