'use client';
import { useEffect, useRef } from 'react';

/**
 * 同頁多區段（home / team / contact）的 URL 與動畫雙向同步 Hook
 *
 * @param {Object} params
 * @param {object} params.animator - 你的 useAnimator(animatorRef) 回傳物件（需支援 seek(progress,{smooth})）
 * @param {string} params.pathname - 來自 usePathname() 的目前路徑
 * @param {string} params.lang - 語言段（路徑第一段）
 * @param {Object} [params.progressMap] - 各區段對應進度
 * @param {number} [params.progressMap.home=0]
 * @param {number} [params.progressMap.team=0.5]
 * @param {number} [params.progressMap.contact=2.6]
 * @param {Object} [params.thresholds] - 區段分界（對齊你的動畫設定）
 * @param {number} [params.thresholds.homeEnd=0.5]  - home < 0.5
 * @param {number} [params.thresholds.teamEnd=2.5]  - team [0.5, 2.5)
 *
 * @returns {{ onProgress: (progress:number)=>void }}
 */
export default function useSectionPathSync({
  animator,
  pathname,
  lang,
  progressMap = { home: 0, team: 0.5, contact: 2.6 },
  thresholds = { homeEnd: 0.5, teamEnd: 2.5 },
}) {
  const lastSectionRef = useRef(null);      // 目前 URL 所對應的區段
  const isProgrammaticRef = useRef(false);  // 我方剛 replaceState 的旗標
  const urlSyncReadyRef = useRef(false);    // URL 同步是否就緒
  const desiredSectionRef = useRef(null);   // 這次要去的目標區段

  const isHome = (p) => p < thresholds.homeEnd;
  const isTeam = (p) => p >= thresholds.homeEnd && p < thresholds.teamEnd;
  const isContact = (p) => p >= thresholds.teamEnd;

  const writeUrl = (section, mode = 'replace') => {
    const target = section === 'home' ? `/${lang}` : `/${lang}/${section}`;
    const url = typeof window !== 'undefined'
      ? target + window.location.search
      : target;

    isProgrammaticRef.current = true;
    if (mode === 'push') {
      window.history.pushState(null, '', url);
    } else {
      window.history.replaceState(null, '', url);
    }
  };

  /**
   * 在動畫每一幀（你的 indexAni.always 內）呼叫，讓 Hook 判斷該不該同步網址
   */
  const onProgress = (progress) => {
    // 未就緒：平滑 seek 前往目標途中，只在「抵達目標區段」時寫一次網址並開啟同步
    if (!urlSyncReadyRef.current) {
      if (desiredSectionRef.current) {
        const goal = desiredSectionRef.current;
        const reached =
          (goal === 'home' && isHome(progress)) ||
          (goal === 'team' && isTeam(progress)) ||
          (goal === 'contact' && isContact(progress));

        if (reached) {
          urlSyncReadyRef.current = true;
          lastSectionRef.current = goal;
          writeUrl(goal, 'replace');
          desiredSectionRef.current = null;
        }
      }
      return;
    }

    // 已就緒：滾動即時同步網址（防止中途抖動）
    const section =
      isHome(progress) ? 'home' :
        isTeam(progress) ? 'team' :
          'contact';

    if (section !== lastSectionRef.current) {
      lastSectionRef.current = section;
      writeUrl(section, 'replace');
    }
  };

  // 首次進入 / 路徑變更：根據 URL 定位動畫
  useEffect(() => {
    if (!animator) return;

    // 關閉 URL 同步，避免初始定位期間被洗掉
    urlSyncReadyRef.current = false;

    // 若是我們剛 replaceState 引起的 pathname 變化，略過一次 seek
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      requestAnimationFrame(() => { urlSyncReadyRef.current = true; });
      return;
    }

    const segs = pathname.split('/').filter(Boolean);
    const currentSeg = segs[1] || 'home';

    if (currentSeg === 'team') {
      desiredSectionRef.current = 'team';
      animator.seek(progressMap.team, { smooth: true });
      lastSectionRef.current = 'team';
    } else if (currentSeg === 'contact') {
      desiredSectionRef.current = 'contact';
      animator.seek(progressMap.contact, { smooth: true });
      lastSectionRef.current = 'contact';
    } else {
      desiredSectionRef.current = 'home';
      animator.seek(progressMap.home, { smooth: true });
      lastSectionRef.current = 'home';
    }
    // 不在這裡開啟同步：等 onProgress 偵測抵達目標區段後才開
  }, [pathname, animator, lang, progressMap.team, progressMap.contact, progressMap.home]);

  // 監聽 Header 派發的同頁導航事件
  useEffect(() => {
    const onNavigate = (e) => {
      const goal = e.detail; // 'home' | 'team' | 'contact'
      if (!goal || !animator) return;

      // 先改網址為 pushState（可返回），但等抵達目標才開啟同步與覆寫
      const targetProgress =
        goal === 'home' ? progressMap.home :
          goal === 'team' ? progressMap.team : progressMap.contact;

      // 立即 push，維持可分享/返回（與 replace 分離）
      const targetPath = goal === 'home' ? `/${lang}` : `/${lang}/${goal}`;
      const url = targetPath + window.location.search;
      window.history.pushState(null, '', url);

      urlSyncReadyRef.current = false;
      desiredSectionRef.current = goal;
      animator.seek(targetProgress, { smooth: true });
    };

    window.addEventListener('section:navigate', onNavigate);
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    return () => {
      window.removeEventListener('section:navigate', onNavigate);
    };
  }, [animator, lang, progressMap.team, progressMap.contact, progressMap.home]);

  return { onProgress };
}
