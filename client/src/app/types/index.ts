export * from './user'
export * from './outfit'
export * from './clothing'
export * from './modal'


export interface UseOutfitsReturn {
  outfits: any[]
  isLoadingOutfits: boolean
  fetchOutfits: () => Promise<void>
  handleLike: (outfitId: string) => Promise<void>
  addOutfit: (outfit: any) => void
}

export interface UseCameraReturn {
  showCamera: boolean
  videoRef: any
  canvasRef: any
  startCamera: (facingMode?: 'user' | 'environment') => Promise<void>
  stopCamera: () => void
  takePhoto: () => string | null
}