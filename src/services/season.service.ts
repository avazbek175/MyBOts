import Season from '../models/Season'
import Series from '../models/Series'
import Episode from '../models/Episode'
import { ISeason } from '../types'
import { logger } from '../utils/logger'

export class SeasonService {
  static async create(data: Partial<ISeason>): Promise<ISeason> {
    const season = await Season.create(data)
    await Series.findByIdAndUpdate(data.seriesId, { $inc: { totalSeasons: 1 } })
    logger.info(`Season created: ${data.seriesId} - Season ${data.seasonNumber}`)
    return season.toObject()
  }

  static async getById(id: string): Promise<ISeason | null> {
    const season = await Season.findById(id)
    return season ? season.toObject() : null
  }

  static async getBySeries(seriesId: string): Promise<ISeason[]> {
    return Season.find({ seriesId }).sort({ seasonNumber: 1 }).lean()
  }

  static async getByNumber(seriesId: string, seasonNumber: number): Promise<ISeason | null> {
    const season = await Season.findOne({ seriesId, seasonNumber })
    return season ? season.toObject() : null
  }

  static async update(id: string, data: Partial<ISeason>): Promise<ISeason | null> {
    const season = await Season.findByIdAndUpdate(id, data, { new: true })
    return season ? season.toObject() : null
  }

  static async delete(id: string): Promise<boolean> {
    const season = await Season.findById(id)
    if (!season) return false

    await Episode.deleteMany({ seasonId: id })
    await Series.findByIdAndUpdate(season.seriesId, { $inc: { totalSeasons: -1 } })
    await Season.findByIdAndDelete(id)
    logger.info(`Season deleted: ${id}`)
    return true
  }
}
