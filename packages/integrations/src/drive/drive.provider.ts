import { DriveFolderResult } from '@travel/types';

export interface DriveProvider {
  createClientFolder(
    clientName: string,
    bookingRef: string,
  ): Promise<DriveFolderResult>;
}
