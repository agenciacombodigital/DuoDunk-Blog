export interface Article {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  summary: string;
  image_url: string;
  source: string;
  tags: string[];
  published_at: string;
  updated_at?: string;
  image_focal_point?: string;
  is_featured?: boolean;
  video_url?: string;
}