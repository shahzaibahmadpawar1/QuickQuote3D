import type {
  CreateUserTextureInput,
  UpdateUserTextureInput,
  UserCatalogTexture
} from '@/types/user-texture'

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error
    }
  } catch {}
  return `Request failed (${response.status})`
}

export async function listUserTextures(): Promise<UserCatalogTexture[]> {
  const response = await fetch('/api/user-textures', { method: 'GET', cache: 'no-store' })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  const body = (await response.json()) as { textures?: UserCatalogTexture[] }
  return Array.isArray(body.textures) ? body.textures : []
}

export async function createUserTexture(input: CreateUserTextureInput): Promise<UserCatalogTexture> {
  const formData = new FormData()
  formData.append('name', input.name)
  formData.append('surface', input.surface)
  formData.append('pricePerUnit', String(input.pricePerUnit))
  formData.append('priceUnit', input.priceUnit)
  formData.append('stretch', String(input.stretch))
  formData.append('scale', String(input.scale))
  formData.append('image', input.imageFile)

  const response = await fetch('/api/user-textures', {
    method: 'POST',
    body: formData
  })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  const body = (await response.json()) as { texture: UserCatalogTexture }
  return body.texture
}

export async function updateUserTexture(input: UpdateUserTextureInput): Promise<UserCatalogTexture> {
  const formData = new FormData()
  formData.append('name', input.name)
  formData.append('surface', input.surface)
  formData.append('pricePerUnit', String(input.pricePerUnit))
  formData.append('priceUnit', input.priceUnit)
  formData.append('stretch', String(input.stretch))
  formData.append('scale', String(input.scale))
  if (input.imageFile) {
    formData.append('image', input.imageFile)
  }

  const response = await fetch(`/api/user-textures/${input.id}`, {
    method: 'PATCH',
    body: formData
  })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  const body = (await response.json()) as { texture: UserCatalogTexture }
  return body.texture
}

export async function deleteUserTexture(id: string): Promise<void> {
  const response = await fetch(`/api/user-textures/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await readError(response))
  }
}
