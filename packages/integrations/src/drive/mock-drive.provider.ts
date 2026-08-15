import { DriveFolderResult } from '@travel/types';
import { DriveProvider } from './drive.provider';

/**
 * Mock Google Drive provider for DEMO_MODE.
 * Generates realistic-looking demo folder links.
 */
export class MockDriveProvider implements DriveProvider {
  async createClientFolder(
    clientName: string,
    bookingRef: string,
  ): Promise<DriveFolderResult> {
    // Simulate API latency
    await this.delay(300 + Math.random() * 400);

    const slug = this.toSlug(clientName);
    const refSlug = bookingRef ? bookingRef.toLowerCase() : `demo-${Date.now()}`;
    const folderId = `demo_folder_${Math.random().toString(36).slice(2, 14)}`;
    const shareLink = `https://demo-drive.local/client/${slug}-${refSlug}`;

    console.log(
      `[MockDrive] ✅ Created folder for "${clientName}" (${bookingRef}): ${shareLink}`,
    );

    return {
      success: true,
      folderId,
      shareLink,
    };
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
