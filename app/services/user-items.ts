import type { UserCatalogItem, UserItemCategory, UserItemType } from '@/types/user-item'

export interface CreateUserItemInput {
  name: string
  description?: string
  category: UserItemCategory
  itemType: UserItemType
  unitPrice: number
  widthCm?: number | null
  heightCm?: number | null
  depthCm?: number | null
  imageFile: File
  modelFile: File
}

export interface UpdateUserItemInput {
  id: string
  name: string
  description?: string
  category: UserItemCategory
  itemType: UserItemType
  unitPrice: number
  widthCm?: number | null
  heightCm?: number | null
  depthCm?: number | null
  imageFile?: File | null
  modelFile?: File | null
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error
    }
  } catch {}
  return `Request failed (${response.status})`
}

export async function listUserItems(): Promise<UserCatalogItem[]> {
  const response = await fetch('/api/user-items', { method: 'GET', cache: 'no-store' })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  const body = (await response.json()) as { items?: UserCatalogItem[] }
  return Array.isArray(body.items) ? body.items : []
}

export async function createUserItem(input: CreateUserItemInput): Promise<UserCatalogItem> {
  const formData = new FormData()
  formData.append('name', input.name)
  formData.append('description', input.description ?? '')
  formData.append('category', input.category)
  formData.append('itemType', String(input.itemType))
  formData.append('unitPrice', String(input.unitPrice))
  formData.append('widthCm', input.widthCm == null ? '' : String(input.widthCm))
  formData.append('heightCm', input.heightCm == null ? '' : String(input.heightCm))
  formData.append('depthCm', input.depthCm == null ? '' : String(input.depthCm))
  formData.append('image', input.imageFile)
  formData.append('model', input.modelFile)

  const response = await fetch('/api/user-items', {
    method: 'POST',
    body: formData
  })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  const body = (await response.json()) as { item: UserCatalogItem }
  return body.item
}

export async function updateUserItem(input: UpdateUserItemInput): Promise<UserCatalogItem> {
  const formData = new FormData()
  formData.append('name', input.name)
  formData.append('description', input.description ?? '')
  formData.append('category', input.category)
  formData.append('itemType', String(input.itemType))
  formData.append('unitPrice', String(input.unitPrice))
  formData.append('widthCm', input.widthCm == null ? '' : String(input.widthCm))
  formData.append('heightCm', input.heightCm == null ? '' : String(input.heightCm))
  formData.append('depthCm', input.depthCm == null ? '' : String(input.depthCm))
  if (input.imageFile) {
    formData.append('image', input.imageFile)
  }
  if (input.modelFile) {
    formData.append('model', input.modelFile)
  }

  const response = await fetch(`/api/user-items/${input.id}`, {
    method: 'PATCH',
    body: formData
  })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  const body = (await response.json()) as { item: UserCatalogItem }
  return body.item
}

export async function deleteUserItem(id: string): Promise<void> {
  const response = await fetch(`/api/user-items/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
}
