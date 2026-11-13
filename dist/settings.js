import {syncSystemBars} from './native.js?v=3197cf683a29';

export const SETTINGS_KEY='dictionnaire-infernal-settings-v1';

export const DEFAULT_SETTINGS=Object.freeze({
  theme:'dark',
  fontSize:'normal',
  showFrench:true,
  keepAwake:false,
  animations:false
});

export function normalizeSettings(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  return {
    theme:['dark','light','system'].includes(src.theme)?src.theme:'dark',
    fontSize:['normal','large'].includes(src.fontSize)?src.fontSize:'normal',
    showFrench:typeof src.showFrench==='boolean'?src.showFrench:true,
    keepAwake:typeof src.keepAwake==='boolean'?src.keepAwake:false,
    animations:typeof src.animations==='boolean'?src.animations:false
  };
}

export function loadSettings(storage=globalThis.localStorage){
  try{
    const raw=storage?.getItem(SETTINGS_KEY);
    return normalizeSettings(raw?JSON.parse(raw):null);
  }catch{
    return {...DEFAULT_SETTINGS};
  }
}

export function saveSettings(settings,storage=globalThis.localStorage){
  const normalized=normalizeSettings(settings);
  storage?.setItem(SETTINGS_KEY,JSON.stringify(normalized));
  return normalized;
}

export function resolveEffectiveTheme(theme){
  if(theme==='light')return 'light';
  if(theme==='dark')return 'dark';
  const prefersDark=typeof globalThis.matchMedia==='function'&&globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark?'dark':'light';
}

export function applySettingsToDocument(settings,doc=globalThis.document){
  const effective=resolveEffectiveTheme(settings.theme);
  if(doc?.documentElement?.dataset){
    doc.documentElement.dataset.theme=effective;
    doc.documentElement.dataset.fontsize=settings.fontSize;
    doc.documentElement.dataset.animations=settings.animations?'on':'off';
  }
  doc?.querySelector?.('meta[name="theme-color"]')?.setAttribute?.('content',effective==='dark'?'#151312':'#f4eee1');
  syncSystemBars(effective);
  return effective;
}
