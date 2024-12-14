import { Fs } from "@service/fs";
import { Item } from "@interface/item";
import { UploadUrl } from "@interface/upload-url";
import { UploadBase64 } from "@interface/upload-base64";

export class Controller {
  public static mkdir({ path, folder }): Promise<Item> {
    return Fs.mkdir(path + "/" + folder).then(({ localPath }) => Fs.info(localPath));
  }

  public static ls({ path }): Promise<{ folders: Item[], files: Item[] }> {
    return Fs.ls(path);
  }

  public static info(paths: string[]): Promise<Item[]> {
    return Promise.resolve(paths.map((path) => Fs.info(path)));
  }

  public static rm({ path }): Promise<void> {
    Fs.rm(path);
    return Promise.resolve();
  }

  static uploadUrl(files: UploadUrl[]): Promise<Item[]> {
    return Promise.all(files.map((file) => Fs.uploadUrl(file)));
  }

  static uploadBase64(files: UploadBase64[]): Promise<Item[]> {
    return Promise.all(files.map((file) => Fs.uploadBase64(file)));
  }
}
