import type { BrewProfile } from '../../domain/brewing'
import type { DecaidProfileRecord } from '../../api/decaid/types'

export type ProfileSource = 'Created' | 'Imported' | 'Built-in' | 'Saved'
export type LibrarySection = 'All profiles' | 'Favorites' | ProfileSource
export function sourceForRecord(record: DecaidProfileRecord): ProfileSource {
  if (record.isDefault === true) return 'Built-in'
  const origin = record.metadata?.bestpressoSource
  return origin === 'created' ? 'Created' : origin === 'imported' ? 'Imported' : 'Saved'
}
export const profileLibrarySource = (profile: BrewProfile): ProfileSource => profile.source ?? 'Saved'
export function librarySaveMetadata(metadata: Record<string, unknown> | null | undefined, source: DecaidProfileRecord | undefined, overwrite: boolean, now: string) {
  const merged = { ...source?.metadata, ...metadata }
  if (overwrite) return merged
  return { ...merged, bestpressoSource: !source && merged.bestpressoSource === 'imported' ? 'imported' : 'created', bestpressoCreatedAt: now }
}
export function filterLibraryProfiles(profiles: BrewProfile[], options: { section: LibrarySection; query: string; category: string; sort: 'name' | 'recent' }) {
  const query = options.query.trim().toLocaleLowerCase()
  return profiles.filter(profile =>
    (options.section === 'All profiles' || options.section === 'Favorites' || profileLibrarySource(profile) === options.section)
    && (!options.category || profile.category === options.category)
    && (!query || [profile.name, profile.category, profile.description, profile.author].filter(Boolean).join(' ').toLocaleLowerCase().includes(query))
  ).sort((a,b) => {
    if (options.sort === 'recent') {
      const time = (p: BrewProfile) => Date.parse(p.createdAt ?? '') || 0
      if (time(a) !== time(b)) return time(b) - time(a)
    }
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  })
}
