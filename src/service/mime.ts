import fs from "node:fs";
import { UploadUrl } from "@interface/upload-url";
import { UploadBase64 } from "@interface/upload-base64";

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charactersLength = characters.length;

export class Mime {
  public static signatures = {
    JVBERi0: "application/pdf",
    R0lGOD: "image/gif",
    iVBORw0KGgo: "image/png",
    "/9j/": "image/jpg",
  };

  public static ext = {
    "application/pdf": "pdf",
    "image/gif": "gif",
    "image/png": "png",
    "image/jpg": "jpg",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
  };

  public static defaultMimeType = "application/octet-stream";
  public static defaultExt = "data";

  public static id(length: number = 32): string {
    let result = "";
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  public static fromBase64(base64String: string): string {
    for (const s in this.signatures) {
      if (base64String.indexOf(s) === 0) {
        return this.signatures[s];
      }
    }
    return this.defaultMimeType;
  }

  public static extFromBase64(base64String: string): string {
    return this.extFromMime(
      Mime.fromBase64(base64String),
    );
  }

  public static extFromMime(mime: string): string {
    return this.ext[mime] || this.defaultExt;
  }

  public static fileNameFromUploadUrl(file: UploadUrl, expectedMimeType: string): string {
    if (file.name) {
      return file.name;
    } else {
      try {
        let fileUrlPart = file.url.split("?")[0].split("/");
        return fileUrlPart[fileUrlPart.length - 1];
      } catch {
        return this.id() + "." + Mime.extFromMime(expectedMimeType);
      }
    }
  }

  public static fileNameFromUploadBase64(file: UploadBase64): string {
    if (file.name) {
      return file.name;
    }
    return this.id() + "." + Mime.extFromBase64(file.base64);
  }

  public static mimeFromFullPath(path: string): string {
    if (fs.lstatSync(path).isDirectory()) {
      return "directory";
    }
    let pathExt: any = path.split(".");
    pathExt = pathExt[pathExt.length - 1].toString().toLowerCase();

    for (const [ mime, ext ] of Object.entries(this.ext)) {
      if (pathExt === ext) {
        return mime;
      }
    }
    return this.defaultMimeType;
  }

  public static isImageMime(mime: string): boolean {
    return mime === "image/png" || mime === "image/jpg" || mime === "image/gif";
  }

  public static isImageFullPath(path: string): boolean {
    return this.isImageMime(this.mimeFromFullPath(path));
  }

  public static isPdfFullPath(path: string): boolean {
    return this.mimeFromFullPath(path) === "application/pdf";
  }

  public static isVideoFullPath(path: string): boolean {
    return [ "video/mp4", "video/quicktime", "video/x-msvideo" ].includes(this.mimeFromFullPath(path));
  }
}
