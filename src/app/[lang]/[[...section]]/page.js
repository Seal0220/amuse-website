'use client';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import useLocale from '@/app/hooks/useLocale';
import useAnimator from '@/app/hooks/useAnimator';
import useSectionPathSync from './hooks/useSectionPathSync';

import Header from '@/app/components/Header';
import ContactUs from '@/app/components/ContactUs';
import Typewriter from '@/app/components/Typewriter';
import MemberCard from './components/MemberCard';


export default function HomePage() {
  const { localeDict } = useLocale();
  const locale = localeDict.pages.home;

  const animatorRef = useRef(null);
  const animator = useAnimator(animatorRef);

  const indexRef = useRef(null);

  const infoRef = useRef(null);
  const info2Ref = useRef(null);
  const infoTypewriter1Ref = useRef(null);
  const infoTypewriter2Ref = useRef(null);

  const aboutUsRef = useRef(null);
  
  const memberGroupRef = useRef(null);
  const member1Ref = useRef(null);
  const member2Ref = useRef(null);
  const member3Ref = useRef(null);
  const member4Ref = useRef(null);
  const membersRef = [member1Ref, member2Ref, member3Ref, member4Ref];
  const memberTypewriter1Ref = useRef(null);
  const memberTitle = ['我們的團隊', '團隊成員'];

  const circleGroupRef = useRef(null);
  const circle1Ref = useRef(null);
  const circle2Ref = useRef(null);
  const circle3Ref = useRef(null);
  const circle4Ref = useRef(null);
  const circle5Ref = useRef(null);
  const circlesRef = [circle1Ref, circle2Ref, circle3Ref, circle4Ref, circle5Ref];

  const contactUsRef = useRef(null);

  const pathname = usePathname();
  const segs = pathname.split('/').filter(Boolean);
  const lang = segs[0] || 'zh';


  // 啟動動畫
  useLayoutEffect(() => {
    animator.start();
    return () => animator.stop();
  }, []);

  // 掛上 URL ↔ 進度 同步 Hook
  const { onProgress } = useSectionPathSync({
    animator,
    pathname,
    lang,
    progressMap: { home: 0, team: 1.36, contact: 3 },
    thresholds: { homeEnd: 1, teamEnd: 2.5 },
  });

  // --------- 動畫定義 ----------
  const indexAni = animator.useAnimation(indexRef)
    .before({ on: 1 }, (ele) => {
      ele.style.transform = 'translateY(0)';
      ele.style.opacity = '100%';
    })
    .after({ on: 1 }, (ele) => {
      ele.style.transform = 'translateY(-100lvh)';
      ele.style.opacity = '0%';
    })
    .always((ele, vars, { progress }) => {
      onProgress(progress);
    });

  const infoAni = animator.useAnimation(infoRef)
    .before({ on: 0.15 }, (ele) => {
      ele.style.transform = 'translate(-100%, 40lvh)';
      ele.style.opacity = '0%';
      ele.style.fontSize = '6vw'
    })
    .when({ on: 0.15, to: 1 }, (ele) => {
      infoTypewriter1Ref.current?.start();

      ele.style.lineHeight = '8rem'
      ele.style.fontSize = '8rem';
      ele.style.transform = 'translate(0, 40lvh)';
      ele.style.opacity = '100%';
    })
    .when({ on: 1, to: 1.35 }, (ele) => {
      infoTypewriter1Ref.current?.start();
      infoTypewriter2Ref.current?.start();

      ele.style.lineHeight = '2rem'
      ele.style.fontSize = '1.25rem';
      ele.style.transform = 'translate(5rem, 60lvh)';
      ele.style.opacity = '100%';
    })
    .when({ on: 1.35, to: 1.7 }, (ele) => {
      infoTypewriter1Ref.current?.start();
      infoTypewriter2Ref.current?.start();

      ele.style.lineHeight = '2rem'
      ele.style.fontSize = '1.25rem';
      ele.style.transform = 'translate(5rem, 40lvh)';
      ele.style.opacity = '100%';
    })
    .when({ on: 1.7, to: 2.5 }, (ele) => {
      ele.style.transform = 'translate(5rem, 30lvh)';
      ele.style.opacity = '0%'
    })
    .after({ on: 2.5 }, (ele) => {
      ele.style.opacity = '0%';
    });

  const info2Ani = animator.useAnimation(info2Ref)
    .before({ on: 1 }, (ele) => {
      ele.style.opacity = '0%';
    })
    .when({ on: 1, to: 2.5 }, (ele) => {
      ele.style.opacity = '100%';
    })
    .after({ on: 2.5 }, (ele) => {
      ele.style.opacity = '0%';
    });

  const aboutUsAni = animator.useAnimation(aboutUsRef)
    .before({ on: 1 }, (ele) => {
      ele.style.transform = 'translateY(calc(100lvh + 5rem))';
      ele.style.opacity = '100%';
    })
    .when({ on: 1, to: 2.5 }, (ele) => {
      ele.style.transform = 'translateY(0)';
      ele.style.opacity = '100%';
    })
    .after({ on: 2.5 }, (ele) => {
      ele.style.opacity = '0%';
    });

  const membersAni = [...membersRef.map(memberRef => animator.useAnimation(memberRef))];
  const memberGroupAni = animator.useAnimation(memberGroupRef)
    .before({ on: 1 }, (ele) => {
      membersAni.forEach(memberAni => memberAni.ele.style.scale = 0);
      membersAni.forEach(memberAni => memberAni.ele.style.opacity = '0%');
      membersAni.forEach(memberAni => memberAni.ele.style.margin = '0');
      membersAni.forEach(memberAni => memberAni.ele.setIsShowDetail(false));

      ele.style.transform = 'translateY(75lvh)';
    })
    .when({ on: 1, to: 1.35 }, (ele) => {
      memberTypewriter1Ref.current?.retype(memberTitle[0], 120);

      membersAni.forEach(memberAni => memberAni.ele.style.scale = 0);
      membersAni.forEach(memberAni => memberAni.ele.style.opacity = '0%');
      membersAni.forEach(memberAni => memberAni.ele.style.margin = '0');
      membersAni.forEach(memberAni => memberAni.ele.setIsShowDetail(false));

      ele.style.transform = 'translateY(65lvh)';
    })
    .when({ on: 1.35, to: 1.7 }, (ele) => {
      memberTypewriter1Ref.current?.retype(memberTitle[0], 120);

      membersAni.forEach(memberAni => memberAni.ele.style.scale = 1);
      membersAni.forEach(memberAni => memberAni.ele.style.opacity = '100%');
      membersAni.forEach(memberAni => memberAni.ele.style.margin = '0');
      membersAni.forEach(memberAni => memberAni.ele.setIsShowDetail(false));

      ele.style.transform = 'translateY(65lvh)';
    })
    .when({ on: 1.7, to: 2.5 }, (ele) => {
      memberTypewriter1Ref.current?.retype(memberTitle[1], 120);

      membersAni.forEach(memberAni => memberAni.ele.style.scale = 1);
      membersAni.forEach(memberAni => memberAni.ele.style.opacity = '100%');
      membersAni.forEach(memberAni => memberAni.ele.style.margin = '0 2rem 0 2rem');
      membersAni.forEach(memberAni => memberAni.ele.setIsShowDetail(true));

      ele.style.transform = 'translateY(50lvh)';
    })
    .after({ on: 2.5 }, (ele) => {
    });

  const circlesAni = [...circlesRef.map(circleRef => animator.useAnimation(circleRef))];
  const circleGroupAni = animator.useAnimation(circleGroupRef)
    .before({ on: 0.15 }, (ele) => {
      circlesAni.forEach(circleAni => circleAni.ele.style.scale = 0);
      circlesAni.forEach(circleAni => circleAni.ele.style.transform = 'translate(0, 0)');
      ele.style.opacity = '0%';
    })
    .when({ on: 0.15, to: 0.75 }, (ele) => {
      circlesAni.forEach(circleAni => circleAni.ele.style.scale = 1);
      circlesAni.forEach(circleAni => circleAni.ele.style.transform = 'translate(0, 0)');
      ele.style.opacity = '100%';
    })
    .when({ on: 0.75, to: 1.35 }, (ele) => {
      circlesAni.forEach(circleAni => circleAni.ele.style.scale = 1.2);
      circlesAni.forEach(circleAni => circleAni.ele.style.transform = 'translate(0, 0)');
      ele.style.opacity = '100%';
    })
    .when({ on: 1.35, to: 1.7 }, (ele) => {
      circlesAni.forEach(circleAni => circleAni.ele.style.scale = 1.4);
      circlesAni.forEach(circleAni => circleAni.ele.style.transform = 'translate(0, 0)');
      ele.style.opacity = '100%';
    })
    .when({ on: 1.7, to: 2.5 }, (ele) => {
      circlesAni.forEach(circleAni => circleAni.ele.style.scale = 2);
      circlesAni.forEach(circleAni => circleAni.ele.style.transform = 'translate(-23vw, 30lvh)');
      ele.style.opacity = '70%';
    })
    .after({ on: 2.5 }, (ele) => {
      ele.style.opacity = '0%';
    });

  return (
    <main ref={animatorRef} className='relative w-full min-h-[400lvh] text-white flex flex-col'>
      <Header />

      {/* 封面 */}
      <section className='min-h-[200lvh]'>
        <div
          ref={indexRef}
          className='fixed -z-10 w-full h-lvh translate-y-0 flex items-center justify-center bg-gray-300 overflow-hidden transition ease-in-out duration-500'
        >
          <img src='/banner-test.png' className='min-w-full min-h-full object-cover select-none' />

          {/* Nav 2 */}
          <div className='absolute flex items-center justify-center p-12 pt-18 box-border bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-900 via-70% via-neutral-900/70 to-100% to-transparent'>
            <div className='flex flex-row gap-6'>
              <img src='/ig-logo.png' className='size-8' />
              <img src='/fb-logo.png' className='size-8' />
            </div>
            {/* <div className='text-xs select-none'>Copyright © 2024 amuse art and design 阿木司設計 All right reserved.</div> */}
          </div>
        </div>
      </section>


      {/* 簡介 */}
      <div
        ref={infoRef}
        style={{ transform: 'translate(-100%, 40lvh)' }}
        className='fixed z-20 top-0 left-0 drop-shadow-xl drop-shadow-black/70 max-w-[80vw] transition-all ease-in-out duration-500'
      >
        <Typewriter
          ref={infoTypewriter1Ref}
          content={(
            <p>阿木司設計是由藝術家，設計師與博物館人組成的團隊。</p>
          )}
          speed={50}
          className='flex flex-col gap-4 drop-shadow-md drop-shadow-white/70 font-extrabold'
        />

        <div
          ref={info2Ref}
          className='transition-all ease-in-out duration-500'
        >
          <Typewriter
            ref={infoTypewriter2Ref}
            content={(
              <>
                <p>也因為不同專長領域的結合，作品橫跨藝術創作、公共藝術、博物館設計規劃、空間設計等。在於作品的脈絡上緊密思考空間與環境的可能性，透過作品的操作延伸場域的脈絡，善於整合不同媒材與媒體於空間之中。</p>
                <p>致力於在空間、立體、動力、機械與科技等項目中展現最深刻的感受與想像。</p>
              </>
            )}
            speed={50}
            className='flex flex-col gap-4 drop-shadow-md drop-shadow-white/70 font-extrabold mt-4'
          />
        </div>
      </div>

      {/* 我們的團隊 */}
      <section className='min-h-[100lvh]'>
        <div
          ref={aboutUsRef}
          style={{ transform: 'translateY(calc(100lvh + 5rem))' }}
          className='fixed z-10 top-0 w-full min-h-lvh flex justify-center bg-neutral-950 p-40 transition ease-in-out duration-700'
        >
          <h1 className='absolute z-10 right-0 text-[12rem] font-bold text-right select-none'>
            <Typewriter
              ref={memberTypewriter1Ref}
              speed={500}
              className='flex'
            />
          </h1>
          <p className='text-gray-400 max-w-2xl leading-relaxed'>{locale.description}</p>
          <div className='absolute -top-20 w-full h-20 bg-gradient-to-t from-5% from-neutral-950 via-50% via-neutral-950/70 to-100% to-transparent'></div>

          <div
            ref={memberGroupRef}
            style={{ transform: 'translateY(75lvh)' }}
            className='absolute z-6 top-0 transition ease-in-out duration-700'
          >
            <div className='flex flex-row justify-center items-center gap-32'>

              <MemberCard
                ref={member1Ref}
                name="林建佑"
                img="/members/01.jpg"
                details={{ education: '藝術大學 美術學系', specialty: '雕塑、公共藝術' }}
                showDetail={true}
              />

              <MemberCard
                ref={member2Ref}
                name="林建佑"
                img="/members/02.jpg"
                details={{ education: '藝術大學 美術學系', specialty: '雕塑、公共藝術' }}
                showDetail={true}
              />

              <MemberCard
                ref={member3Ref}
                name="林建佑"
                img="/members/03.jpg"
                details={{ education: '藝術大學 美術學系', specialty: '雕塑、公共藝術' }}
                showDetail={true}
              />

              <MemberCard
                ref={member4Ref}
                name="林建佑"
                img="/members/04.jpg"
                details={{ education: '藝術大學 美術學系', specialty: '雕塑、公共藝術' }}
                showDetail={true}
              />
            </div>
          </div>

          {/* Circles */}
          <div
            ref={circleGroupRef}
            className='absolute z-5 flex items-center justify-center transition ease-in-out duration-700'
          >
            <div ref={circle1Ref} className='absolute border border-white/50 size-40 rounded-full shadow-[0_0_64px_8px] shadow-white/20 transition ease-in-out duration-200' />
            <div ref={circle2Ref} className='absolute border border-white/50 size-80 rounded-full shadow-[0_0_64px_8px] shadow-white/20 transition ease-in-out duration-300' />
            <div ref={circle3Ref} className='absolute border border-white/50 size-160 rounded-full shadow-[0_0_64px_8px] shadow-white/20 transition ease-in-out duration-[500ms]' />
            <div ref={circle4Ref} className='absolute border border-white/50 size-320 rounded-full shadow-[0_0_64px_8px] shadow-white/20 transition ease-in-out duration-[800ms]' />
            <div ref={circle5Ref} className='absolute border border-white/50 size-640 rounded-full shadow-[0_0_64px_8px] shadow-white/20 transition ease-in-out duration-[1600ms]' />
          </div>
        </div>
      </section>

      {/* 聯絡我們 */}
      <section ref={contactUsRef} className='bottom-0 mt-auto'>
        <ContactUs />
      </section>
    </main>
  );
}
