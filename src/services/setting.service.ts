import Setting from '../models/Setting'

export class SettingService {
  static async get(key: string): Promise<string | null> {
    const setting = await Setting.findOne({ key }).lean()
    return setting?.value || null
  }

  static async set(key: string, value: string, description?: string): Promise<void> {
    await Setting.updateOne(
      { key },
      { $set: { value, description, updatedAt: new Date() } },
      { upsert: true }
    )
  }

  static async getAll(): Promise<{ key: string; value: string; description?: string }[]> {
    return Setting.find({}).lean()
  }

  static async isMaintenanceMode(): Promise<boolean> {
    const val = await this.get('maintenance_mode')
    return val === 'true'
  }

  static async toggleMaintenanceMode(): Promise<boolean> {
    const current = await this.isMaintenanceMode()
    const newVal = current ? 'false' : 'true'
    await this.set('maintenance_mode', newVal, 'Bot maintenance mode toggle')
    return !current
  }

  static async getPageSize(): Promise<number> {
    const val = await this.get('page_size')
    const num = parseInt(val || '10')
    return num > 0 && num <= 50 ? num : 10
  }

  static async setPageSize(size: number): Promise<void> {
    await this.set('page_size', String(size), 'Default pagination page size')
  }
}
