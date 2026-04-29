export type SiteEntry = {
  name: string
  url: string
  status?: number
}

// Add your tracked sites here
// Re-run `npx tsx scripts/seed.ts` after making changes
export const sites: SiteEntry[] = [
  { name: 'SearchVista', url: 'https://searchvista.co.uk', status: 1 },
  // Add more sites below:
  { name: 'SmartSpaces', url: 'https://smartspaces.co.uk', status: 1 },
  { name: 'Amanda Azzopardi', url: 'https://amandaazzopardi.co.uk', status: 1 },
  { name: 'Derma Aesthetics', url: 'https://dermaaestheticslondon.com', status: 1 },
  { name: 'Extension Kitz', url: 'https://extensionkitz.co.uk', status: 1 },
  { name: 'Fingerpost Consulting', url: 'https://fingerpostconsulting.com', status: 1 },
  { name: 'Improve A Roof', url: 'https://improvearoof.co.uk', status: 1 },
  { name: 'PCL Building Products', url: 'https://pclbuildingproducts.co.uk', status: 1 },
  { name: 'PR Scully', url: 'https://prscully.com', status: 1 },
  { name: 'StudioTech', url: 'https://studiotech.co.uk', status: 1 },
  { name: 'Zapplaser Studio', url: 'https://zapplaserstudio.co.uk', status: 1 },
  { name: 'Roller Shutter', url: 'https://rollershutter.co.uk', status: 1 },
  { name: 'London Roller Shutters', url: 'https://londonrollershutters.com', status: 1 },
  { name: 'Epic Auditors', url: 'https://epic-auditors.com', status: 1 },
  { name: 'Roundway Centre', url: 'https://roundwaycentre.org.uk', status: 1 },
  { name: 'AJF Engineering', url: 'https://www.ajfengineering.co.uk', status: 1 },
]
