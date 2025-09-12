import ClientGallery from '@/components/stickers/client-gallery'
import type { Saint, Location, Sticker } from './types'

export type { Saint, Location, Sticker }

interface GalleryPageProps {
  selectedLocation: string
}

export default function GalleryPage({ selectedLocation }: GalleryPageProps) {
  return <ClientGallery selectedLocation={selectedLocation} />
}