import Category from '../models/Category'
import Movie from '../models/Movie'
import { ICategory } from '../types'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache'
import { logger } from '../utils/logger'
import { config } from '../config'

const CACHE_KEY = 'categories:all'

export class CategoryService {
  static async create(data: Partial<ICategory>): Promise<ICategory> {
    const category = await Category.create(data)
    await cacheDel(CACHE_KEY)
    logger.info(`Category created: ${category.slug}`)
    return category.toObject()
  }

  static async getAll(): Promise<ICategory[]> {
    const cached = await cacheGet<ICategory[]>(CACHE_KEY)
    if (cached) return cached

    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean()
    await cacheSet(CACHE_KEY, categories, config.cache.ttl)
    return categories
  }

  static async getBySlug(slug: string): Promise<ICategory | null> {
    const category = await Category.findOne({ slug })
    return category ? category.toObject() : null
  }

  static async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    const category = await Category.findByIdAndUpdate(id, data, { new: true })
    if (category) {
      await cacheDel(CACHE_KEY)
    }
    return category ? category.toObject() : null
  }

  static async delete(id: string): Promise<boolean> {
    const category = await Category.findById(id)
    if (!category) return false

    await Movie.updateMany({ categoryId: id }, { $unset: { categoryId: '' } })
    await Category.findByIdAndDelete(id)
    await cacheDel(CACHE_KEY)
    logger.info(`Category deleted: ${id}`)
    return true
  }
}
