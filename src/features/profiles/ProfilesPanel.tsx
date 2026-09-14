import { useEffect, useRef, useState } from 'react'
import { SidebarBrand, SidebarNavItem } from '../../components/Sidebar/SidebarNavigation'
import type { BrewProfile, SettingFeedback } from '../../domain/brewing'
import { formatTemperatureValue } from '../../domain/temperature'
import { useBestpressoPreferences } from '../settings/bestpressoPreferences'
import { ProfileTargetChart } from '../brew/ProfileTargetChart'
import { ProfileDeleteDialog } from './ProfileDeleteDialog'
import { parseProfileImport, type ParsedProfileImport } from './profileImports'
import { filterLibraryProfiles, profileLibrarySource, type LibrarySection } from './profileLibraryModel'
import './profileDeletion.css'
import './profileLibrary.css'

interface ProfilesPanelProps {
  profiles: BrewProfile[]
  favoriteProfileSlots: Array<string | null>
  activeProfileId?: string
  initialProfileId?: string
  editingEnabled?: boolean
  profileEditMode?: (id: string) => 'copy' | 'edit'
  feedback: SettingFeedback | null
  onSelectProfile: (id: string) => Promise<boolean>
  onSetFavoriteSlot: (id: string, slot: number) => Promise<boolean>
  onRemoveFavorite: (id: string) => Promise<boolean>
  onClose: () => void
  onViewProfile: (id?: string) => void
  onStartProfile?: () => void
  onImportProfile?: (profile: ParsedProfileImport) => void
  onCheckVisualizer?: () => Promise<{ ready: boolean; message?: string }>
  onImportVisualizer?: (code: string) => Promise<void>
  onOpenSettings?: () => void
  onEditProfile?: (id: string) => void
  canDeleteProfile?: (id: string) => boolean
  onDeleteProfile?: (id: string) => Promise<void>
}
function Icon({ name }: { name: string }) {
  if (['star','unfavorite','cup'].includes(name)) return <span className={`pl-star-icon pl-star-icon--${name}`} aria-hidden="true"/>
  const paths: Record<string,string> = { search:'m16 16 4 4M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', arrow:'m9 5 7 7-7 7', plus:'M12 4v16M4 12h16', import:'M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5', grid:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z', edit:'m4 16-1 5 5-1L21 7l-5-5ZM14 4l6 6', up:'m6 14 6-6 6 6', down:'m6 10 6 6 6-6' }
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>
}
function Metric({ label, value, unit }: { label:string; value:string; unit?:string }) {
  return <div className="pl-metric"><span>{label}</span><strong>{value}{unit && value !== '—' && <small className={unit === '°' ? 'temperature-unit' : undefined}>{unit}</small>}</strong></div>
}
function Chart({profile}:{profile:BrewProfile}) { return <ProfileTargetChart profileName={profile.name} points={profile.targetPoints} variant="library"/> }

export function ProfilesPanel({profiles, favoriteProfileSlots, activeProfileId, initialProfileId, editingEnabled=false, profileEditMode, feedback, onSelectProfile, onSetFavoriteSlot, onRemoveFavorite, onClose, onViewProfile, onStartProfile, onImportProfile, onEditProfile, canDeleteProfile, onDeleteProfile}:ProfilesPanelProps) {
  const { preferences } = useBestpressoPreferences()
  const [section,setSection] = useState<LibrarySection>('All profiles')
  const [query,setQuery] = useState('')
  const [category,setCategory] = useState('')
  const [sort,setSort] = useState<'name'|'recent'>('name')
  const [candidateId,setCandidateId] = useState<string|null>(null)
  const [deleting,setDeleting] = useState<BrewProfile|null>(null)
  const [pending,setPending] = useState(false)
  const [error,setError] = useState<string|null>(null)
  const inFlight = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLElement>(null)
  const scroll = useRef(0)
  const returnId = useRef<string|null>(null)
  const detail = profiles.find(p=>p.id===initialProfileId)
  const candidate = profiles.find(p=>p.id===candidateId)
  const favorites = favoriteProfileSlots.flatMap((id,slot)=>{const profile=profiles.find(p=>p.id===id); return profile?[{profile,slot}]:[]})
  const ids = new Set(favorites.map(f=>f.profile.id))
  const categories = [...new Set(profiles.map(p=>p.category).filter((c):c is string=>Boolean(c)))].sort((a,b)=>a.localeCompare(b))
  const sources:LibrarySection[] = ['Preloaded','Imported','My profiles']
  const visible = filterLibraryProfiles(profiles,{section,query,category,sort})
  const count = (s:LibrarySection)=>s==='All profiles'?profiles.length:s==='Favorites'?favorites.length:profiles.filter(p=>profileLibrarySource(p)===s).length
  useEffect(()=>{
    if(!candidateId) return
    const element=dialog.current
    if(!element)return
    const focus=document.activeElement as HTMLElement|null
    element.showModal()
    return ()=>{element.close();if(focus?.isConnected)focus.focus()}
  },[candidateId])
  useEffect(()=>{
    if(initialProfileId)return
    const frame=requestAnimationFrame(()=>{
      if(content.current)content.current.scrollTop=scroll.current
      Array.from(content.current?.querySelectorAll<HTMLButtonElement>('[data-profile-id]')??[]).find(b=>b.dataset.profileId===returnId.current)?.focus({preventScroll:true})
    })
    return ()=>cancelAnimationFrame(frame)
  },[initialProfileId])
  async function run(action:()=>Promise<boolean>) {
    if(inFlight.current)return false
    inFlight.current=true;setPending(true);setError(null)
    try {const ok=await action();if(!ok)setError('That change could not be saved. Check your connection and try again.');return ok}
    catch(cause){setError(cause instanceof Error?cause.message:'That change could not be saved. Please try again.');return false}
    finally{inFlight.current=false;setPending(false)}
  }
  function navigate(next:LibrarySection){setSection(next);setQuery('');setCategory('');setError(null);scroll.current=0}
  function open(p:BrewProfile){scroll.current=content.current?.scrollTop??0;returnId.current=p.id;onViewProfile(p.id)}
  async function favorite(p:BrewProfile) {
    if(inFlight.current)return
    if(ids.has(p.id)){await run(()=>onRemoveFavorite(p.id));return}
    const empty=Array.from({length:5},(_,i)=>i).find(i=>!profiles.some(p=>p.id===favoriteProfileSlots[i]))
    if(empty!==undefined){await run(()=>onSetFavoriteSlot(p.id,empty));return}
    setError(null);setCandidateId(p.id)
  }
  async function importFile(file:File|undefined){
    if(!file||inFlight.current)return
    setError(null)
    try{onImportProfile?.(parseProfileImport(await file.text()))}
    catch(cause){setError(cause instanceof Error?cause.message:'That profile could not be imported.')}
  }
  const message=error??feedback?.message
  const isError=Boolean(error)||feedback?.status==='error'
  const feedbackView=message&&<div className={`pl-library-feedback${isError?' pl-library-feedback--error':''}`} role={isError?'alert':'status'}>{message}</div>
  const temperature=(p:BrewProfile)=>formatTemperatureValue(p.temperature,preferences.temperatureUnit)
  const ratio=detail&&Number(detail.dose)>0&&Number(detail.targetYield)>0?`1:${Number((Number(detail.targetYield)/Number(detail.dose)).toFixed(1))}`:'—'
  return <div className="ins-theme pl-app">
    {!initialProfileId?<div className="ins-shell">
      <aside className="ins-rail"><SidebarBrand onClose={onClose} closeLabel="Close profiles"/>
        <span className="ins-eyebrow">LIBRARY</span><nav aria-label="Profile library">{(['All profiles','Favorites'] as const).map(s=><SidebarNavItem key={s} active={section===s} onClick={()=>navigate(s)}><Icon name={s==='Favorites'?'star':'grid'}/>{s}<small>{count(s)}</small></SidebarNavItem>)}</nav>
        <span className="ins-eyebrow pl-source-label">SOURCE</span><nav aria-label="Profile source">{sources.map(s=><SidebarNavItem key={s} active={section===s} onClick={()=>navigate(s)}><span className="pl-nav-dot"/>{s}<small>{count(s)}</small></SidebarNavItem>)}</nav>
      </aside>
      <main className="ins-content" ref={content}>
        <header className="pl-heading"><h1>{section}</h1>{editingEnabled&&<div className="pl-actions"><button className="pl-button" disabled={pending||!onImportProfile} onClick={()=>fileInput.current?.click()}><Icon name="import"/>Import</button><button className="pl-button pl-primary" disabled={pending||!onStartProfile} onClick={onStartProfile}><Icon name="plus"/>Create profile</button></div>}</header>
        {feedbackView}
        {section==='Favorites'?<><div className="pl-section-intro"><p>Your home shortcuts, in your order.</p></div><div className="pl-favorites">{favorites.map(({profile:p},index)=><article className="pl-favorite" key={p.id}>
          <button className="pl-favorite-preview" data-profile-id={p.id} onClick={()=>open(p)} aria-label={`View ${p.name}`}><Chart profile={p}/><h2>{p.name}</h2><span className="pl-muted">{p.category}</span></button>
          <footer><div><button className="pl-round" disabled={pending||index===0} aria-label={`Move ${p.name} earlier`} onClick={()=>void run(()=>onSetFavoriteSlot(p.id,favorites[index-1].slot))}><Icon name="up"/></button><button className="pl-round" disabled={pending||index===favorites.length-1} aria-label={`Move ${p.name} later`} onClick={()=>void run(()=>onSetFavoriteSlot(p.id,favorites[index+1].slot))}><Icon name="down"/></button></div><button className="pl-text pl-unfavorite" disabled={pending} aria-label={`Unfavorite ${p.name}`} onClick={()=>void run(()=>onRemoveFavorite(p.id))}><Icon name="unfavorite"/>Unfavorite</button></footer>
        </article>)}{favorites.length<5&&<button className="pl-empty-slot" onClick={()=>navigate('All profiles')}><Icon name="plus"/><strong>Add a favorite</strong><span>Choose from your library</span></button>}</div></>:<>
          <div className="pl-toolbar"><label className="pl-search"><Icon name="search"/><input aria-label="Search profiles" placeholder="Search name or category" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Clear search" onClick={()=>setQuery('')}>×</button>}</label><label className="ins-period"><select aria-label="Filter category" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="ins-period"><select aria-label="Sort profiles" value={sort} onChange={e=>setSort(e.target.value as 'name'|'recent')}><option value="name">Name A–Z</option><option value="recent">Recently added</option></select></label></div>
          <div className="pl-list-meta"><span>{visible.length} profiles</span><span>Open a profile to explore its recipe</span></div>
          <section className="pl-list" aria-label="Profiles"><div className="pl-list-header"><span>Profile</span><span>Recipe</span><span>Temp.</span><span className="pl-desktop-source">Source</span><span/></div>
            {visible.map(p=><article className="pl-row" key={p.id}><button className="pl-row-open" data-profile-id={p.id} onClick={()=>open(p)} aria-label={`View ${p.name}`}><span className="pl-profile-cell"><span className="pl-thumbnail"><Chart profile={p}/></span><span><strong>{p.name}</strong><span className="pl-row-sub">{p.category}</span></span></span><span className="pl-recipe">{p.dose}{p.dose!=='—'&&<small>g</small>}<span className="pl-recipe-arrow">→</span>{p.targetYield}{p.targetYield!=='—'&&<small>g</small>}</span><span className="pl-temperature">{temperature(p)}{temperature(p)!=='—'&&'°'}</span><span className="pl-desktop-source pl-muted">{profileLibrarySource(p)}</span></button><button className={`pl-fav-button ${ids.has(p.id)?'is-favorite':''}`} disabled={pending} aria-label={`${ids.has(p.id)?'Unfavorite':'Favorite'} ${p.name}`} aria-pressed={ids.has(p.id)} onClick={()=>void favorite(p)}><Icon name="star"/></button></article>)}
            {!visible.length&&<div className="pl-no-results"><h2>{profiles.length?'No matching profiles':'No profiles yet'}</h2><p>{profiles.length?'Try another name, source or category.':'Create or import a profile to get started.'}</p>{profiles.length>0&&<button className="pl-button" onClick={()=>navigate('All profiles')}>Clear filters</button>}</div>}
          </section>
        </>}
      </main>
    </div>:detail?<main className="pl-detail">
      <section className="pl-detail-hero" aria-label="Profile graph header"><Chart profile={detail}/><header className="pl-detail-header"><button className="pl-round pl-close" aria-label="Close profile detail" onClick={()=>onViewProfile()}>×</button><h1>{detail.name}</h1><div className="pl-actions"><button className="pl-button pl-primary" disabled={pending} onClick={()=>void run(()=>onSelectProfile(detail.id))}><Icon name="cup"/>{pending?'Saving…':'Select'}</button><button className={`pl-button ${ids.has(detail.id)?'pl-selected':''}`} disabled={pending} onClick={()=>void favorite(detail)}><Icon name={ids.has(detail.id)?'unfavorite':'star'}/>{ids.has(detail.id)?'Unfavorite':'Favorite'}</button>{editingEnabled&&onEditProfile&&<button className="pl-button" disabled={pending} onClick={()=>onEditProfile(detail.id)}><Icon name="edit"/>{profileEditMode?.(detail.id)==='edit'?'Edit':'Edit a copy'}</button>}{canDeleteProfile?.(detail.id)&&onDeleteProfile&&<button className="pl-button pl-danger" disabled={pending} onClick={()=>setDeleting(detail)}>Delete</button>}</div></header></section>
      <section className="pl-detail-metrics" aria-label="Overall targets"><Metric label="Temperature" value={temperature(detail)} unit="°"/><Metric label="Dose" value={detail.dose} unit="g"/><Metric label="Target yield" value={detail.targetYield} unit="g"/><Metric label="Ratio" value={ratio}/></section>{feedbackView}
      <section className="pl-metadata"><article><h2>Profile details</h2><dl><div><dt>Category</dt><dd>{detail.category||'—'}</dd></div><div><dt>Type</dt><dd>{detail.beverageType==='pourover'?'Pour over':detail.beverageType||'—'}</dd></div><div><dt>Source</dt><dd>{profileLibrarySource(detail)}</dd></div>{detail.version&&<div><dt>Version</dt><dd>{detail.version}</dd></div>}{detail.author&&<div><dt>Author</dt><dd>{detail.author}</dd></div>}<div><dt>Grind size</dt><dd>{detail.grindSetting}</dd></div></dl></article><article><h2>About this recipe</h2><p>{detail.description||'No description provided for this profile.'}</p></article></section>
    </main>:<main className="pl-detail"><h1>Profile unavailable</h1><p>This profile may have been removed or is still loading.</p><button className="pl-button" onClick={()=>onViewProfile()}>Back to profiles</button></main>}
    <input className="pl-file-input" ref={fileInput} type="file" accept=".json,application/json" aria-label="Import profile JSON" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';void importFile(file)}}/>
    {candidate&&<dialog className="pl-dialog" ref={dialog} aria-labelledby="favorite-replacement-title" onCancel={e=>{e.preventDefault();if(!inFlight.current)setCandidateId(null)}}><div className="pl-dialog-body"><header><span className="pl-eyebrow">HOME FAVORITES</span><button className="pl-round" disabled={pending} aria-label="Close favorite replacement" onClick={()=>setCandidateId(null)}>×</button></header><h2 id="favorite-replacement-title">Make room for {candidate.name}</h2><p>Your five home slots are full. Choose one to replace. The replaced profile stays in your library.</p>{error&&<p role="alert">{error}</p>}<div className="pl-replace-list">{favorites.map(({profile:p,slot})=><button key={slot} disabled={pending} aria-label={`Replace ${p.name}`} onClick={()=>void run(()=>onSetFavoriteSlot(candidate.id,slot)).then(ok=>{if(ok)setCandidateId(null)})}><strong>{p.name}</strong><span>Replace</span><Icon name="arrow"/></button>)}</div></div></dialog>}
    {deleting&&onDeleteProfile&&<ProfileDeleteDialog profile={deleting} active={deleting.id===activeProfileId} onClose={()=>setDeleting(null)} onDelete={async id=>{await onDeleteProfile(id);onViewProfile()}}/>}
  </div>
}
