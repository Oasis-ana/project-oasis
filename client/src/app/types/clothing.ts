export interface ClothingItem {
    id: string
    name: string
    brand: string
    size: string
    color: string
    category: string
    image: string
    tags: string[]
    isFavorite: boolean
    timesWorn: number
    lastWorn?: string
    createdAt: string
  }
  
  export interface ItemData {
    name: string
    brand: string
    size: string
    color: string
    category: string
    tags: string
  }
  
  export interface CreateItemRequest {
    name: string
    brand?: string
    size?: string
    color?: string
    category: string
    tags: string[]
    is_favorite: boolean
    times_worn: number
    image: File | Blob
  }
  
  export type ClothingCategory = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Shoes' | 'Accessories'