import React, { Children, useState, useCallback, useEffect, cloneElement, isValidElement, ReactNode, useMemo } from "react"

import './style.css'

//面板指示点位置类型
export type DotPosition = 'left' | 'right' | 'top' | 'bottom'

//面板切换动画类型
export type EffectType = 'slide' | 'fade'

//外部参数对象
export interface Props {
  autoplay?: boolean //是否自动播放
  dotPosition?: DotPosition //指示点位置
  effect?: EffectType //切换动画
  interval?: number //轮播间隔
  afterChange?: (current: number) => void //面板改变后回调函数
  beforeChange?: (from: number, to: number) => void //面板改变前回调函数
  children: ReactNode //子元素集合
  timeStep?: number //指示点进度条步长(毫秒)
}

export default function Carousel({
  autoplay,
  effect = 'slide',
  interval = 5000,
  children,
  dotPosition = 'bottom',
  beforeChange,
  afterChange,
  timeStep = 10
}: Props) {
  const [position, setPosition] = useState({ prev: 0, cur: 0 })
  const [interCount, setInterCount] = useState(0)

  const cnt = useMemo(() =>
    Children.map(children, (it: ReactNode, index) => {
      if (!isValidElement(it)) {
        console.warn('Carousel children must be an valid element')
        return null
      }
      // 是否当前面板
      const isCurrent = index === position.cur && index !== position.prev
      // 是否前一个面板
      const isPrev = index !== position.cur && index === position.prev
      //是否初始化状态
      const isInitial = position.prev === position.cur && position.prev === index
      const prefix = 'carousel-item'
      // 如果向后播放，使用左到右动画；如果向前播放，使用右到左动画
      const classNames = [
        it.props.className,
        prefix,
        isInitial ? `${prefix}-initial` : '',
        isCurrent ? `${prefix}-current` : '',
        isCurrent && position.prev < position.cur ? `${prefix}-current-${effect}` : '',
        isCurrent && position.prev > position.cur ? `${prefix}-current-${effect}-right` : '',
        isPrev ? `${prefix}-prev` : '',
        isPrev && position.prev < position.cur ? `${prefix}-prev-${effect}` : '',
        isPrev && position.prev > position.cur ? `${prefix}-prev-${effect}-right` : '',
      ].join(' ').trim();
      return cloneElement(it, { className: classNames })
    })
    , [children, position, effect,])

  const count = cnt?.length ?? 0

  useEffect(() => {
    if (!autoplay) {
      setInterCount(interval);
      return;
    }
    // 如果为自动播放，则计算指示点进度条行进位置
    const handle = window.setInterval(() => {
      if (interCount >= interval) {
        setPosition(v => ({ prev: v.cur, cur: (v.cur + 1) % count }))
        setInterCount(0);
      } else {
        setInterCount(v => (v + timeStep));
      }
    }, timeStep)
    return () => window.clearInterval(handle)
  }, [autoplay, interval, count, timeStep, interCount])

  const handleChange = useCallback(
    (value: number) => {
      beforeChange?.(position.cur, value)
      setPosition({ prev: position.cur, cur: value })
      setInterCount(0);
    },
    [position, beforeChange]
  )

  useEffect(() => {
    afterChange?.(position.cur)
  }, [position.cur, afterChange])

  if (count === 0) {
    throw new Error('Invalid Carousel Children')
  }

  return (
    <div className="carousel">
      <div className="carousel-inner">
        {cnt}
      </div>
      <CarouselDot
        value={position.cur}
        onChange={handleChange}
        position={dotPosition}
        dotCount={count}
        progress={interCount / interval}
      />
    </div>
  )
}

//指示点对象
interface CarouselDotProps {
  position?: DotPosition //位置
  dotCount: number //数量
  value: number //索引
  onChange: (value: number) => void, //指示点改变时回调函数
  progress: number //进度条位置
}

function CarouselDot({
  value,
  onChange,
  dotCount,
  position = 'bottom',
  progress
}: CarouselDotProps) {

  const classNames = ['carousel-dot', `carousel-dot-${position}`].join(' ').trim()

  const cnt = []
  for (let i = 0; i < dotCount; i++) {
    const itemClassNames = ['carousel-dot-item'].join(' ').trim()
    cnt.push(
      <div key={i} className={itemClassNames} onClick={() => onChange(i)}>
        {i === value ? (<p style={{ width: `${100 * progress}%`, backgroundColor: 'lightblue', height: '4px' }}></p>) : null}
      </div>
    )
  }

  return (
    <div className={classNames}>
      {cnt}
    </div>
  )
}
