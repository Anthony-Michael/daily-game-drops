import { MetadataRoute } from 'next';
import dailyDeals from '../../data/dailyDeals';

export default function sitemap(): MetadataRoute.Sitemap {
  // Base URL of your website
  const baseUrl = 'https://dailygamedrops.com';
  
  // Generate sitemap entries for static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ] as const;
  
  // Generate sitemap entries for dynamic deal pages using slugs from the data
  const dealPages = dailyDeals.map((deal) => {
    return {
      url: `${baseUrl}/deals/${deal.slug}`,
      lastModified: new Date(deal.datePosted),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    };
  });
  
  // Combine static and dynamic entries
  return [...staticPages, ...dealPages];
} 