import * as fs from "node:fs";
import * as pathModule from "node:path";
import axios from "axios";
import { glob } from "glob";
import { Mime } from "./mime";
import { env } from "@env/env";
import { Thumbnail } from "@service/thumbnail";
import { NormalizedPath } from "@interface/normalized-path";
import { Item } from "@interface/item";
import { UploadUrl } from "@interface/upload-url";
import { UploadBase64 } from "@interface/upload-base64";

export class Fs {
  public static normalizePath(path: string): NormalizedPath {
    const localPath = "/" + path.split("/").filter((f) => f.length && f !== "." && f !== "..").join("/");
    const fullPath = env.path + localPath;

    return { fullPath, localPath };
  }

  public static writeFile(localPath: string, fileName: string, content: any): Promise<Item> {
    return new Promise((resolve, reject) => {
      const filePath = this.normalizePath(localPath + "/" + fileName).fullPath;
      fs.writeFile(filePath, content, (err) => {
        if (err) {
          return reject(err);
        }
        Thumbnail.writeThumbnail(filePath)
          .then(() => resolve(this.info(localPath + "/" + fileName)))
          .catch((e) => reject(e));
      });
    });
  }

  public static uploadUrl(file: UploadUrl): Promise<Item> {
    return axios.get(file.url, { responseType: "arraybuffer" }).then((response) => {
      return this.mkdir(file.path).then(({ localPath }) => {
        const fileName = Mime.fileNameFromUploadUrl(file, response.headers["content-type"]);
        return this.writeFile(localPath, fileName, Buffer.from(response.data, "binary"));
      });
    });
  }

  public static uploadBase64(file: UploadBase64): Promise<Item> {
    return this.mkdir(file.path).then(({ localPath }) => {
      const fileName = Mime.fileNameFromUploadBase64(file);
      return this.writeFile(localPath, fileName, Buffer.from(file.base64, "base64"));
    });
  }

  public static mkdir(path: string): Promise<NormalizedPath> {
    return new Promise((resolve, reject) => {
      const normalizedPath = this.normalizePath(path);
      fs.mkdir(normalizedPath.fullPath, { recursive: true }, (err) => err ? reject(err) : resolve(normalizedPath));
    });
  }

  public static info(path: string): Item {
    const normalizedPath = this.normalizePath(path);
    const stat = fs.statSync(normalizedPath.fullPath);

    return {
      src: normalizedPath.localPath,
      path: pathModule.dirname(normalizedPath.localPath),
      name: pathModule.basename(normalizedPath.fullPath),
      size: stat.size,
      created: parseInt(stat.ctimeMs.toString()),
      modified: parseInt(stat.mtimeMs.toString()),
      mime: Mime.mimeFromFullPath(normalizedPath.fullPath),
      thumbnail: Thumbnail.getThumbnail(normalizedPath.fullPath).localPath,
    };
  }

  public static ls(path: string): Promise<{ folders: Item[], files: Item[] }> {
    return glob(this.normalizePath(path).fullPath + "/*").then((items) => {
      const thumbnailPath = this.normalizePath(env.thumbnail.folder);
      const folders: Item[] = [];
      const files: Item[] = [];
      items.forEach((item) => {
        if (item === thumbnailPath.fullPath) {
          return;
        }
        const itemInfo = this.info(item.substring(env.path.length));
        if (itemInfo.mime === "directory") {
          folders.push(itemInfo);
        } else {
          files.push(itemInfo);
        }
      });
      return { folders, files };
    });
  }

  public static rm(path: string): void {
    const info = this.info(path);
    fs.rmSync(this.normalizePath(info.path).fullPath, { recursive: true, force: true });
    if (info.mime !== "directory") {
      fs.rmSync(this.normalizePath(info.thumbnail).fullPath, { force: true });
    }
  }
}
