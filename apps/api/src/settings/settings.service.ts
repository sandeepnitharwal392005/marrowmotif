import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const result: any = {};
    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch (e) {
        result[s.key] = s.value;
      }
    }

    // Provide defaults if missing
    return {
      homeDelivery: result.homeDelivery ?? true,
      beforeDepartureDelivery: result.beforeDepartureDelivery ?? true,
      whatsappNotifications: result.whatsappNotifications ?? true,
      googleDriveUpload: result.googleDriveUpload ?? true,
    };
  }

  async updateSettings(data: any) {
    for (const [key, value] of Object.entries(data)) {
      const valStr = JSON.stringify(value);
      await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value: valStr },
        create: { key, value: valStr },
      });
    }
    return this.getSettings();
  }
}
