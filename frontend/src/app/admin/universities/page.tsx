'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Badge, EmptyState } from '@/components/admin/baseComponents'
import { apiFetch, apiFetchJson, getApiErrorMessage } from '@/lib/api'

type UniversityTag = {
  tag: string
}

type UniversityQuickLink = {
  id?: string
  label: string
  url: string
}

type UniversityAdditionalInfo = {
  id?: string
  title: string
  description?: string
  url?: string
  status?: string
}

type University = {
  id: string
  name: string
  location?: string
  website?: string
  institution_type?: 'public' | 'private' | 'mixed'
  summary?: string
  logo_url?: string
  primary_focus?: string
  focus_tags?: UniversityTag[]
  quick_links?: UniversityQuickLink[]
  additional_information?: UniversityAdditionalInfo[]
  created_at?: string
  updated_at?: string
}

type UniversityResponse = {
  data: University[]
  count: number
  page?: number
  limit?: number
}

type QuickLinkInput = { label: string; url: string }
type AdditionalInfoInput = { title: string; description: string; url: string; status: string }

type UniversityFormState = {
  id?: string
  name: string
  location: string
  website: string
  institution_type: '' | 'public' | 'private' | 'mixed'
  summary: string
  logo_url: string
  primary_focus: string
  focus_tags: string
  quick_links: QuickLinkInput[]
  additional_information: AdditionalInfoInput[]
}

const emptyForm: UniversityFormState = {
  name: '',
  location: '',
  website: '',
  institution_type: '',
  summary: '',
  logo_url: '',
  primary_focus: '',
  focus_tags: '',
  quick_links: [{ label: '', url: '' }],
  additional_information: [{ title: '', description: '', url: '', status: '' }]
}

const parseTags = (raw: string) =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

const toFormState = (university: University): UniversityFormState => ({
  id: university.id,
  name: university.name ?? '',
  location: university.location ?? '',
  website: university.website ?? '',
  institution_type: university.institution_type ?? '',
  summary: university.summary ?? '',
  logo_url: university.logo_url ?? '',
  primary_focus: university.primary_focus ?? '',
  focus_tags: (university.focus_tags ?? []).map((tag) => tag.tag).join(', '),
  quick_links:
    university.quick_links && university.quick_links.length > 0
      ? university.quick_links.map((link) => ({
          label: link.label ?? '',
          url: link.url ?? ''
        }))
      : [{ label: '', url: '' }],
  additional_information:
    university.additional_information && university.additional_information.length > 0
      ? university.additional_information.map((info) => ({
          title: info.title ?? '',
          description: info.description ?? '',
          url: info.url ?? '',
          status: info.status ?? ''
        }))
      : [{ title: '', description: '', url: '', status: '' }]
})

