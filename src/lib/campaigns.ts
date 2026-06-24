import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface CampaignUnit {
  id: string;
  role: string;
}

export interface CampaignMission {
  name: string;
  box: string;
}

export interface CampaignMeta {
  slug: string;
  title: string;
  subtitle?: string;
  era?: string;
  factions?: string[];
  units?: CampaignUnit[];
  missions?: CampaignMission[];
  order?: number;
}

export interface Campaign extends CampaignMeta {
  bodyHtml: string;
}

const CAMPAIGNS_DIR = path.join(process.cwd(), 'src', 'content', 'campaigns');

function readFrontmatter(slug: string) {
  const fullPath = path.join(CAMPAIGNS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return matter(raw);
}

// Sync: frontmatter only (no Markdown rendering). Safe to call in Jest.
export function getAllCampaigns(): CampaignMeta[] {
  if (!fs.existsSync(CAMPAIGNS_DIR)) return [];
  const files = fs.readdirSync(CAMPAIGNS_DIR).filter((f) => f.endsWith('.md'));
  const metas = files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const { data } = readFrontmatter(slug);
    return { slug, ...(data as Omit<CampaignMeta, 'slug'>) };
  });
  metas.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return metas;
}

// Async: dynamically imports remark (ESM-only) so the module stays Jest-importable.
export async function getCampaign(slug: string): Promise<Campaign | null> {
  const fullPath = path.join(CAMPAIGNS_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = readFrontmatter(slug);
  const { remark } = await import('remark');
  const { default: remarkGfm } = await import('remark-gfm');
  const { default: remarkHtml } = await import('remark-html');
  const bodyHtml = String(
    await remark().use(remarkGfm).use(remarkHtml).process(content)
  );
  return { slug, ...(data as Omit<CampaignMeta, 'slug'>), bodyHtml };
}
