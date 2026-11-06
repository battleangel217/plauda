'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getStoredUser } from '@/lib/auth-client'
import { merchantJson } from '@/lib/merchant-client'
import type { DeliveryZone, Product } from '@/lib/backend-types'
import { formatMoney } from '@/lib/order-utils'

type VariantDraft = {
  id?: string
  name: string
  options: string
  price_override: string
  stock: string
}

type ProductDraft = {
  id?: string
  name: string
  description: string
  price: string
  active: boolean
  variants: VariantDraft[]
}

type ZoneDraft = {
  id?: string
  name: string
  areas: string
  fee: string
  eta_days: string
}

function emptyVariant(): VariantDraft {
  return { name: '', options: '', price_override: '', stock: '0' }
}

function newProductDraft(): ProductDraft {
  return {
    name: '',
    description: '',
    price: '',
    active: true,
    variants: [emptyVariant()],
  }
}

function formatOptions(options: Record<string, unknown>) {
  return Object.entries(options)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ')
}

function parseOptions(value: string) {
  const options: Record<string, string> = {}
  for (const part of value.split(',').map((item) => item.trim()).filter(Boolean)) {
    const separator = part.indexOf(':')
    if (separator === -1) {
      options.Option = part
      continue
    }
    const key = part.slice(0, separator).trim()
    const item = part.slice(separator + 1).trim()
    if (key && item) options[key] = item
  }
  return options
}

function productToDraft(product: Product): ProductDraft {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    active: product.active,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      options: formatOptions(variant.options),
      price_override: variant.price_override ?? '',
      stock: String(variant.stock),
    })),
  }
}

function variantPayload(variant: VariantDraft) {
  return {
    name: variant.name.trim(),
    options: parseOptions(variant.options),
    price_override: variant.price_override ? Number(variant.price_override) : null,
    stock: Math.max(0, Math.round(Number(variant.stock) || 0)),
  }
}

function stockTotal(product: Product) {
  if (!product.variants.length) return null
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0)
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback
}

