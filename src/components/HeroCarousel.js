"use client"
import { useState, useEffect } from 'react';
import { useStore } from "@/lib/store";

const slides = [
  {
    id: 1,
    image: '/slide_1-removebg-preview.png',
    title: 'Mau belanja lebih hemat?',
    subtitle: 'Cek promo asyik kami sekarang juga!',
    buttonText: 'Cek Promo',
    color: '#0ea5e9', // sky blue
    action: (setCategory) => {
      document.getElementById('discountGrid')?.scrollIntoView({behavior:'smooth'})
    },
    imgStyle: { transform: 'scale(1.25) translateY(-20px)', transformOrigin: 'bottom center' }
  },
  {
    id: 2,
    image: '/slide_2-removebg-preview.png',
    title: 'Gratis Ongkir!',
    subtitle: 'Belanja dari rumah, pesanan langsung diantar!',
    buttonText: 'Mulai Belanja',
    color: '#f97316', // orange
    action: (setCategory) => {
      setCategory('Semua Barang')
      document.getElementById('landingGrid')?.scrollIntoView({behavior:'smooth'})
    },
    imgStyle: { transform: 'scale(1.25) translateY(-20px)', transformOrigin: 'bottom center' }
  },
  {
    id: 3,
    image: '/slide_3-removebg-preview.png',
    title: 'Kejutan Akhir Pekan',
    subtitle: 'Nikmati potongan harga spesial hingga 50%.',
    buttonText: 'Lihat Diskon',
    color: '#a855f7', // purple
    action: (setCategory) => {
      document.getElementById('discountGrid')?.scrollIntoView({behavior:'smooth'})
    },
    imgStyle: { transform: 'scale(1.25) translateY(-20px)', transformOrigin: 'bottom center' }
  },
  {
    id: 4,
    image: '/slide_4-removebg-preview.png',
    title: 'Bahan Pangan Segar',
    subtitle: 'Kualitas terbaik langsung dari petani ke dapurmu.',
    buttonText: 'Pilih Sembako',
    color: '#10b981', // emerald green
    action: (setCategory) => {
      setCategory('Sembako')
      document.getElementById('landingGrid')?.scrollIntoView({behavior:'smooth'})
    },
    imgStyle: {}
  }
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const setLandingCategory = useStore((state) => state.setLandingCategory);
  const length = slides.length;

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrent(current === length - 1 ? 0 : current + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [current, isHovered, length]);

  const nextSlide = () => {
    setCurrent(current === length - 1 ? 0 : current + 1);
  };

  const prevSlide = () => {
    setCurrent(current === 0 ? length - 1 : current - 1);
  };

  return (
    <div 
      className="carousel-container" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="carousel-arrow left" 
        onClick={prevSlide}
        style={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        <i className="fas fa-chevron-left"></i>
      </div>

      <div 
        className="carousel-arrow right" 
        onClick={nextSlide}
        style={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        <i className="fas fa-chevron-right"></i>
      </div>

      {slides.map((slide, index) => (
        <div 
          className={`carousel-slide ${index === current ? 'active' : ''}`} 
          key={slide.id}
          style={{ 
            backgroundColor: slide.color
          }}
        >
          <div className="carousel-content">
            <h2>{slide.title}</h2>
            <p>{slide.subtitle}</p>
            <button 
              className="btn" 
              style={{ background: "white", color: slide.color, padding: "10px 24px", fontSize: "0.9rem", border: "none", borderRadius: "999px", marginTop: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", fontWeight: 800 }}
              onClick={() => slide.action(setLandingCategory)}
            >
              {slide.buttonText}
            </button>
          </div>
          <div className="carousel-mascot">
            <img src={slide.image} alt={slide.title} style={slide.imgStyle} />
          </div>
        </div>
      ))}

      <div className="carousel-dots">
        {slides.map((slide, index) => (
          <div 
            key={slide.id} 
            className={`carousel-dot ${index === current ? 'active' : ''}`}
            onClick={() => setCurrent(index)}
          ></div>
        ))}
      </div>
    </div>
  );
}
