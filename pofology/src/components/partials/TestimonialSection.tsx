import { reviews } from '@/data/reviews';
import Image from 'next/image';
import React from 'react';
import Slider, { Settings } from 'react-slick';
import { FiStar } from 'react-icons/fi';

const reviewSettings: Settings = {
  dots: true,
  infinite: true,
  speed: 800,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 4000,
  arrows: false,
  dotsClass: 'slick-dots custom-dots',
};

const TestimonialSection = () => {
  return (
    <section className="py-24 bg-white" id="testimonials">
      <div className="container">
        {/* Section Label */}
        <div className="text-center mb-4">
          <span className="text-sm font-bold text-indigo-600 tracking-[0.3em] uppercase">TESTIMONIALS</span>
        </div>
        
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 text-center tracking-tight">
          What My Clients Say
        </h2>

        {/* Testimonial Slider */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Slider {...reviewSettings}>
            {reviews.map((review, index) => (
              <div key={index} className="mb-6">
                <div className="flex flex-col items-center px-4">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} size={20} className="text-amber-400 fill-current" />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center mb-6 w-full">
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-100">
                      <Image
                        src={review.author.imageUrl}
                        height={64}
                        width={64}
                        alt={review.author.name}
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <h6 className="text-base font-bold text-gray-900">{review.author.name}</h6>
                      <p className="text-sm text-gray-500">
                        {review.author.designation} at {review.author.company}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
