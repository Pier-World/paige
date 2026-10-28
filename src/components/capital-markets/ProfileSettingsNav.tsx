import { NavLink } from 'react-router-dom';
import { PROFILE_SECTIONS } from '../../lib/profileSections';
import { cn } from '../../lib/utils';

export function ProfileSettingsNav() {
  return (
    <nav aria-label="Profile sections" className="lg:sticky lg:top-8">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
        {PROFILE_SECTIONS.map((section) => (
          <li key={section.id} className="shrink-0">
            <NavLink
              to={section.path}
              end
              className={({ isActive }) =>
                cn(
                  'block whitespace-nowrap rounded-[6px] px-3 py-2 text-[13px] transition-colors lg:text-[14px]',
                  isActive
                    ? 'bg-ink text-parchment'
                    : 'text-ink/70 hover:bg-ink/[0.05] hover:text-ink'
                )
              }
            >
              {section.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
