import PublicArtClient from './PublicArtClient';
import { getPublicArtWorksTimeline } from '@/lib/works';

export default function PublicArtPage({ params }) {
  const timeline = getPublicArtWorksTimeline();
  const lang = typeof params?.lang === 'string' ? params.lang : 'zh';

  return <PublicArtClient lang={lang} timeline={timeline} />;
}
