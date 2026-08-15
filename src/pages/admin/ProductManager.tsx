import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../lib/format'
import Modal from '../../components/admin/Modal'
import ImageInput from '../../components/admin/ImageInput'
import { usePolling } from '../../lib/usePolling'
import type { Product } from '../../lib/database.types'

const ADMIN_POLL_MS = 3000

type ProductForm = {
  name: string
  price: string
  category: string
  image_url: string
}

const emptyForm: ProductForm = { name: '', price: '', category: '', image_url: '' }

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('category').order('name')
    if (error) {
      toast.error('Failed to load products')
    } else {
      setProducts(data as Product[])
    }
    setLoading(false)
  }

  usePolling(fetchProducts, ADMIN_POLL_MS)

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      image_url: product.image_url ?? '',
    })
  }

  const openAdd = () => {
    setAdding(true)
    setForm(emptyForm)
  }

  const closeForm = () => {
    setEditing(null)
    setAdding(false)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    const price = parseFloat(form.price)
    if (!form.name.trim() || !form.category.trim() || isNaN(price) || price < 0) {
      toast.error('Please fill in a valid name, category, and price')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price,
      image_url: form.image_url.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) toast.error('Update failed')
      else toast.success('Product updated')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) toast.error('Failed to add product')
      else toast.success('Product added')
    }
    setSaving(false)
    closeForm()
    fetchProducts()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setSaving(true)
    const { error } = await supabase.from('products').delete().eq('id', deleting.id)
    setSaving(false)
    if (error) {
      toast.error('Delete failed')
    } else {
      toast.success('Product deleted')
      setDeleting(null)
      fetchProducts()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Product Manager</h1>
        <button
          onClick={openAdd}
          className="bg-primary hover:bg-primary-hover text-secondary font-semibold px-4 py-2 rounded-lg text-sm"
        >
          + Add New Product
        </button>
      </div>

      {loading ? (
        <p className="text-disabled text-sm">Loading…</p>
      ) : (
        <div className="overflow-x-auto bg-[#242424] border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-disabled border-b border-border">
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <div className="w-10 h-10 rounded bg-tertiary overflow-hidden flex items-center justify-center">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-disabled text-[10px]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-disabled">{product.category}</td>
                  <td className="p-3">{formatINR(product.price)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="text-primary hover:text-primary-hover text-xs underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(product)}
                        className="text-danger hover:text-red-400 text-xs underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editing || adding) && (
        <Modal title={editing ? 'Edit Product' : 'Add New Product'} onClose={closeForm}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm text-disabled mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-disabled mb-1">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-disabled mb-1">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <ImageInput
              bucket="product-images"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 w-full bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold py-2.5 rounded-lg"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete Product" onClose={() => setDeleting(null)}>
          <p className="text-sm text-disabled mb-4">
            Delete <span className="text-secondary font-medium">{deleting.name}</span>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleting(null)}
              className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-tertiary"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 bg-danger hover:brightness-110 disabled:opacity-50 text-secondary font-semibold rounded-lg py-2.5 text-sm"
            >
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
