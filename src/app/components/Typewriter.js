import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * 遞迴計算內容中的字元數（僅計算純文字）
 */
function countChars(content) {
  if (typeof content === 'string') {
    return content.length;
  }
  if (React.isValidElement(content)) {
    return countChars(content.props.children);
  }
  let count = 0;
  React.Children.forEach(content, (child) => {
    count += countChars(child);
  });
  return count;
}

/**
 * 遞迴根據剩餘字元數重建內容結構（保留格式）
 */
function revealChildren(children, count) {
  let remaining = count;
  if (React.isValidElement(children)) {
    const newChildren = revealChildren(children.props.children, remaining);
    return React.cloneElement(children, { children: newChildren });
  }
  return React.Children.map(children, (child) => {
    if (remaining <= 0) return null;
    if (typeof child === 'string') {
      if (child.length <= remaining) {
        remaining -= child.length;
        return child;
      } else {
        const res = child.slice(0, remaining);
        remaining = 0;
        return res;
      }
    } else if (React.isValidElement(child)) {
      const originalCount = countChars(child.props.children);
      const newChildren = revealChildren(child.props.children, remaining);
      const consumed = originalCount - countChars(newChildren);
      remaining -= consumed;
      return React.cloneElement(child, { children: newChildren });
    }
    return child;
  });
}


/**
 * 根據 content 以及 count，生成揭露內容
 * 如果 content 為純文字，直接 substring；若為格式化內容則用 revealChildren
 */
function revealContent(content, count) {
  if (typeof content === 'string') {
    // 將 <br/> 或 <br> 轉換為換行符號
    const modified = content.replace(/<br\s*\/?>/gi, '\n');
    const partial = modified.substring(0, count);
    return partial.split('\n').map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  }

  return revealChildren(content, count);
}

export function startTypewriter(r, delay = 0, fn = 'start', ...args) {
  if (!r) return;
  if (delay <= 0) {
    r.current?.[fn]?.(...args);
  } else {
    setTimeout(() => r.current?.[fn]?.(...args), delay);
  }
};

/**
 * 用於格式化內容的打字機元件（傳入 children）
 */
export function TypewriterFormatted({ children, speed = 50, start = false, className = '' }) {
  return <Typewriter key={key} content={children} speed={speed} start={start} className={className} />;
}

/**
 * 預設純文字陣列打字機元件，接收段落字串陣列
 */
export function TypewriterParagraph({ paragraphs, speed = 50, start = false, className = '' }) {
  return (
    <div className={className}>
      {paragraphs.map((para, index) => (
        <div key={index}>
          <Typewriter content={para} speed={speed} start={start} />
        </div>
      ))}
    </div>
  );
}


/**
 * 通用打字機效果元件，可以接受純文字或格式化內容
 *
 * props:
 * - content: 要打字的內容，可以是純文字字串或 React 節點
 * - speed: 每個字元的延遲（毫秒）
 * - start: 是否開始打字（由 false 轉 true 觸發打字效果）
 * - className: 外層容器的 className
 */
const Typewriter = forwardRef(
  (
    {
      contentKey = null,
      content,
      speed = 50,
      className = '',
      onDone = () => { },
      onlyContent = false,
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0);
    const [displayContent, setDisplayContent] = useState(content);

    const totalRef = useRef(countChars(content));
    const intervalRef = useRef(null);

    const runningRef = useRef(false);
    const completedRef = useRef(false);
    const prevKeyRef = useRef(contentKey);
    const lastChangeKey = useRef(null); // 避免重複 retype 同內容

    /* ---------------------------------------------
     * 內容 key 改變時重置狀態
     * --------------------------------------------- */
    useEffect(() => {
      if (prevKeyRef.current !== contentKey) {
        clearInterval(intervalRef.current);
        totalRef.current = countChars(content);
        setCharCount(0);
        runningRef.current = false;
        completedRef.current = false;
        setDisplayContent(content);
        prevKeyRef.current = contentKey;
      }
    }, [content, contentKey]);

    /* ---------------------------------------------
     * 外部控制 API
     * --------------------------------------------- */
    useImperativeHandle(ref, () => ({
      start: () => {
        if (completedRef.current || runningRef.current) return;
        runTyping(content);
      },
      reset: () => {
        clearInterval(intervalRef.current);
        runningRef.current = false;
        completedRef.current = false;
        setCharCount(0);
      },
      stop: () => {
        clearInterval(intervalRef.current);
        runningRef.current = false;
      },
      retype: (newContent, changeSpeed = 50) => {
        // 避免重複 retype 同內容
        if (lastChangeKey.current === newContent) return;
        lastChangeKey.current = newContent;

        clearInterval(intervalRef.current);
        runningRef.current = true;
        completedRef.current = false;

        const current = displayContent;
        const totalOld = countChars(current);
        let currentCount = totalOld;

        // Step 1: 倒退刪除
        intervalRef.current = setInterval(() => {
          currentCount -= 1;
          setCharCount(currentCount);
          if (currentCount <= 0) {
            clearInterval(intervalRef.current);
            // Step 2: 更新內容為新內容並重新打字
            setDisplayContent(newContent);
            totalRef.current = countChars(newContent);
            runTyping(newContent, changeSpeed);
          }
        }, changeSpeed);
      },
      getState: () => ({
        running: runningRef.current,
        completed: completedRef.current,
        total: totalRef.current,
        count: charCount,
      }),
    }));

    /* ---------------------------------------------
     * 核心打字邏輯（可被 start/retype 共用）
     * --------------------------------------------- */
    const runTyping = (text, speedVal = speed) => {
      clearInterval(intervalRef.current);
      setCharCount(0);
      runningRef.current = true;

      const total = countChars(text);
      let current = 0;

      intervalRef.current = setInterval(() => {
        current += 1;
        setCharCount(current);
        if (current >= total) {
          clearInterval(intervalRef.current);
          runningRef.current = false;
          completedRef.current = true;
          onDone?.();
        }
      }, speedVal);
    };

    /* ---------------------------------------------
     * 清除計時器
     * --------------------------------------------- */
    useEffect(() => {
      return () => clearInterval(intervalRef.current);
    }, []);

    const revealed = revealContent(displayContent, charCount);
    return onlyContent ? revealed : (
      <div className={className}>{revealed}</div>
    );
  }
);

export default Typewriter;