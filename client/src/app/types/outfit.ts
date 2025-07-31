export interface Outfit {
  id: string
  title: string
  description?: string 
  image: string
  tags: string[]
  category: string
  timePosted: string
  liked: boolean
  created_at: string
  occasion?: string 
}

export interface OutfitData {
  title: string
  description: string
  category: string
  tags: string
  occasion: string
}

export interface CreateOutfitRequest {
  title: string
  description?: string
  category: string
  tags: string[]
  occasion?: string
  image: File | Blob
}