export function CataloguePage() {
  const [tab, setTab] = useState<'products' | 'zones'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [currency, setCurrency] = useState('USD')
  const [query, setQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<ProductDraft | null>(null)
  const [zoneDraft, setZoneDraft] = useState<ZoneDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextProducts, nextZones] = await Promise.all([
        merchantJson<Product[]>('/products?include_inactive=true'),
        merchantJson<DeliveryZone[]>('/delivery-zones'),
      ])
      setProducts(nextProducts)
      setZones(nextZones)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load your catalogue.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const user = getStoredUser()
    if (user) setCurrency(user.merchant.currency)
    void load()
  }, [load])

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) &&
          (!activeOnly || product.active),
      ),
    [activeOnly, products, query],
  )

  const saveProduct = async () => {
    if (!draft || saving) return
    if (!draft.name.trim() || !Number(draft.price)) {
      setError('A product needs a name and a positive price.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (!draft.id) {
        const created = await merchantJson<Product>('/products', {
          method: 'POST',
          body: JSON.stringify({
            name: draft.name.trim(),
            description: draft.description,
            price: Number(draft.price),
            active: draft.active,
            variants: draft.variants
              .filter((variant) => variant.name.trim())
              .map(variantPayload),
          }),
        })
        setProducts((current) => [created, ...current])
      } else {
        const original = products.find((product) => product.id === draft.id)
        await merchantJson<Product>(`/products/${encodeURIComponent(draft.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: draft.name.trim(),
            description: draft.description,
            price: Number(draft.price),
            active: draft.active,
          }),
        })

        for (const variant of draft.variants.filter((item) => item.name.trim())) {
          if (variant.id) {
            await merchantJson(`/products/${encodeURIComponent(draft.id)}/variants/${encodeURIComponent(variant.id)}`, {
              method: 'PATCH',
              body: JSON.stringify(variantPayload(variant)),
            })
          } else {
            await merchantJson(`/products/${encodeURIComponent(draft.id)}/variants`, {
              method: 'POST',
              body: JSON.stringify(variantPayload(variant)),
            })
          }
        }

        for (const variant of original?.variants ?? []) {
          if (!draft.variants.some((item) => item.id === variant.id)) {
            await merchantJson(
              `/products/${encodeURIComponent(draft.id)}/variants/${encodeURIComponent(variant.id)}`,
              { method: 'DELETE' },
            )
          }
        }

        await load()
      }
      setDraft(null)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save this product.'))
    } finally {
      setSaving(false)
    }
  }

  const toggleProduct = async (product: Product) => {
    try {
      const updated = await merchantJson<Product>(`/products/${encodeURIComponent(product.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !product.active }),
      })
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (caught) {
      setError(errorMessage(caught, 'Could not update this product.'))
    }
  }

  const deleteProduct = async () => {
    if (!deleteTarget) return
    try {
      await merchantJson(`/products/${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE' })
      setProducts((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not delete this product. Deactivate it instead.'))
      setDeleteTarget(null)
    }
  }

  const saveZone = async () => {
    if (!zoneDraft || saving) return
    if (!zoneDraft.name.trim()) {
      setError('A delivery zone needs a name.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: zoneDraft.name.trim(),
        areas: zoneDraft.areas.split(',').map((area) => area.trim()).filter(Boolean),
        fee: Number(zoneDraft.fee) || 0,
        eta_days: Math.max(0, Math.round(Number(zoneDraft.eta_days) || 0)),
      }
      if (zoneDraft.id) {
        await merchantJson(`/delivery-zones/${encodeURIComponent(zoneDraft.id)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await merchantJson('/delivery-zones', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      await load()
      setZoneDraft(null)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save this delivery zone.'))
    } finally {
      setSaving(false)
    }
  }

  const deleteZone = async (zone: DeliveryZone) => {
    if (!window.confirm(`Delete the ${zone.name} delivery zone?`)) return
    try {
      await merchantJson(`/delivery-zones/${encodeURIComponent(zone.id)}`, { method: 'DELETE' })
      setZones((current) => current.filter((item) => item.id !== zone.id))
    } catch (caught) {
      setError(errorMessage(caught, 'Could not delete this delivery zone.'))
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="border-b px-4 py-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Catalogue
            </p>
            <h1 className="mt-1 text-3xl">Products</h1>
            <span className="mt-3 block h-px w-20 bg-[linear-gradient(90deg,var(--primary),transparent)]" />
          </div>
          {tab === 'products' ? (
            <Button onClick={() => setDraft(newProductDraft())}>
              <Plus data-icon="inline-start" /> Add product
            </Button>
          ) : (
            <Button
              onClick={() =>
                setZoneDraft({ name: '', areas: '', fee: '0', eta_days: '3' })
              }
            >
              <Plus data-icon="inline-start" /> Add zone
            </Button>
          )}
        </div>
        <div className="mt-5 flex gap-5 text-sm">
          {(['products', 'zones'] as const).map((value) => (
            <button
              key={value}
              className={`border-b-2 pb-2 ${
                tab === value
                  ? 'border-primary font-medium'
                  : 'border-transparent text-muted-foreground'
              }`}
              onClick={() => setTab(value)}
            >
              {value === 'products' ? 'Products' : 'Delivery zones'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive md:mx-8">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">
            <X className="size-4" />
          </button>
        </div>
      )}

      {tab === 'products' ? (
        <section className="p-4 md:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                className="pl-9"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="accent-primary"
                checked={activeOnly}
                onChange={(event) => setActiveOnly(event.target.checked)}
              />
              Active only
            </label>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading catalogue…
            </div>
          ) : (
            <div className="overflow-x-auto border-y">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3">Product</th>
                    <th className="py-3">Variants</th>
                    <th className="py-3">Price</th>
                    <th className="py-3">Total stock</th>
                    <th className="py-3">Active</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const stock = stockTotal(product)
                    return (
                      <tr key={product.id} className="border-t hover:bg-muted/30">
                        <td className="py-3">
                          <button
                            className="text-left font-medium hover:underline"
                            onClick={() => setDraft(productToDraft(product))}
                          >
                            {product.name}
                          </button>
                          <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                            {product.description || 'No description'}
                          </p>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {product.variants.length}
                        </td>
                        <td className="py-3 font-mono">
                          {formatMoney(product.price, product.currency)}
                        </td>
                        <td className={`py-3 font-mono ${stock !== null && stock < 5 ? 'text-amber-300' : ''}`}>
                          {stock === null ? '—' : stock}
                        </td>
                        <td className="py-3">
                          <button
                            aria-label={`Set ${product.name} ${product.active ? 'inactive' : 'active'}`}
                            onClick={() => void toggleProduct(product)}
                            className={`relative h-5 w-9 rounded-full border transition-colors ${
                              product.active
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-border bg-muted'
                            }`}
                          >
                            <span
                              className={`absolute left-0.5 top-0.5 size-3.5 rounded-full bg-white shadow-sm transition-transform ${
                                product.active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setDraft(productToDraft(product))}
                              className="rounded px-2 py-1 text-xs text-primary hover:bg-muted"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="grid place-items-center gap-3 py-16 text-sm text-muted-foreground">
                  <Package className="size-7" />
                  <p>{products.length ? 'No products match your search.' : 'No products yet. Add your first product.'}</p>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="p-4 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading delivery zones…
            </div>
          ) : (
            <div className="overflow-x-auto border-y">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3">Name</th>
                    <th className="py-3">Areas</th>
                    <th className="py-3">Fee</th>
                    <th className="py-3">ETA in days</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id} className="border-t">
                      <td className="py-3 font-medium">{zone.name}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {zone.areas.map((area) => (
                            <Badge key={area} variant="secondary">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 font-mono">{formatMoney(zone.fee, currency)}</td>
                      <td className="py-3 font-mono">{zone.eta_days}</td>
                      <td className="py-3 text-right">
                        <button
                          className="mr-2 text-xs text-primary hover:underline"
                          onClick={() =>
                            setZoneDraft({
                              id: zone.id,
                              name: zone.name,
                              areas: zone.areas.join(', '),
                              fee: zone.fee,
                              eta_days: String(zone.eta_days),
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-destructive hover:underline"
                          onClick={() => void deleteZone(zone)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {zones.length === 0 && (
                <div className="grid place-items-center gap-3 py-16 text-sm text-muted-foreground">
                  <MoreHorizontal className="size-7" />
                  <p>No delivery zones yet. Add one so customers can check delivery.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {draft && (
        <ProductDrawer
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          currency={currency}
          onSave={() => void saveProduct()}
          onCancel={() => setDraft(null)}
        />
      )}

      {zoneDraft && (
        <ZoneDialog
          draft={zoneDraft}
          setDraft={setZoneDraft}
          saving={saving}
          onSave={() => void saveZone()}
          onCancel={() => setZoneDraft(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm border bg-background p-5">
            <h2 className="text-lg">Delete product?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {deleteTarget.name} will be removed permanently. Products with order history can only be
              deactivated.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => void deleteProduct()}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductDrawer({
  draft,
  setDraft,
  saving,
  currency,
  onSave,
  onCancel,
}: {
  draft: ProductDraft
  setDraft: (draft: ProductDraft) => void
  saving: boolean
  currency: string
  onSave: () => void
  onCancel: () => void
}) {
  const update = (patch: Partial<ProductDraft>) => setDraft({ ...draft, ...patch })
  const updateVariant = (index: number, patch: Partial<VariantDraft>) =>
    update({
      variants: draft.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    })

  return (
    <div className="fixed inset-0 z-30">
      <button aria-label="Close editor" className="absolute inset-0 bg-black/20" onClick={onCancel} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col border-l bg-background">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-xl">{draft.name || 'New product'}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{draft.id ? 'Editing product' : 'Unsaved new product'}</p>
          </div>
          <button aria-label="Close" onClick={onCancel}>
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-4">
            <label className="text-sm">
              Name
              <Input
                value={draft.name}
                onChange={(event) => update({ name: event.target.value })}
                className="mt-1"
                placeholder="Canvas tote"
              />
            </label>
            <label className="text-sm">
              Description
              <Textarea
                value={draft.description}
                onChange={(event) => update({ description: event.target.value })}
                className="mt-1 min-h-24"
                placeholder="What is this product?"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Base price
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => update({ price: event.target.value })}
                  className="mt-1 font-mono"
                />
              </label>
              <label className="text-sm">
                Currency
                <Input value={currency} readOnly className="mt-1 font-mono" />
              </label>
            </div>
            <label className="flex items-center justify-between border-y py-3 text-sm">
              Active
              <input
                type="checkbox"
                className="accent-primary"
                checked={draft.active}
                onChange={(event) => update({ active: event.target.checked })}
              />
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Variants</span>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => update({ variants: [...draft.variants, emptyVariant()] })}
                >
                  Add variant
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {draft.variants.map((variant, index) => (
                  <div key={variant.id ?? `new-${index}`} className="rounded-[6px] border p-3">
                    <div className="grid grid-cols-[1fr_1fr_24px] gap-1.5">
                      <Input
                        aria-label={`Variant ${index + 1} name`}
                        value={variant.name}
                        onChange={(event) => updateVariant(index, { name: event.target.value })}
                        placeholder="Natural"
                      />
                      <Input
                        aria-label={`Variant ${index + 1} options`}
                        value={variant.options}
                        onChange={(event) => updateVariant(index, { options: event.target.value })}
                        placeholder="Color: Natural"
                      />
                      <button
                        aria-label={`Remove variant ${index + 1}`}
                        onClick={() =>
                          update({
                            variants: draft.variants.filter((_, variantIndex) => variantIndex !== index),
                          })
                        }
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <label className="text-xs text-muted-foreground">
                        Price override
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.price_override}
                          onChange={(event) =>
                            updateVariant(index, { price_override: event.target.value })
                          }
                          className="mt-1 font-mono"
                          placeholder="Use base price"
                        />
                      </label>
                      <label className="text-xs text-muted-foreground">
                        Stock
                        <Input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(event) => updateVariant(index, { stock: event.target.value })}
                          className="mt-1 font-mono"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-5">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
            Save product
          </Button>
        </div>
      </aside>
    </div>
  )
}

function ZoneDialog({
  draft,
  setDraft,
  saving,
  onSave,
  onCancel,
}: {
  draft: ZoneDraft
  setDraft: (draft: ZoneDraft) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/30 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md border bg-background p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">{draft.id ? 'Edit delivery zone' : 'New delivery zone'}</h2>
          <button onClick={onCancel} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <label className="text-sm">
            Name
            <Input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="United States"
            />
          </label>
          <label className="text-sm">
            Areas
            <Input
              value={draft.areas}
              onChange={(event) => setDraft({ ...draft, areas: event.target.value })}
              placeholder="Ontario, Quebec"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Fee
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.fee}
                onChange={(event) => setDraft({ ...draft, fee: event.target.value })}
                className="font-mono"
              />
            </label>
            <label className="text-sm">
              ETA in days
              <Input
                type="number"
                min="0"
                value={draft.eta_days}
                onChange={(event) => setDraft({ ...draft, eta_days: event.target.value })}
                className="font-mono"
              />
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save zone
          </Button>
        </div>
      </div>
    </div>
  )
}
