import PublicArtClient from './PublicArtClient';
import { getPublicArtWorksTimeline } from '@/lib/works';

function buildTimeline(works) {
  const timelineMap = new Map();

  works.forEach((work) => {
    const year = work.year ?? 'N/A';
    if (!timelineMap.has(year)) {
      timelineMap.set(year, []);
    }
    timelineMap.get(year).push(work);
  });

  return Array.from(timelineMap.entries()).map(([year, entries]) => ({
    year,
    works: entries,
  }));
}

export default function PublicArtPage({ params }) {
  const works = getPublicArtWorksTimeline();
  const timeline = buildTimeline(works);

  return <PublicArtClient lang={params?.lang ?? 'zh'} timeline={timeline} />;
}
