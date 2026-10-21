import { SearchInput } from '../ui/Form.jsx';
import { Select } from '../ui/Form.jsx';

/**
 * FilterBar — search box + select filters wired to a useList() instance.
 * selects: [{ name, label, options: [{value,label}] }]
 */
export function FilterBar({ list, placeholder = 'Search…', search = true, selects = [], children }) {
  const active = (search && list.filters.q) || selects.some((s) => list.filters[s.name]);
  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
      {search && <div className="flex-1 min-w-0 lg:max-w-sm">
        <SearchInput id="list-search" value={list.filters.q} placeholder={placeholder} onChange={(e) => list.setFilter('q', e.target.value)} onClear={() => list.setFilter('q', '')} />
      </div>}
      <div className="flex flex-wrap gap-2 items-center">
        {selects.map((s) => (
          <Select key={s.name} aria-label={s.label} value={list.filters[s.name] ?? ''} onChange={(e) => list.setFilter(s.name, e.target.value)} className="w-auto min-w-[9rem]">
            <option value="">{s.label}</option>
            {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        ))}
        {children}
        {active && <button type="button" className="btn btn-ghost btn-sm" onClick={list.reset}>Clear filters</button>}
      </div>
    </div>
  );
}
