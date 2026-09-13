import { DriveFolderResult } from '@travel/types';

export interface DriveProvider {
  createClientFolder(
    folderName: string,
    customerEmail: string,
  ): Promise<DriveFolderResult>;
}
