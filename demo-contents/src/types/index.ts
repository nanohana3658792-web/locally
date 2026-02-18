export interface LatLng {
  lat: number
  lng: number
}

export interface PolygonArea {
  id: string
  storeId: string
  productShortId: string
  vertices: LatLng[]
  color: string
  opacity: number
  label: string
  areaSizeKm2?: number
  isPremiumArea?: boolean
}

export interface Store {
  id: string
  name: string
  category: string
  position: LatLng
  polygonAreas: PolygonArea[]
}

export interface Product {
  productShortId: string
  name: string
  price: number
  description: string
  imageUrl: string
  ecUrl: string
  stock: 'available' | 'few' | 'none'
  category: string
  isPremiumId?: boolean
  goroawase?: string
  monthlyFee: number
}

export interface StoreProductList {
  storeId: string
  products: Product[]
}

export interface MapConfig {
  center: LatLng
  zoomLevel: number
  minZoom: number
  maxZoom: number
  scaleUnit: 'm' | 'km'
}

export interface DemoPattern {
  id: string
  name: string
  useCase: string
  areaScale: 'S' | 'M' | 'L'
  idDigits: number
  companyScale: string
  monthlyEstimate: string
  description: string
  mapConfig: MapConfig
  stores: Store[]
  productLists: StoreProductList[]
  sampleIds: string[]
  hasDuplicateIds: boolean
}
