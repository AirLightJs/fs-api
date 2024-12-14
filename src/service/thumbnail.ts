import { env } from "@env/env";
import crypto from "node:crypto";
import { Fs } from "@service/fs";
import { Mime } from "@service/mime";
import * as imagemagick from "imagemagick";
import * as gm from "gm";
import ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import { NormalizedPath } from "@interface/normalized-path";

const gmImageMagick = gm.subClass({
  imageMagick: true,
});

export class Thumbnail {
  public static getThumbnail(fileFullPath: string): NormalizedPath {
    const thumbnailFileName = crypto.createHash("md5").update(fileFullPath).digest("hex") + ".jpg";
    return Fs.normalizePath(env.thumbnail.folder + "/" + thumbnailFileName);
  }

  public static writeThumbnail(fileFullPath: string): Promise<void> {
    return Fs.mkdir(env.thumbnail.folder).then(() => {
      const thumbnailFilePath = this.getThumbnail(fileFullPath);

      if (Mime.isImageFullPath(fileFullPath)) {
        return this.generateThumbnailForImage(fileFullPath, thumbnailFilePath.fullPath);

      } else if (Mime.isPdfFullPath(fileFullPath)) {
        return this.generateThumbnailForPdf(fileFullPath, thumbnailFilePath.fullPath);

      } else if (Mime.isVideoFullPath(fileFullPath)) {
        return this.generateThumbnailForVideo(fileFullPath, thumbnailFilePath.fullPath);
      }

      return Promise.resolve();
    });
  }

  public static generateThumbnailForImage(fileFullPath: string, thumbnailFilePath: string): Promise<void> {
    return new Promise((resolve) => {
      const options = {
        srcPath: fileFullPath,
        dstPath: thumbnailFilePath,
        width: env.thumbnail.width,
      };
      imagemagick.resize(options, () => resolve());
    });
  }

  public static generateThumbnailForPdf(fileFullPath: string, thumbnailFilePath: string): Promise<void> {
    return new Promise((resolve) => {
      gmImageMagick(fileFullPath)
        .density(150, 150)
        .resize(env.thumbnail.width)
        .write(thumbnailFilePath, () => resolve());
    });
  }

  public static generateThumbnailForVideo(fileFullPath: string, thumbnailFilePath: string): Promise<void> {
    return new Promise((resolve) => {
      ffmpeg(fileFullPath)
        .on("end", () => resolve())
        .on("error", () => resolve())
        .screenshots({
          timestamps: [ 1 ],
          filename: path.basename(thumbnailFilePath),
          folder: path.dirname(thumbnailFilePath),
          size: env.thumbnail.width + "x?",
        });
    });
  }
}
