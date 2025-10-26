import { notFound } from 'next/navigation';

import { getPublicArtWorkBySlug, getPublicArtWorkSlugs } from '@/lib/works';

const supportedLanguages = ['zh', 'en'];

export function generateStaticParams() {
  const slugs = getPublicArtWorkSlugs();

  return supportedLanguages.flatMap((lang) =>
    slugs.map((slug) => ({
      lang,
      workIndex: slug,
    })),
  );
}

export default function WorkPage({ params }) {
  const slug = typeof params?.workIndex === 'string' ? params.workIndex : '';
  const work = slug ? getPublicArtWorkBySlug(slug) : null;

  if (!work) {
    notFound();
  }

  return (
    <div className='relative w-full min-h-lvh h-auto bg-neutral-800'>
      <div className='size-full flex flex-col bg-neutral-950'>

        {/* Image */}
        <div className='relative w-full h-[80lvh]'>
          <img src={work.hero_image ?? '/banner-test.png'} className='size-full object-cover' alt={work.title} />

          <div className='absolute bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-950 via-50% via-neutral-950/70 to-100% to-transparent'></div>
        </div>

        {/* Contents */}
        <div className='relative w-full bg-neutral-950 flex-1 flex flex-col gap-10 items-center mb-[20lvh]'>

          {/* Decorative Elements */}
          <div className='sticky z-50 w-full top-0 left-0 flex items-center justify-center bg-neutral-950 pt-32'>
            <div className='relative h-0.5 w-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
          </div>


          <div className='px-40 pt-20 flex flex-col gap-16 items-center overflow-hidden'>

            {/* Ellipse */}
            <div className='relative w-fit'>
              <div className='w-fit h-fit px-20 bg-transparent border border-l-2 border-r-2  border-white rounded-[50%/50%] shadow-[0_0_48px_16px] shadow-white/25 overflow-hidden'>
                <div className='size-full p-20 flex flex-col gap-4 items-center justify-center'>
                  {/* Title */}
                  <div className='text-5xl text-center font-bold inline-block tracking-[1.5rem] -mr-[1.5rem] whitespace-nowrap'>
                    {work.title}
                  </div>
                  {/* Year */}
                  <div className='text-base text-center font-bold inline-block tracking-[0.5rem] -mr-[0.5rem] whitespace-nowrap'>
                    {work.year}
                  </div>
                </div>
              </div>
            </div>


            {/* Info */}
            <div className='border-l-2 border-r-2 border-white py-10 px-16 rounded-full flex flex-col gap-1 items-baseline text-base text-left tracking-wider whitespace-nowrap'>
              <div className='flex flex-row justify-center'>
                <span className='text-sm mt-px mr-2 w-16'>設置地點: </span>
                <span className='font-bold'>{work.location}</span>
              </div>
              <div className='flex flex-row justify-center'>
                <span className='text-sm mt-px mr-2 w-16'>媒材: </span>
                <span className='font-bold'>{work.medium}</span>
              </div>
              <div className='flex flex-row justify-center'>
                <span className='text-sm mt-px mr-2 w-16'>管理單位: </span>
                <span className='font-bold'>{work.management}</span>
              </div>
            </div>

            {/* Description */}
            <div className='max-w-3xl text-lg font-medium tracking-wide leading-8 text-left'>
              {work.description.split('\n').map((paragraph, idx) => (
                <p key={idx} className='mb-4 last:mb-0'>
                  {paragraph}
                </p>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
