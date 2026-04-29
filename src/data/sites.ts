export type SiteEntry = {
  name: string
  url: string
  status?: number
}

// Add your tracked sites here
// Re-run `npx tsx scripts/seed.ts` after making changes
export const sites: SiteEntry[] = [
  { name: 'SearchVista', url: 'https://searchvista.co.uk' },
  // Add more sites below:
  { name: 'SmartSpaces', url: 'https://smartspaces.co.uk' },
  { name: 'Amanda Azzopardi', url: 'https://amandaazzopardi.co.uk' },
  { name: 'Derma Aesthetics', url: 'https://dermaaestheticslondon.com' },
  { name: 'Extension Kitz', url: 'https://extensionkitz.co.uk' },
  { name: 'Fingerpost Consulting', url: 'https://fingerpostconsulting.com' },
  { name: 'Improve A Roof', url: 'https://improvearoof.co.uk' },
  { name: 'PCL Building Products', url: 'https://pclbuildingproducts.co.uk' },
  { name: 'PR Scully', url: 'https://prscully.com' },
  { name: 'StudioTech', url: 'https://studiotech.co.uk' },
  { name: 'Zapplaser Studio', url: 'https://zapplaserstudio.co.uk' },
  { name: 'Roller Shutter', url: 'https://rollershutter.co.uk' },
  { name: 'London Roller Shutters', url: 'https://londonrollershutters.com' },
  { name: 'Epic Auditors', url: 'https://epic-auditors.com' },
  { name: 'Roundway Centre', url: 'https://roundwaycentre.org.uk' },
  { name: 'AJF Engineering', url: 'https://www.ajfengineering.co.uk' },
]
