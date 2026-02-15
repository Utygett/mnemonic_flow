import * as React from 'react'

export function useGroupsCarousel() {
  const carouselRef = React.useRef<HTMLDivElement | null>(null)
  const isDownRef = React.useRef(false)
  const startXRef = React.useRef(0)
  const scrollLeftRef = React.useRef(0)

  const onWheelCarousel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return
    carouselRef.current.scrollBy({ left: e.deltaY, behavior: 'smooth' })
  }, [])

  const onMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return
    isDownRef.current = true
    carouselRef.current.classList.add('dragging')
    startXRef.current = e.pageX - carouselRef.current.offsetLeft
    scrollLeftRef.current = carouselRef.current.scrollLeft
  }, [])

  const onMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDownRef.current || !carouselRef.current) return
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - startXRef.current) * 1
    carouselRef.current.scrollLeft = scrollLeftRef.current - walk
  }, [])

  const onMouseUpOrLeave = React.useCallback(() => {
    if (!carouselRef.current) return
    isDownRef.current = false
    carouselRef.current.classList.remove('dragging')
  }, [])

  return { carouselRef, onWheelCarousel, onMouseDown, onMouseMove, onMouseUpOrLeave }
}
