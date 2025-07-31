import { RefObject } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface CameraModalProps extends ModalProps {
  videoRef: RefObject<HTMLVideoElement | null>
  onTakePhoto: () => void
  tip?: string
}

export interface SuccessModalProps extends ModalProps {
  title: string
  message: string
}

export interface DeleteConfirmModalProps extends ModalProps {
  onConfirm: () => void
  title: string
  message: string
  itemName?: string
}

export interface CreateModalProps extends ModalProps {
  onSave: (data: any, image: Blob) => Promise<void>
  isUploading: boolean
}