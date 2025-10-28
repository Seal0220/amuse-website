// src/app/[lang]/works/public-art/[[...slug]]/page.js
import { notFound } from 'next/navigation';
import { getWorkBySlug, getAdjacentWorks } from '@/lib/db';
import Work from '@/app/components/work/Work';
import BottomArc from '../../../../components/work/BottomArc';
import ExhibitionSpace from '../components/ExhibitionSpace';
import Crossfade from '@/app/components/Crossfade';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ExhibitionSpacePage({ params }) {
  const { lang, slug } = await params;
  const currentSlug = Array.isArray(slug) ? slug[0] : slug ?? null;

  // 無 slug：顯示 PublicArt
  if (!currentSlug) {
    return <ExhibitionSpace />;
  }

  // 有 slug：伺服端直查 DB
  const work = getWorkBySlug(currentSlug, lang);
  if (!work) return notFound();

  const { prevWork, nextWork } = getAdjacentWorks(currentSlug);

  return (
    <div className='min-h-lvh flex flex-col bg-neutral-950'>
      <div className='relative'>
        {/* 用 Crossfade 包住 Work，slug 變動時會淡入 */}
        <Crossfade slug={currentSlug}>
          <Work lang={lang} work={work} prevWork={prevWork} nextWork={nextWork} />
        </Crossfade>
      </div>

      {/* 底部弧線／球（Client） */}
      <div className='relative h-80 mb-20'>
        <BottomArc lang={lang} prevWork={prevWork} nextWork={nextWork} type={'exhibition-space'} />
      </div>
    </div>
  );
}
