const paths={
  dictionary:'<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19v16H6.5a2.5 2.5 0 0 0 0 5H20"/><path d="M9 7h6M9 11h4"/>',
  gallery:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  daily:'<path d="M12 2.5 14.4 8l5.6.5-4.3 3.7 1.3 5.5L12 14.8l-5 2.9 1.3-5.5L4 8.5 9.6 8 12 2.5Z"/>',
  bookmarks:'<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>',
  settings:'<path d="m9 3-.5 2-2 .9-1.9-.5-2 3.4 1.5 1.5v2.4L2.6 14l2 3.4 1.9-.5 2 .9L9 20h4l.5-2.2 2-.9 1.9.5 2-3.4-1.5-1.3v-2.4l1.5-1.5-2-3.4-1.9.5-2-.9L13 3Z" transform="translate(1 .5)"/><circle cx="12" cy="12" r="3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  check:'<path d="m5 12 4.5 4.5L19 7"/>',
  shuffle:'<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  note:'<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 13h6M9 17h4"/>'
};

export function icon(name,className='ui-icon'){
  const body=paths[name]||paths.dictionary;
  return `<svg class="${className}" data-icon="${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