const buildPayload = (form: UniversityFormState) => {
  const quickLinks = form.quick_links
    .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
    .filter((link) => link.label || link.url)
  const additionalInfo = form.additional_information
    .map((info) => ({
      title: info.title.trim(),
      description: info.description.trim(),
      url: info.url.trim(),
      status: info.status.trim()
    }))
    .filter((info) => info.title || info.description || info.url || info.status)

  return {
    name: form.name.trim(),
    location: form.location.trim(),
    website: form.website.trim(),
    summary: form.summary.trim(),
    logo_url: form.logo_url.trim(),
    primary_focus: form.primary_focus.trim(),
    focus_tags: parseTags(form.focus_tags),
    quick_links: quickLinks,
    additional_information: additionalInfo,
    institution_type: form.institution_type || undefined
  }
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [selected, setSelected] = useState<UniversityFormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchUniversities = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' })
      const data = await apiFetchJson<UniversityResponse>(`/universities?${params.toString()}`, {
        credentials: 'include'
      })
      setUniversities(data.data ?? [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar las universidades'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUniversities()
  }, [fetchUniversities])

  const handleSelect = useCallback((university: University) => {
    setSelected(toFormState(university))
    setFormError(null)
  }, [])

  const handleNew = useCallback(() => {
    setSelected(emptyForm)
    setFormError(null)
  }, [])

  const handleChange = useCallback((key: keyof UniversityFormState, value: string) => {
    setSelected((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleQuickLinkChange = useCallback((index: number, key: keyof QuickLinkInput, value: string) => {
    setSelected((prev) => {
      const next = [...prev.quick_links]
      next[index] = { ...next[index], [key]: value }
      return { ...prev, quick_links: next }
    })
  }, [])

  const handleAdditionalInfoChange = useCallback(
    (index: number, key: keyof AdditionalInfoInput, value: string) => {
      setSelected((prev) => {
        const next = [...prev.additional_information]
        next[index] = { ...next[index], [key]: value }
        return { ...prev, additional_information: next }
      })
    },
    []
  )

  const addQuickLink = useCallback(() => {
    setSelected((prev) => ({ ...prev, quick_links: [...prev.quick_links, { label: '', url: '' }] }))
  }, [])

  const removeQuickLink = useCallback((index: number) => {
    setSelected((prev) => ({
      ...prev,
      quick_links: prev.quick_links.filter((_, idx) => idx !== index)
    }))
  }, [])

  const addAdditionalInfo = useCallback(() => {
    setSelected((prev) => ({
      ...prev,
      additional_information: [...prev.additional_information, { title: '', description: '', url: '', status: '' }]
    }))
  }, [])

  const removeAdditionalInfo = useCallback((index: number) => {
    setSelected((prev) => ({
      ...prev,
      additional_information: prev.additional_information.filter((_, idx) => idx !== index)
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    setFormError(null)
    if (!selected.name.trim()) {
      setFormError('El nombre es obligatorio.')
      return
    }

    const payload = buildPayload(selected)
    if (payload.quick_links.some((link) => !link.label || !link.url)) {
      setFormError('Cada acceso rapido debe tener label y URL.')
      return
    }
    if (payload.additional_information.some((info) => !info.title)) {
      setFormError('Cada item de informacion adicional necesita titulo.')
      return
    }

    setSaving(true)
    try {
      const isEditing = Boolean(selected.id)
      const response = await apiFetch(isEditing ? `/universities/${selected.id}` : '/universities', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        throw new Error(`Error (${response.status})`)
      }
      await fetchUniversities()
      if (!isEditing) {
        setSelected(emptyForm)
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo guardar la universidad'))
    } finally {
      setSaving(false)
    }
  }, [fetchUniversities, selected])

  const selectedTitle = useMemo(() => (selected.id ? 'Editar universidad' : 'Agregar universidad'), [selected.id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse space-y-4"
            >
              <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="h-3 w-40 bg-gray-100 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
          Error: {error}
        </div>
        <button
          onClick={fetchUniversities}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Universidades</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona las universidades asociadas al catálogo</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            + Nueva universidad
          </button>
        </div>
      </div>

      {universities.length === 0 ? (
        <EmptyState title="Sin universidades" description="Agrega la primera universidad para comenzar." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((university) => (
            <Card key={university.id} className="p-5 space-y-3 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{university.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{university.location ?? 'Ubicacion pendiente'}</p>
                </div>
                <Badge variant="info">{university.institution_type ?? 'pendiente'}</Badge>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tags: {(university.focus_tags ?? []).length} · Links: {(university.quick_links ?? []).length}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleSelect(university)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Editar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos que se muestran en el perfil público.</p>
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-3 text-sm text-red-800 dark:text-red-200">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Nombre</span>
            <input
              value={selected.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Universidad..."
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Ubicacion</span>
            <input
              value={selected.location}
              onChange={(event) => handleChange('location', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Ciudad, país"
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Sitio web</span>
            <input
              value={selected.website}
              onChange={(event) => handleChange('website', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="https://"
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Tipo de institucion</span>
            <select
              value={selected.institution_type}
              onChange={(event) => handleChange('institution_type', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">Seleccionar</option>
              <option value="public">Publica</option>
              <option value="private">Privada</option>
              <option value="mixed">Mixta</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300 lg:col-span-2">
            <span className="font-medium">Resumen</span>
            <textarea
              value={selected.summary}
              onChange={(event) => handleChange('summary', event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Descripción corta"
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Logo URL</span>
            <input
              value={selected.logo_url}
              onChange={(event) => handleChange('logo_url', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="https://logo"
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Enfoque principal</span>
            <input
              value={selected.primary_focus}
              onChange={(event) => handleChange('primary_focus', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Ingenieria aplicada"
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300 lg:col-span-2">
            <span className="font-medium">Tags (separados por coma)</span>
            <input
              value={selected.focus_tags}
              onChange={(event) => handleChange('focus_tags', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Ingenieria, Tecnologia, Investigacion"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Accesos rapidos</h3>
            <button
              type="button"
              onClick={addQuickLink}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              + Agregar
            </button>
          </div>
          <div className="space-y-3">
            {selected.quick_links.map((link, index) => (
              <div key={`quick-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                <input
                  value={link.label}
                  onChange={(event) => handleQuickLinkChange(index, 'label', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  placeholder="Label"
                />
                <input
                  value={link.url}
                  onChange={(event) => handleQuickLinkChange(index, 'url', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  placeholder="https://"
                />
                <button
                  type="button"
                  onClick={() => removeQuickLink(index)}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-red-600"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Informacion adicional</h3>
            <button
              type="button"
              onClick={addAdditionalInfo}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              + Agregar
            </button>
          </div>
          <div className="space-y-4">
            {selected.additional_information.map((info, index) => (
              <div key={`additional-${index}`} className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3">
                  <input
                    value={info.title}
                    onChange={(event) => handleAdditionalInfoChange(index, 'title', event.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    placeholder="Titulo"
                  />
                  <input
                    value={info.status}
                    onChange={(event) => handleAdditionalInfoChange(index, 'status', event.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    placeholder="Estado"
                  />
                </div>
                <textarea
                  value={info.description}
                  onChange={(event) => handleAdditionalInfoChange(index, 'description', event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  placeholder="Descripcion"
                />
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                  <input
                    value={info.url}
                    onChange={(event) => handleAdditionalInfoChange(index, 'url', event.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    placeholder="https://"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdditionalInfo(index)}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-red-600"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium text-sm transition-colors duration-200"
          >
            {saving ? 'Guardando...' : selected.id ? 'Guardar cambios' : 'Crear universidad'}
          </button>
        </div>
      </Card>
    </div>
  )
}
